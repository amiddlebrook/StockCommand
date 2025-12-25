/**
 * MAXIMUM SPEED Agent Swarm
 * 9 FREE OpenRouter LLMs
 */

import { complete, parseJsonResponse, OpenRouterConfig } from './openrouter';

// =============================================================================
// 9 FREE OPENROUTER MODELS
// =============================================================================

export const ALL_MODELS = {
    // SPECIALIZED AGENTS
    router: 'xiaomi/mimo-v2-flash:free',             // <500ms Classification
    analyst: 'nex-agi/deepseek-v3.1-nex-n1:free',   // Balanced Analysis
    coder: 'kwaipilot/kat-coder-pro:free',          // Tool/App Creation
    chat: 'openai/gpt-oss-120b:free',               // General Chat
    deepResearch: 'alibaba/tongyi-deepresearch-30b-a3b:free', // Background Deep Dives

    // UTILITY / REASONING
    reasoning: 'nousresearch/hermes-3-llama-3.1-405b:free', // Complex Logic
    fastTask: 'nex-agi/deepseek-v3.1-nex-n1:free', // Fast Extraction (same as analyst - confirmed free)
    general: 'openai/gpt-oss-20b:free',             // General purpose fast
} as const;

// Role-based aliases for clean usage in worker.ts
export const ROLE_MODELS = {
    ROUTER: ALL_MODELS.router,
    ANALYST: ALL_MODELS.analyst,
    CODER: ALL_MODELS.coder,
    CHAT: ALL_MODELS.chat,
    RESEARCHER: ALL_MODELS.deepResearch,
    REASONING: ALL_MODELS.reasoning,
    FAST: ALL_MODELS.fastTask,
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

    console.log(`[raceModels] Starting with ${models.length} models, plugins:`, plugins);

    try {
        // Race all models in parallel
        const result = await Promise.race(
            models.map(async (model): Promise<RaceResult> => {
                try {
                    const config: OpenRouterConfig = { apiKey, model, baseUrl };
                    const response = await complete(config, [
                        { role: 'user', content: prompt },
                    ], { temperature: 0.3, maxTokens: 1000, plugins });

                    console.log(`[raceModels] Model ${model} responded: ${response.substring(0, 100)}...`);

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
                    throw new Error('Invalid response - too short');
                } catch (e: any) {
                    // This model failed, throw to let others win
                    console.error(`[raceModels] Model ${model} failed:`, e.message);
                    throw e;
                }
            })
        );

        return result;
    } catch (e: any) {
        // All models failed, return fallback
        console.error(`[raceModels] ALL models failed:`, e.message);
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
// BLAZING FAST CLOCK ANALYSIS
// =============================================================================

const CLOCK_PROMPT = `Indicator: {LABEL}. Status? JSON only:
{"status":"green|yellow|red","reason":"10 words max"}`;

export async function fastClockAnalysis(
    clockLabel: string,
    query: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ status: 'green' | 'yellow' | 'red'; reason: string; confidence: number; latencyMs: number }> {
    const startTime = Date.now();

    // SPEED MODE: Use FAST model for analysis
    // NOTE: Web plugin may not work with free models, so we just prompt for analysis
    const result = await raceModels(
        CLOCK_PROMPT.replace('{LABEL}', clockLabel) + `\nContext: ${query}`,
        apiKey,
        [ROLE_MODELS.FAST],
        baseUrl,
        8000,
        [] // No plugins - free models may not support web plugin
    );

    console.log(`[fastClockAnalysis] Clock: ${clockLabel}, raw response: ${result.content.substring(0, 200)}`);

    const parsed = parseJsonResponse<{ status: 'green' | 'yellow' | 'red'; reason: string }>(result.content);

    console.log(`[fastClockAnalysis] Parsed:`, parsed);

    return {
        status: parsed?.status || 'yellow',
        reason: parsed?.reason || 'Updating...',
        confidence: 0.8,
        latencyMs: Date.now() - startTime,
    };
}

// =============================================================================
// TICKER ANALYSIS (Web Search for Real Data - Runs in BACKGROUND CRON)
// =============================================================================

const TICKER_PROMPT = `Stock: {SYMBOL}. Provide brief analysis. JSON only:
{"sentiment":"bullish|bearish|neutral","outlook":"one sentence on near-term outlook","key_factor":"main driver for this stock"}`;

export async function fastTickerAnalysis(
    symbol: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ price: number; change: number; changePercent: number; volume: number; bullets: string[]; riskNotes: string[]; sentiment: string; latencyMs: number }> {
    const startTime = Date.now();

    // Use FAST model for analysis (no web plugin for free models)
    const result = await raceModels(
        TICKER_PROMPT.replace('{SYMBOL}', symbol),
        apiKey,
        [ROLE_MODELS.FAST],
        baseUrl,
        10000,
        [] // No web plugin - free models don't support it
    );

    console.log(`[fastTickerAnalysis] ${symbol} raw response:`, result.content.substring(0, 300));

    const parsed = parseJsonResponse<{ sentiment: string; outlook: string; key_factor: string }>(result.content);

    console.log(`[fastTickerAnalysis] ${symbol} parsed:`, parsed);

    // Build analysis bullets from parsed response
    const bullets: string[] = [];
    if (parsed?.outlook) bullets.push(parsed.outlook);
    if (parsed?.key_factor) bullets.push(`Key factor: ${parsed.key_factor}`);
    if (bullets.length === 0) bullets.push('Analyzing...');

    return {
        price: 0, // LLM can't provide real-time prices
        change: 0,
        changePercent: 0,
        volume: 0,
        bullets,
        riskNotes: [],
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
