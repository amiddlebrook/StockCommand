/**
 * Clock Refresher - MAXIMUM SPEED
 * Uses first-response-wins racing for fastest updates
 */

import { ClockArtifact, CLOCK_DEFINITIONS, getBucket } from '../types/artifacts';
import { setClockInCache } from '../caching';
import { fastClockAnalysis } from '../search';

export interface ClockRefreshResult {
    success: boolean;
    artifact?: ClockArtifact;
    error?: string;
    latencyMs: number;
}

export async function refreshClock(
    code: string,
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<ClockRefreshResult> {
    const definition = CLOCK_DEFINITIONS[code];
    if (!definition) {
        return { success: false, error: `Unknown clock: ${code}`, latencyMs: 0 };
    }

    try {
        // Use fast racing approach
        const result = await fastClockAnalysis(
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
            sources: ['OpenRouter/Racing'],
            tsBucket: getBucket('clock'),
            createdAt: Date.now(),
        };

        // Store in cache
        await setClockInCache(kv, artifact);

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
 * Batch refresh all clocks - PARALLEL
 */
export async function refreshAllClocks(
    kv: KVNamespace,
    apiKey: string,
    baseUrl?: string
): Promise<{ succeeded: number; failed: number; totalLatencyMs: number }> {
    const startTime = Date.now();
    const codes = Object.keys(CLOCK_DEFINITIONS);

    // Process ALL clocks in parallel for maximum speed
    const results = await Promise.all(
        codes.map(code => refreshClock(code, kv, apiKey, baseUrl))
    );

    let succeeded = 0;
    let failed = 0;
    for (const result of results) {
        if (result.success) succeeded++;
        else failed++;
    }

    return { succeeded, failed, totalLatencyMs: Date.now() - startTime };
}
