/**
 * Clock Refresher
 * Background job to refresh market clock status via LLM
 */

import { ClockArtifact, ClockStatus, CLOCK_DEFINITIONS, getBucket } from '../types/artifacts';
import { setClockInCache } from '../caching';
import { searchWeb, fetchPageContent } from '../search';
import { complete, parseJsonResponse, OpenRouterConfig } from '../openrouter';

const CLOCK_EXTRACTOR_PROMPT = `You are a financial market analyst. Analyze the provided market data to determine the clock status.

Output ONLY valid JSON matching this schema:
{
  "status": "green" | "yellow" | "red",
  "reason": "1-2 sentence explanation of current conditions",
  "confidence": 0.0-1.0
}

Status definitions:
- green = bullish/favorable/expansion/risk-on
- yellow = neutral/mixed/consolidating/uncertain
- red = bearish/unfavorable/contraction/risk-off

Be concise. Focus on actionable insight.`;

export interface ClockRefreshResult {
    success: boolean;
    artifact?: ClockArtifact;
    error?: string;
    llmCalls: number;
}

export async function refreshClock(
    code: string,
    kv: KVNamespace,
    config: OpenRouterConfig,
    searchApiKey?: string
): Promise<ClockRefreshResult> {
    const definition = CLOCK_DEFINITIONS[code];
    if (!definition) {
        return { success: false, error: `Unknown clock: ${code}`, llmCalls: 0 };
    }

    let context = '';
    let sources: string[] = [];
    let llmCalls = 0;

    try {
        // Step 1: Web search (if API key provided)
        if (searchApiKey) {
            const results = await searchWeb(definition.query, searchApiKey, { maxResults: 3 });

            // Step 2: Fetch top pages in parallel
            const pages = await Promise.all(
                results.slice(0, 3).map(r => fetchPageContent(r.url, 15000))
            );

            // Build context from fetched pages
            for (let i = 0; i < results.length; i++) {
                if (pages[i]) {
                    context += `\n\n[Source: ${results[i].title}]\n${pages[i]!.content}\n`;
                    sources.push(results[i].url);
                }
            }
        }

        // If no search results, use a simpler prompt
        if (!context) {
            context = `Clock: ${definition.label}\nQuery: ${definition.query}\n\nAnalyze based on your knowledge of current market conditions.`;
        }

        // Step 3: LLM extraction
        const messages = [
            { role: 'system' as const, content: CLOCK_EXTRACTOR_PROMPT },
            { role: 'user' as const, content: `Clock: ${definition.label}\n\nContext:\n${context}` },
        ];

        const response = await complete(config, messages, {
            temperature: 0.1,
            maxTokens: 300,
            jsonMode: true
        });
        llmCalls++;

        const parsed = parseJsonResponse<{ status: ClockStatus; reason: string; confidence: number }>(response);

        if (!parsed) {
            return { success: false, error: 'Failed to parse LLM response', llmCalls };
        }

        // Step 4: Create artifact
        const artifact: ClockArtifact = {
            code,
            status: parsed.status,
            reason: parsed.reason,
            confidence: parsed.confidence,
            sources,
            tsBucket: getBucket('clock'),
            createdAt: Date.now(),
        };

        // Step 5: Store in cache
        await setClockInCache(kv, artifact);

        return { success: true, artifact, llmCalls };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            llmCalls
        };
    }
}

/**
 * Batch refresh all clocks (for cron job)
 */
export async function refreshAllClocks(
    kv: KVNamespace,
    config: OpenRouterConfig,
    searchApiKey?: string
): Promise<{ succeeded: number; failed: number; totalLlmCalls: number }> {
    const codes = Object.keys(CLOCK_DEFINITIONS);
    let succeeded = 0;
    let failed = 0;
    let totalLlmCalls = 0;

    // Process in batches of 3 to avoid rate limits
    for (let i = 0; i < codes.length; i += 3) {
        const batch = codes.slice(i, i + 3);
        const results = await Promise.all(
            batch.map(code => refreshClock(code, kv, config, searchApiKey))
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
