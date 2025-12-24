/**
 * MAXIMUM SPEED Agent Swarm
 * Optimized for absolute fastest response times
 * 
 * Strategy:
 * 1. Parallel LLM calls with key pools
 * 2. First-response-wins (don't wait for all)
 * 3. Speculative execution
 * 4. Aggressive caching
 */

import { complete, parseJsonResponse, OpenRouterConfig } from './openrouter';

// =============================================================================
// SPEED-OPTIMIZED MODEL CONFIG
// =============================================================================

// Fastest models first (ordered by latency)
export const SPEED_MODELS = {
    // TIER 1: Ultra-fast (<500ms typical)
    flash: 'xiaomi/mimo-v2-flash:free',

    // TIER 2: Fast (<1s typical)
    deepseek: 'deepseek/deepseek-chat',
    nemotron: 'nvidia/llama-3.1-nemotron-70b-instruct:free',

    // TIER 3: Thorough (1-3s typical)
    deepResearch: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    olmo: 'allenai/olmo-2-0325-32b-instruct:free',

    // TIER 4: Deep reasoning (slow but accurate)
    hermes405b: 'nousresearch/hermes-3-llama-3.1-405b:free',
} as const;

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
    timeoutMs: number = 5000
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
                    ], { temperature: 0.3, maxTokens: 1000 });

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
        [SPEED_MODELS.flash, SPEED_MODELS.deepseek, SPEED_MODELS.nemotron],
        baseUrl,
        3000 // 3 second timeout
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

const TICKER_PROMPT = `You are a stock analyst. Provide a brief on this ticker. Respond ONLY in JSON:
{"bullets":["point1","point2","point3"],"riskNotes":["risk1"],"sentiment":"bullish|bearish|neutral"}

Be concise. Max 3 bullets, 2 risks.`;

export async function fastTickerAnalysis(
    symbol: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ bullets: string[]; riskNotes: string[]; sentiment: string; latencyMs: number }> {
    const startTime = Date.now();

    // Race all fast models
    const result = await raceModels(
        `${TICKER_PROMPT}\n\nTicker: ${symbol}`,
        apiKey,
        [SPEED_MODELS.flash, SPEED_MODELS.deepseek, SPEED_MODELS.deepResearch],
        baseUrl,
        4000 // 4 second timeout
    );

    const parsed = parseJsonResponse<{ bullets: string[]; riskNotes: string[]; sentiment: string }>(result.content);

    return {
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
