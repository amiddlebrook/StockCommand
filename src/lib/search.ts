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
    fastTask: 'nvidia/llama-3.1-nemotron-70b-instruct:free', // Fast Extraction
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

    // SPEED MODE: Use FAST model with web search for current data
    const result = await raceModels(
        CLOCK_PROMPT.replace('{LABEL}', clockLabel) + `\nContext: ${query}`,
        apiKey,
        [ROLE_MODELS.FAST],
        baseUrl,
        8000, // 8 second timeout
        [{ id: "web" }] // Clocks need web for current conditions
    );

    const parsed = parseJsonResponse<{ status: 'green' | 'yellow' | 'red'; reason: string }>(result.content);

    return {
        status: parsed?.status || 'yellow',
        reason: parsed?.reason || 'Updating...',
        confidence: 0.8,
        latencyMs: Date.now() - startTime,
    };
}

// =============================================================================
// BLAZING FAST TICKER ANALYSIS (No Web Search = 10x Faster)
// =============================================================================

const FAST_TICKER_PROMPT = `Stock: {SYMBOL}. JSON only:
{"price":0,"change":0,"changePercent":0,"sentiment":"neutral","bullet":"one line"}`;

export async function fastTickerAnalysis(
    symbol: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ price: number; change: number; changePercent: number; volume: number; bullets: string[]; riskNotes: string[]; sentiment: string; latencyMs: number }> {
    const startTime = Date.now();

    // SPEED MODE: No web search, use LLM's training knowledge
    // This is 10x faster (~1-3s vs 15-30s)
    const result = await raceModels(
        FAST_TICKER_PROMPT.replace('{SYMBOL}', symbol),
        apiKey,
        [ROLE_MODELS.FAST], // Use FAST model, not ANALYST
        baseUrl,
        5000, // 5 second timeout (was 15s)
        [] // NO plugins - pure speed
    );

    const parsed = parseJsonResponse<{ price: number; change: number; changePercent: number; sentiment: string; bullet: string }>(result.content);

    return {
        price: parsed?.price || 0,
        change: parsed?.change || 0,
        changePercent: parsed?.changePercent || 0,
        volume: 0,
        bullets: parsed?.bullet ? [parsed.bullet] : ['Analyzing...'],
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
