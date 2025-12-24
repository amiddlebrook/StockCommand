/**
 * Clock Refresher
 * Background job to refresh market clock status via OpenRouter LLMs
 */

import { ClockArtifact, ClockStatus, CLOCK_DEFINITIONS, getBucket } from '../types/artifacts';
import { setClockInCache } from '../caching';
import { researchClockStatus } from '../search';

export interface ClockRefreshResult {
    success: boolean;
    artifact?: ClockArtifact;
    error?: string;
    llmCalls: number;
}

export async function refreshClock(
    code: string,
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<ClockRefreshResult> {
    const definition = CLOCK_DEFINITIONS[code];
    if (!definition) {
        return { success: false, error: `Unknown clock: ${code}`, llmCalls: 0 };
    }

    try {
        // Use OpenRouter-native research (DeepResearch model)
        const result = await researchClockStatus(
            code,
            definition.label,
            definition.query,
            apiKey,
            baseUrl
        );

        // Create artifact
        const artifact: ClockArtifact = {
            code,
            status: result.status,
            reason: result.reason,
            confidence: result.confidence,
            sources: ['OpenRouter/DeepResearch'],
            tsBucket: getBucket('clock'),
            createdAt: Date.now(),
        };

        // Store in cache
        await setClockInCache(kv, artifact);

        return { success: true, artifact, llmCalls: 1 };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            llmCalls: 1
        };
    }
}

/**
 * Batch refresh all clocks (for cron job)
 */
export async function refreshAllClocks(
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<{ succeeded: number; failed: number; totalLlmCalls: number }> {
    const codes = Object.keys(CLOCK_DEFINITIONS);
    let succeeded = 0;
    let failed = 0;
    let totalLlmCalls = 0;

    // Process in batches of 3 to avoid rate limits
    for (let i = 0; i < codes.length; i += 3) {
        const batch = codes.slice(i, i + 3);
        const results = await Promise.all(
            batch.map(code => refreshClock(code, kv, apiKey, baseUrl))
        );

        for (const result of results) {
            if (result.success) succeeded++;
            else failed++;
            totalLlmCalls += result.llmCalls;
        }

        // Small delay between batches
        if (i + 3 < codes.length) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    return { succeeded, failed, totalLlmCalls };
}
