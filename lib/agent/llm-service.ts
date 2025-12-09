import { MarketData, AgentAction, Ticker } from './types';
import { UNIVERSE } from './universe';
import { FRAMEWORK_TEXT } from './framework-context';

const TOOL_PROMPTS: Record<string, string> = {
    'Divergence Analysis': 'Analyze price vs. momentum (RSI, MACD) specifically for Divergences. Look for Regular and Hidden divergences.',
    'Ghost Pattern': 'Identify subtle, liquidity-seeking patterns (Wyckoff Springs, Upthrusts) often invisible to standard algos. Call this "Ghost Pattern Detection".',
    'Options Strategy': 'Suggest optimal options strategies (Spreads, Straddles, Iron Condors) based on current Volatility/VIX regime and trend.',
    'Financial News': 'Summarize the most recent and impactful financial news catalysts affecting this asset.',
    'Company Profile': 'Provide a deep-dive fundamental profile: Business Model, Competitive Moat, Financial Health, and Growth Vectors.',
    'Peer Comparison': 'Compare this asset against its top 3 competitors on Valuation (P/E, P/S) and Growth metrics.',
    'Sentiment Analysis': 'Gauge the current market sentiment (Bullish/Bearish/Neutral) based on price action and volume flow.',
    'Technical Indicators': 'Calculate and interpret key technicals: RSI, MACD, Bollinger Bands, Moving Averages (50/200).',
    'Earnings Analysis': 'Analyze the most recent earnings print. EPS beat/miss? Revenue growth? Guidance tone?',
    'Market Overview': 'Explain how this asset fits into the current broader Macro environment (Interest Rates, GDP, Sector Rotation).'
};

export class LLMService {
    private apiKey: string;
    private modelName: string = "deepseek/deepseek-chat";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async analyze(
        scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL',
        marketData: Record<string, MarketData>,
        target?: string,
        tool?: string
    ): Promise<{ analysis: string; actions: AgentAction[] }> {

        // 1. Filter Data based on Scope
        let relevantTickers: Ticker[] = [];
        if (scope === 'FULL') {
            relevantTickers = UNIVERSE;
        } else if (scope === 'SLEEVE') {
            relevantTickers = UNIVERSE.filter(t => t.sleeve === target);
        } else if (scope === 'TICKER' || scope === 'TOOL') {
            relevantTickers = UNIVERSE.filter(t => t.symbol === target);
        }

        if (relevantTickers.length === 0) {
            return { analysis: `No relevant tickers found for scope ${scope} / target ${target}`, actions: [] };
        }

        // 2. Construct Prompt
        const dataSummary = relevantTickers.map(t => {
            const data = marketData[t.symbol];
            if (!data) return `${t.symbol}: No Data`;
            return `${t.symbol} (${t.sleeve}): Price $${data.price.toFixed(2)}, Change ${data.changePercent.toFixed(2)}%, Vol ${data.volume}`;
        }).join('\n');

        const systemPrompt = `You are the "StockCommand" AI Agent, an expert portfolio manager running a specific Multi-Clock Rotation Framework.`;

        let taskInstructions = '';
        if (scope === 'TOOL' && tool && TOOL_PROMPTS[tool]) {
            taskInstructions = `
             SPECIALIZED TASK: Perform a ${tool} on ${target}.
             INSTRUCTIONS: ${TOOL_PROMPTS[tool]}
             Use the provided Framework Context only if relevant to this specific analysis type.
             `;
        } else {
            taskInstructions = `
             TASK: Perform a ${scope} analysis ${target ? `specifically for ${target}` : ''}.
             Based strictly on the Framework Document's logic (Clocks, Sleeves, Rules):
             1. Analyze the current state of the assets provided.
             2. Identify any rotation triggers (Entry, Exit, Trim, Add).
             3. Provide a clear rationale citing the specific "Clock" or rule from the document.
             `;
        }

        const userPrompt = `
      FRAMEWORK DOCUMENT:
      """
      ${FRAMEWORK_TEXT}
      """

      CURRENT MARKET DATA:
      ${dataSummary}

      ${taskInstructions}
      
      OUTPUT FORMAT:
      Return a STRICT JSON object with two fields (do not use markdown blocks):
      - "markdown_report": A string containing a concise markdown report formatted for a trader.
      - "recommended_actions": An array of objects matching this interface: { type: 'BUY'|'SELL'|'HOLD'|'TRIM'|'ALERT', ticker: string, sleeve: string, reason: string, confidence: number (0-1) }
    `;

        // 3. Call OpenAI-compatible LLM via Fetch (OpenRouter)
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://stockcommand.workers.dev", // Optional, for OpenRouter rankings
                    "X-Title": "StockCommand Agent"
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.2, // Low temperature for analytical precision
                    response_format: { type: "json_object" } // Force JSON
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${err}`);
            }

            const data = await response.json() as any;
            const content = data.choices[0].message.content;

            const parsed = JSON.parse(content);
            return {
                analysis: parsed.markdown_report,
                actions: parsed.recommended_actions
            };

        } catch (error: any) {
            console.error("LLM Analysis Failed:", error);
            return {
                analysis: `Failed to generate analysis due to error: ${error.message}`,
                actions: []
            };
        }
    }
}
