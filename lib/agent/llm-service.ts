import { GoogleGenerativeAI } from '@google/generative-ai';
import { MarketData, AgentAction, Ticker } from './types';
import { UNIVERSE } from './universe';

// Need to read the framework document content.
// In a worker environment, we can't use 'fs'. We should import it as a string or constant.
// For now, assuming we can load it or pass it in. Ideally, we bake it into the build.
// I will create a separate file `lib/agent/framework-context.ts` to hold the text content to make it importable.
import { FRAMEWORK_TEXT } from './framework-context';

export class LLMService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

        const prompt = `
      You are the "StockCommand" AI Agent, an expert portfolio manager running a specific Multi-Clock Rotation Framework.
      
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
      Return a JSON object with two fields:
      - "markdown_report": A string containing a concise markdown report formatted for a trader.
      - "recommended_actions": An array of objects matching this interface: { type: 'BUY'|'SELL'|'HOLD'|'TRIM'|'ALERT', ticker: string, sleeve: string, reason: string, confidence: number (0-1) }
      
      Do not use markdown code blocks for the JSON, just raw JSON.
    `;

        // 3. Call LLM
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Clean up potential markdown formatting if the model adds it
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(cleanText);
            return {
                analysis: parsed.markdown_report,
                actions: parsed.recommended_actions
            };
        } catch (error) {
            console.error("LLM Analysis Failed:", error);
            return {
                analysis: "Failed to generate analysis due to error.",
                actions: []
            };
        }
    }
}
