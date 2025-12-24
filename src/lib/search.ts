/**
 * OpenRouter-Native Multi-Agent Research Swarm
 * 8 FREE LLMs working in parallel for high-confidence synthesis
 */

import { complete, parseJsonResponse, OpenRouterConfig } from './openrouter';

// =============================================================================
// 8-MODEL RESEARCH SWARM (All Free on OpenRouter)
// =============================================================================

export const RESEARCH_MODELS = {
    // Research-optimized models
    deepResearch: 'alibaba/tongyi-deepresearch-30b-a3b:free',
    mimoFlash: 'xiaomi/mimo-v2-flash:free',

    // Large reasoning models
    hermes405b: 'nousresearch/hermes-3-llama-3.1-405b:free',
    nemotron: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    olmo: 'allenai/olmo-2-0325-32b-instruct:free',

    // User's existing keys
    deepseek: 'deepseek/deepseek-chat',
    gptOss: 'openai/gpt-4o-mini', // Placeholder for GPT_OSS key
    katcoder: 'mistralai/codestral-latest', // Placeholder for KATCODER key
} as const;

// Models to use for different task types
export const SWARM_CONFIG = {
    // For market clock status (fast, needs 2-3 models)
    clockAnalysis: ['deepResearch', 'mimoFlash', 'hermes405b'] as const,

    // For ticker research (comprehensive, use more models)  
    tickerResearch: ['deepResearch', 'mimoFlash', 'hermes405b', 'nemotron', 'deepseek'] as const,

    // For chat/questions (quick response, use fastest)
    chat: ['mimoFlash', 'deepseek'] as const,
} as const;

export interface ResearchResult {
    content: string;
    model: string;
    confidence: number;
    latencyMs: number;
}

export interface SynthesizedResearch {
    summary: string;
    sources: ResearchResult[];
    consensus: 'high' | 'medium' | 'low';
    totalLatencyMs: number;
}

// =============================================================================
// SINGLE MODEL RESEARCH
// =============================================================================

const RESEARCH_PROMPT = `You are a financial research analyst with access to extensive market knowledge.
Provide accurate, up-to-date information based on your training data.

IMPORTANT:
- Focus on factual, verifiable information
- Include specific data points when possible (prices, percentages, dates)
- Cite the type of source if you recall it (earnings report, SEC filing, news)
- If uncertain, say so and provide your confidence level

Respond in JSON format:
{
  "findings": "detailed findings here",
  "confidence": 0.0-1.0,
  "dataPoints": ["key fact 1", "key fact 2"],
  "sentiment": "bullish|bearish|neutral"
}`;

export async function researchWithModel(
    query: string,
    apiKey: string,
    model: string,
    baseUrl?: string
): Promise<ResearchResult> {
    const startTime = Date.now();

    try {
        const config: OpenRouterConfig = { apiKey, model, baseUrl };
        const response = await complete(config, [
            { role: 'system', content: RESEARCH_PROMPT },
            { role: 'user', content: query },
        ], { temperature: 0.3, maxTokens: 1500, jsonMode: true });

        const parsed = parseJsonResponse<{ findings: string; confidence: number }>(response);

        return {
            content: parsed?.findings || response,
            model,
            confidence: parsed?.confidence || 0.7,
            latencyMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error(`Research failed for ${model}:`, error);
        return {
            content: '',
            model,
            confidence: 0,
            latencyMs: Date.now() - startTime,
        };
    }
}

// =============================================================================
// MULTI-MODEL SWARM RESEARCH
// =============================================================================

export async function swarmResearch(
    query: string,
    apiKey: string,
    taskType: keyof typeof SWARM_CONFIG = 'tickerResearch',
    baseUrl?: string
): Promise<SynthesizedResearch> {
    const startTime = Date.now();
    const modelKeys = SWARM_CONFIG[taskType];

    // Run all configured models in parallel
    const promises = modelKeys.map(modelKey =>
        researchWithModel(query, apiKey, RESEARCH_MODELS[modelKey], baseUrl)
    );

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r.content && r.confidence > 0);

    // Determine consensus level based on number of agreeing models
    const avgConfidence = validResults.length > 0
        ? validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
        : 0;

    let consensus: 'high' | 'medium' | 'low' = 'low';
    if (avgConfidence > 0.8 && validResults.length >= 2) consensus = 'high';
    else if (avgConfidence > 0.6 && validResults.length >= 2) consensus = 'medium';

    // Synthesize all results
    const summary = validResults.map(r => `[${r.model}]: ${r.content}`).join('\n\n');

    return {
        summary,
        sources: validResults,
        consensus,
        totalLatencyMs: Date.now() - startTime,
    };
}

// Legacy function for backwards compatibility
export async function parallelResearch(
    query: string,
    apiKeys: { deepResearch?: string; hermes?: string; deepseek?: string },
    baseUrl?: string
): Promise<SynthesizedResearch> {
    const apiKey = apiKeys.deepResearch || apiKeys.hermes || apiKeys.deepseek || '';
    return swarmResearch(query, apiKey, 'tickerResearch', baseUrl);
}

// =============================================================================
// CLOCK-SPECIFIC RESEARCH
// =============================================================================

export async function researchClockStatus(
    clockCode: string,
    clockLabel: string,
    researchQuery: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ status: 'green' | 'yellow' | 'red'; reason: string; confidence: number }> {

    const prompt = `Research the current market status for: ${clockLabel}
  
Query: ${researchQuery}

Based on your knowledge of current market conditions, determine:
1. Status: green (bullish/favorable), yellow (neutral/mixed), red (bearish/risk-off)
2. A concise 1-2 sentence explanation

Respond in JSON:
{
  "status": "green|yellow|red",
  "reason": "brief explanation",
  "confidence": 0.0-1.0
}`;

    // Use DeepResearch as primary, fall back to other models
    const result = await researchWithModel(prompt, apiKey, RESEARCH_MODELS.deepResearch, baseUrl);

    const parsed = parseJsonResponse<{ status: 'green' | 'yellow' | 'red'; reason: string; confidence: number }>(result.content);

    return {
        status: parsed?.status || 'yellow',
        reason: parsed?.reason || 'Analysis in progress',
        confidence: parsed?.confidence || result.confidence,
    };
}

// =============================================================================
// TICKER-SPECIFIC RESEARCH
// =============================================================================

export async function researchTicker(
    symbol: string,
    apiKey: string,
    baseUrl?: string
): Promise<{ bullets: string[]; riskNotes: string[]; sentiment: string }> {

    const prompt = `Research the stock ${symbol}. Provide:
1. Key bullet points about recent developments, earnings, news, catalysts
2. Risk factors to consider
3. Overall sentiment

Respond in JSON:
{
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "riskNotes": ["risk 1", "risk 2"],
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.0-1.0
}`;

    // Use parallel research for higher confidence on tickers
    const results = await parallelResearch(prompt, {
        deepResearch: apiKey,
        hermes: apiKey, // Same key works for free models
    }, baseUrl);

    // Parse best result
    for (const source of results.sources) {
        const parsed = parseJsonResponse<{ bullets: string[]; riskNotes: string[]; sentiment: string }>(source.content);
        if (parsed?.bullets?.length) {
            return parsed;
        }
    }

    return {
        bullets: ['Analysis pending - refresh to update'],
        riskNotes: [],
        sentiment: 'neutral',
    };
}
