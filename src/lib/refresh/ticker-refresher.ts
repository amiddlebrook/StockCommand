/**
 * Ticker Refresher - MAXIMUM SPEED
 * Uses first-response-wins racing for fastest updates
 */

import { TickerArtifact, getBucket } from '../types/artifacts';
import { setTickerInCache } from '../caching';
import { fastTickerAnalysis } from '../search';

export interface TickerRefreshResult {
    success: boolean;
    artifact?: TickerArtifact;
    error?: string;
    latencyMs: number;
}

export async function refreshTicker(
    symbol: string,
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<TickerRefreshResult> {
    try {
        // Use fast racing approach
        const result = await fastTickerAnalysis(symbol, apiKey, baseUrl);

        // Create brief artifact
        const artifact: TickerArtifact = {
            ticker: symbol,
            kind: 'brief',
            bullets: result.bullets,
            riskNotes: result.riskNotes,
            price: result.price,
            change: result.change,
            changePercent: result.changePercent,
            sources: ['OpenRouter/Racing'],
            tsBucket: getBucket('ticker_brief'),
            createdAt: Date.now(),
        };

        // Store in cache
        await setTickerInCache(kv, artifact);

        return { success: true, artifact, latencyMs: result.latencyMs };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: 0
        };
    }
}

/**
 * Batch refresh multiple tickers - PARALLEL
 */
export async function refreshTickers(
    symbols: string[],
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<{ succeeded: number; failed: number; totalLatencyMs: number }> {
    const startTime = Date.now();

    // Process ALL tickers in parallel for maximum speed
    const results = await Promise.all(
        symbols.map(symbol => refreshTicker(symbol, kv, apiKey, baseUrl))
    );

    let succeeded = 0;
    let failed = 0;
    for (const result of results) {
        if (result.success) succeeded++;
        else failed++;
    }

    return { succeeded, failed, totalLatencyMs: Date.now() - startTime };
}
