import { AgentCore, CoreContext, CoreOutput, Timeline } from './types';
import { MarketClock } from '../../types';

export class MacroCore implements AgentCore {
    name = "Macro Core";

    public async process(context: CoreContext): Promise<CoreOutput> {
        const { scope, target, marketData, timeline, apiKey } = context;

        // Macro Core only runs on FULL, SECTOR, or TOOL scopes, or specific macro tickers
        if (scope === 'TICKER' && !['SPY', 'QQQ', 'IWM', 'BTC', 'GLD', 'VIX', 'TLT'].includes(target || '')) {
            return { analysis: "", actions: [] }; // Silent for random stocks
        }

        const systemPrompt = `You are the Macro Core of StockCommand.
Analyze the Global Macro Regime.
Context: User is looking at ${target} on a ${timeline} timeline.
Focus: Inflation, Rate Expectations, Geopolitics, and Liquidity.
Output: Markdown. Start with "### 🌍 Macro Regime (${timeline})"`;

        const userPrompt = `Assess the current macro environment.
Target: ${target}
Timeline: ${timeline}
Market Data: ${JSON.stringify(marketData)}

Provide a strategic outlook (Risk-On / Risk-Off) and key regime drivers.`;

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://stockcommand.workers.dev",
                    "X-Title": "StockCommand Macro"
                },
                body: JSON.stringify({
                    model: "nex-agi/deepseek-v3.1-nex-n1:free",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: 300
                })
            });

            const llmData: any = await response.json();
            const analysis = llmData.choices?.[0]?.message?.content || "Macro Analysis Unavailable.";

            return {
                analysis,
                actions: [],
                clocks: [] // Clocks would be derived from parsing the analysis in a more advanced version
            };
        } catch (e: any) {
            return { analysis: `### 🌍 Macro Regime\nAnalysis Failed: ${e.message}\n`, actions: [] };
        }
    }
}
