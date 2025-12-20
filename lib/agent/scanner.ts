
import { Env } from '../../types';
import { SwarmDataService } from './market-data';
import { MarketData } from './types';

export async function runMarketScanner(env: Env) {
    console.log("[Scanner] Starting autonomous market scan...");

    // 1. Fetch Real Data via LLM (SwarmDataService)
    const apiKey = env.OPENROUTER_DEEPSEEK_NEX_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const swarmService = new SwarmDataService(apiKey);
    const watchlist = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA', 'AMD'];

    // Use SwarmDataService to get LLM-generated market data
    const swarmData = await swarmService.querySwarm(watchlist, '1d');

    const dataSummary = watchlist.map(sym => {
        const data = swarmData[sym] as MarketData | undefined;
        if (data) {
            return `${sym}: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
        }
        return `${sym}: No data`;
    }).join('\n');

    console.log("[Scanner] Data snapshot:", dataSummary);

    // 2. The Brain (LLM Analysis) - "Revenue Generator"
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://stockcommand.workers.dev",
            "X-Title": "StockCommand Scanner"
        },
        body: JSON.stringify({
            model: "nex-agi/deepseek-v3.1-nex-n1:free",
            messages: [
                {
                    role: "system",
                    content: "You are the StockCommand Autonomous Scanner. Your job is to constantly monitor the market pulse. Analyze the provided price snapshots. Is there a significant move? Is the market bullish or bearish right now? Output a concise 'Scanner Alert' (max 2 sentences) that can be displayed to the user."
                },
                {
                    role: "user",
                    content: `Current Market Snapshot:\n${dataSummary}`
                }
            ],
            max_tokens: 200
        })
    });

    const llmResult: any = await response.json();
    const analysis = llmResult.choices?.[0]?.message?.content || "Market systems nominal.";

    // 3. Cache the Result (Agent Output)
    if (env.STOCK_CACHE_KV) {
        await env.STOCK_CACHE_KV.put("latest_agent_run", JSON.stringify({
            timestamp: Date.now(),
            summary: analysis,
            data: dataSummary
        }));
    } else {
        console.warn("[Scanner] No KV binding found, cannot save report.");
    }

    return analysis;
}
