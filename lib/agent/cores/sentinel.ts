import { AgentCore, CoreContext, CoreOutput } from './types';

export class SentinelCore implements AgentCore {
    name = "Sentinel Core";

    public async constructPrompt(context: CoreContext): Promise<string> {
        const { marketData, target, timeline = '1d' } = context;
        if (!target) return "Identify key market threats.";

        const data = marketData?.[target] || marketData?.['SPY'];
        const newsString = data?.news?.map(n => `- ${n.headline} (${n.source}) [${n.sentiment}]`).join('\n') || "No recent news.";

        return `
        AGENT: SENTINEL (Market Watchdog)
        TARGET: ${target}
        TIMELINE: ${timeline}
        
        DATA:
        Price: ${data?.price || 'N/A'}
        Change: ${data?.changePercent?.toFixed(2) || 'N/A'}%
        
        NEWS HEADLINES (${timeline}):
        ${newsString}
        
        TASK:
        Analyze the sentiment and narrative for ${target} over the ${timeline} period.
        Identify any "Black Swan" risks or major catalysts mentioned in the news.
        Status: "Safe", "Caution", or "Danger".
        `;
    }

    public async process(context: CoreContext): Promise<CoreOutput> {
        const { target, timeline, apiKey } = context;
        console.log(`[Sentinel Core] Scanning intelligence for ${target} (${timeline})...`);

        // Prompt for Sentinel
        const systemPrompt = `You are the Sentinel Core of StockCommand.
Your mission: Aggregate sentiment and identify narrative drivers for ${target}.
Context: Timeframe is ${timeline}.
Style: "Black Ops" intelligence briefing. Concise. High stakes.
Output: Markdown. Start with "### 📡 Sentinel Intelligence"`;

        const userPrompt = `Analyze the ticker ${target}.
Identify potential news drivers, market sentiment, and crowd psychology ranking (0-100).
If no specific news is available, infer sentiment from general market conditions for this sector.`;

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://stockcommand.workers.dev",
                    "X-Title": "StockCommand Sentinel"
                },
                body: JSON.stringify({
                    model: "nex-agi/deepseek-v3.1-nex-n1:free",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: 300,
                    temperature: 0.7 // Higher temp for narrative generation
                })
            });

            const llmData: any = await response.json();
            const analysis = llmData.choices?.[0]?.message?.content || "Sentinel Uplink Failed.";

            // Extract sentiment score if possible (mock parsing logic for now)
            return {
                analysis,
                actions: [],
                sentimentScore: 50 // TODO: parse from LLM
            };

        } catch (e: any) {
            return {
                analysis: `### 📡 Sentinel Intelligence\n - ** Status **: Uplink Failed(${e.message}) \n`,
                actions: [],
                sentimentScore: 50
            };
        }
    }
}
