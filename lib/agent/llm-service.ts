import { MarketData, AgentAction, Ticker } from './types';
import { UNIVERSE } from './universe';
import { FRAMEWORK_TEXT } from './framework-context';

export class LLMService {
    private apiKey: string;
    private modelName: string = "gpt-4o"; // Using GPT-4o for live data capability

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async analyze(
        scope: 'FULL' | 'SLEEVE' | 'TICKER',
        marketData: Record<string, MarketData>,
        target?: string
    ): Promise<{ analysis: string; actions: AgentAction[] }> {

        // 1. Filter Data based on Scope
        let relevantTickers: Ticker[] = [];
        if (scope === 'FULL') {
            relevantTickers = UNIVERSE;
        } else if (scope === 'SLEEVE') {
            relevantTickers = UNIVERSE.filter(t => t.sleeve === target);
        } else if (scope === 'TICKER') {
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

        const userPrompt = `
      FRAMEWORK DOCUMENT:
      """
      ${FRAMEWORK_TEXT}
      """

      CURRENT MARKET DATA:
      ${dataSummary}

      TASK:
      Perform a ${scope} analysis ${target ? `specifically for ${target}` : ''}.
      Based strictly on the Framework Document's logic (Clocks, Sleeves, Rules):
      1. Analyze the current state of the assets provided.
      2. Identify any rotation triggers (Entry, Exit, Trim, Add).
      3. Provide a clear rationale citing the specific "Clock" or rule from the document.
      
      OUTPUT FORMAT:
      Return a STRICT JSON object with two fields (do not use markdown blocks):
      - "markdown_report": A string containing a concise markdown report formatted for a trader.
      - "recommended_actions": An array of objects matching this interface: { type: 'BUY'|'SELL'|'HOLD'|'TRIM'|'ALERT', ticker: string, sleeve: string, reason: string, confidence: number (0-1) }
    `;

        // 3. Call OpenAI LLM via Fetch
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
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
                throw new Error(`OpenAI API Error: ${response.status} - ${err}`);
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
