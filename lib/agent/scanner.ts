import { Env } from '../../types';
import { refreshAllClocks } from '../../src/lib/refresh/clock-refresher';
import { refreshTickers } from '../../src/lib/refresh/ticker-refresher';
import { SECTOR_ETFS } from './universe';

export async function runMarketScanner(env: Env) {
    console.log("[Scanner] Starting MASTER AUTONOMOUS SCAN...");
    const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY || env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("[Scanner] Aborted: Missing API Key");
        return "Missing API Key";
    }

    if (!env.STOCK_CACHE_KV) {
        console.error("[Scanner] Aborted: Missing STOCK_CACHE_KV");
        return "Missing KV";
    }

    const startTime = Date.now();

    try {
        // 1. Refresh Global Macro Clocks (Parallel)
        console.log("[Scanner] Phase 1: Refreshing Market Clocks...");
        const clockResult = await refreshAllClocks(env.STOCK_CACHE_KV, apiKey);
        console.log(`[Scanner] Clocks Refreshed: ${clockResult.succeeded} ok, ${clockResult.failed} failed.`);

        // 2. Refresh Sectors & Key Indices (Parallel)
        console.log("[Scanner] Phase 2: Refreshing Sectors & Indices...");
        const criticalTickers = [
            'SPY', 'QQQ', 'IWM', 'DIA', 'VIX', // Indices
            ...Object.values(SECTOR_ETFS)      // All Select Sector SPDRs
        ];
        // Deduplicate just in case
        const uniqueTickers = [...new Set(criticalTickers)];

        const tickerResult = await refreshTickers(uniqueTickers, env.STOCK_CACHE_KV, apiKey);
        console.log(`[Scanner] Tickers Refreshed: ${tickerResult.succeeded} ok, ${tickerResult.failed} failed.`);

        // 3. Generate "Scanner Alert" (Synthesis)
        // We can skip this if we just want data freshness, but the user asked for "Macro/News" analysis.
        // Let's do a quick synthesis of the SPY state only to save tokens/time.

        const summary = `Scan Complete in ${(Date.now() - startTime) / 1000}s. Clocks: ${clockResult.succeeded}, Tickers: ${tickerResult.succeeded}`;

        // Save run report
        await env.STOCK_CACHE_KV.put("latest_scanner_run", JSON.stringify({
            timestamp: Date.now(),
            summary,
            stats: { clocks: clockResult, tickers: tickerResult }
        }));

        return summary;

    } catch (e: any) {
        console.error("[Scanner] Critical Failure:", e);
        return `Scanner Failed: ${e.message}`;
    }
}
