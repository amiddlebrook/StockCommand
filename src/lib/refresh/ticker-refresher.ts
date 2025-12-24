/**
 * Ticker Refresher
 * Background job to refresh ticker briefs/news via OpenRouter LLMs
 */

import { TickerArtifact, getBucket } from '../types/artifacts';
import { setTickerInCache } from '../caching';
import { researchTicker } from '../search';

export interface TickerRefreshResult {
    success: boolean;
    artifact?: TickerArtifact;
    error?: string;
    llmCalls: number;
}

export async function refreshTicker(
    symbol: string,
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<TickerRefreshResult> {
    try {
        // Use OpenRouter-native research (parallel models)
        const result = await researchTicker(symbol, apiKey, baseUrl);

        // Create brief artifact
        const artifact: TickerArtifact = {
            ticker: symbol,
            kind: 'brief',
            bullets: result.bullets,
            riskNotes: result.riskNotes,
            sources: ['OpenRouter/DeepResearch', 'OpenRouter/Hermes405B'],
            tsBucket: getBucket('ticker_brief'),
            createdAt: Date.now(),
        };

        // Store in cache
        await setTickerInCache(kv, artifact);

        return { success: true, artifact, llmCalls: 2 };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            llmCalls: 1
        };
    }
}

/**
 * Batch refresh multiple tickers
 */
export async function refreshTickers(
    symbols: string[],
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<{ succeeded: number; failed: number; totalLlmCalls: number }> {
    let succeeded = 0;
    let failed = 0;
    let totalLlmCalls = 0;

    // Process one at a time to respect rate limits
    for (const symbol of symbols) {
        const result = await refreshTicker(symbol, kv, apiKey, baseUrl);
        if (result.success) succeeded++;
        else failed++;
        totalLlmCalls += result.llmCalls;

        // Small delay between tickers
        await new Promise(r => setTimeout(r, 200));
    }

    return { succeeded, failed, totalLlmCalls };
}
