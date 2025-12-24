/**
 * OpenRouter-Native Research Service
 * Uses LLMs with research/knowledge capabilities instead of external search APIs
 * Multi-model synthesis for higher confidence results
 */

import { complete, parseJsonResponse, OpenRouterConfig } from './openrouter';

// =============================================================================
// RESEARCH MODELS (OpenRouter Native)
// =============================================================================

export const RESEARCH_MODELS = {
    // Primary research model - Alibaba's DeepResearch (free, research-optimized)
    deepResearch: 'alibaba/tongyi-deepresearch-30b-a3b:free',

    // Reasoning model - Hermes 405B (free, massive reasoning)
    hermes405b: 'nousresearch/hermes-3-llama-3.1-405b:free',

    // User's existing models for synthesis
    deepseek: 'deepseek/deepseek-chat',
    nemotron: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    olmo: 'allenai/olmo-2-0325-32b-instruct:free',
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
// MULTI-MODEL PARALLEL RESEARCH
// =============================================================================

export async function parallelResearch(
    query: string,
    apiKeys: { deepResearch?: string; hermes?: string; deepseek?: string },
    baseUrl?: string
): Promise<SynthesizedResearch> {
    const startTime = Date.now();
    const promises: Promise<ResearchResult>[] = [];

    // Run multiple models in parallel for consensus
    if (apiKeys.deepResearch) {
        promises.push(researchWithModel(query, apiKeys.deepResearch, RESEARCH_MODELS.deepResearch, baseUrl));
    }
    if (apiKeys.hermes) {
        promises.push(researchWithModel(query, apiKeys.hermes, RESEARCH_MODELS.hermes405b, baseUrl));
    }
    if (apiKeys.deepseek) {
        promises.push(researchWithModel(query, apiKeys.deepseek, RESEARCH_MODELS.deepseek, baseUrl));
    }

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r.content && r.confidence > 0);

    // Determine consensus level
    const avgConfidence = validResults.length > 0
        ? validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
        : 0;

    let consensus: 'high' | 'medium' | 'low' = 'low';
    if (avgConfidence > 0.8 && validResults.length >= 2) consensus = 'high';
    else if (avgConfidence > 0.5) consensus = 'medium';

    // Synthesize results
    const summary = validResults.map(r => r.content).join('\n\n---\n\n');

    return {
        summary,
        sources: validResults,
        consensus,
        totalLatencyMs: Date.now() - startTime,
    };
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
