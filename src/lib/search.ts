/**
 * MAXIMUM SPEED Agent Swarm
 * 9 FREE OpenRouter LLMs
 */

import { complete, parseJsonResponse, OpenRouterConfig } from './openrouter';

// =============================================================================
// 9 FREE OPENROUTER MODELS
// =============================================================================

export const ALL_MODELS = {
    // TIER 1: Ultra-fast (<500ms)
    mimoFlash: 'xiaomi/mimo-v2-flash:free',

    // TIER 2: Fast (<1s)
    deepseekNex: 'nex-agi/deepseek-v3.1-nex-n1:free',
    gptOss20b: 'openai/gpt-oss-20b:free',
    nemotron: 'nvidia/llama-3.1-nemotron-70b-instruct:free',

    // TIER 3: Thorough (1-3s)
    deepResearch: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    olmo: 'allenai/olmo-2-0325-32b-instruct:free',
    gptOss120b: 'openai/gpt-oss-120b:free',
    katCoder: 'kwaipilot/kat-coder-pro:free',

    // TIER 4: Deep reasoning (2-5s)
    hermes405b: 'nousresearch/hermes-3-llama-3.1-405b:free',
} as const;

// Alias for backwards compatibility
export const SPEED_MODELS = ALL_MODELS;

// Key pools for horizontal scaling (env var names)
export const KEY_POOLS = {
    // High-frequency roles get more keys
    router: ['OPENROUTER_ROUTER_KEY_1', 'OPENROUTER_ROUTER_KEY_2', 'OPENROUTER_ROUTER_KEY_3'],
    render: ['OPENROUTER_RENDER_KEY_1', 'OPENROUTER_RENDER_KEY_2'],

    // Background roles need fewer keys
    extract: ['OPENROUTER_EXTRACT_KEY_1'],
    synth: ['OPENROUTER_SYNTH_KEY_1'],
    valid: ['OPENROUTER_VALID_KEY_1'],
} as const;

// =============================================================================
// KEY POOL MANAGEMENT
// =============================================================================

let keyIndex: Record<string, number> = {};

export function getKeyFromPool(env: any, role: keyof typeof KEY_POOLS): string {
    const pool = KEY_POOLS[role];

    // Round-robin selection
    if (!keyIndex[role]) keyIndex[role] = 0;
    const idx = keyIndex[role] % pool.length;
    keyIndex[role]++;

    // Get key from env, fallback to primary
    return env[pool[idx]] || env.OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '';
}

// =============================================================================
// FIRST-RESPONSE-WINS RACING
// =============================================================================

export interface RaceResult {
    content: string;
    model: string;
    latencyMs: number;
    confidence: number;
}

/**
 * Race multiple models - return first valid response
 * This is THE key to speed: don't wait for slow models
 */
export async function raceModels(
    prompt: string,
    apiKey: string,
    models: string[],
    baseUrl?: string,
    timeoutMs: number = 5000,
    plugins: any[] = []
): Promise<RaceResult> {
    const startTime = Date.now();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Race all models in parallel
        const result = await Promise.race(
            models.map(async (model): Promise<RaceResult> => {
                try {
                    const config: OpenRouterConfig = { apiKey, model, baseUrl };
                    const response = await complete(config, [
                        { role: 'user', content: prompt },
                    ], { temperature: 0.3, maxTokens: 1000, plugins });

                    // Only return if we got a valid response
                    if (response && response.length > 10) {
                        return {
                            content: response,
                            model,
                            latencyMs: Date.now() - startTime,
                            confidence: 0.8,
                        };
                    }
                    // Invalid response, throw to continue racing
                    throw new Error('Invalid response');
                } catch (e) {
                    // This model failed, throw to let others win
                    throw e;
                }
            })
        );

        return result;
    } catch (e) {
        // All models failed, return fallback
        return {
            content: 'Analysis pending...',
            model: 'fallback',
            latencyMs: Date.now() - startTime,
            confidence: 0,
        };
    } finally {
        clearTimeout(timeout);
    }
}

// =============================================================================
// SPEED-OPTIMIZED CLOCK RESEARCH
// =============================================================================

const CLOCK_PROMPT = `You are a market analyst. Analyze this indicator and respond ONLY in JSON:
{"status":"green|yellow|red","reason":"one sentence","confidence":0.8}

green=bullish, yellow=neutral, red=bearish. Be concise.`;

export async function fastClockAnalysis(
    clockLabel: string,
    query: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ status: 'green' | 'yellow' | 'red'; reason: string; confidence: number; latencyMs: number }> {
    const startTime = Date.now();

    // Race TIER 1 + TIER 2 models for fastest response
    const result = await raceModels(
        `${CLOCK_PROMPT}\n\nIndicator: ${clockLabel}\nQuery: ${query}`,
        apiKey,
        [SPEED_MODELS.mimoFlash, SPEED_MODELS.deepseekNex, SPEED_MODELS.nemotron],
        baseUrl,
        10000, // Increased timeout for search
        [{ id: "web" }] // Enable Web Search
    );

    const parsed = parseJsonResponse<{ status: 'green' | 'yellow' | 'red'; reason: string; confidence: number }>(result.content);

    return {
        status: parsed?.status || 'yellow',
        reason: parsed?.reason || 'Analyzing...',
        confidence: parsed?.confidence || result.confidence,
        latencyMs: Date.now() - startTime,
    };
}

// =============================================================================
// SPEED-OPTIMIZED TICKER RESEARCH
// =============================================================================

const TICKER_PROMPT = `You are a stock analyst. Use search to find the latest real-time data for this ticker. Respond ONLY in JSON:
{"price":123.45,"change":1.23,"changePercent":1.5,"volume":1000000,"bullets":["point1","point2"],"sentiment":"bullish|bearish|neutral"}

IMPORTANT: You MUST search for the LATEST price.`;

export async function fastTickerAnalysis(
    symbol: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ price: number; change: number; changePercent: number; volume: number; bullets: string[]; riskNotes: string[]; sentiment: string; latencyMs: number }> {
    const startTime = Date.now();

    // Race all fast models
    const result = await raceModels(
        `${TICKER_PROMPT}\n\nTicker: ${symbol}`,
        apiKey,
        [SPEED_MODELS.mimoFlash, SPEED_MODELS.deepseekNex, SPEED_MODELS.deepResearch],
        baseUrl,
        10000, // Increased timeout for search
        [{ id: "web" }] // Enable Web Search
    );

    const parsed = parseJsonResponse<{ price: number; change: number; changePercent: number; volume: number; bullets: string[]; riskNotes: string[]; sentiment: string }>(result.content);

    return {
        price: parsed?.price || 0,
        change: parsed?.change || 0,
        changePercent: parsed?.changePercent || 0,
        volume: parsed?.volume || 0,
        bullets: parsed?.bullets || ['Loading analysis...'],
        riskNotes: parsed?.riskNotes || [],
        sentiment: parsed?.sentiment || 'neutral',
        latencyMs: Date.now() - startTime,
    };
}

// =============================================================================
// SPECULATIVE EXECUTION (Pre-warm popular tickers)
// =============================================================================

const POPULAR_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY', 'QQQ'];

export function getPopularTickers(): string[] {
    return POPULAR_TICKERS;
}
