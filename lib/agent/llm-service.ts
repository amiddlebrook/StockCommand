import { MarketData, AgentAction, Ticker, MarketClock, SectorName } from './types';
import { UNIVERSE, SECTOR_ETFS } from './universe';
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
    'Market Overview': 'Explain how this asset fits into the current broader Macro environment (Interest Rates, GDP, Sector Rotation).',

    // Macro / Clock Prompts
    'CLOCK_LIQUIDITY_CYCLE': 'Format output as two distinct sections: \n\n### 1. CONCEPT OVERVIEW\nExplain the Global Liquidity Cycle (Central Banks + Commercial Bank Money) effectively. Why does it drive asset prices?\n\n### 2. CURRENT REGIME ANALYSIS\nAnalyze the *current* state. Focus on BTC-USD (Risk-on proxy) and HYG (Credit conditions). Are we in Expansion or Contraction? What does this mean for the portfolio?',
    'CLOCK_COMMODITY_CYCLE': 'Format output as two distinct sections: \n\n### 1. CONCEPT OVERVIEW\nExplain the Commodity Supercycle (Structural Supply vs Demand). Why is it a key inflation driver?\n\n### 2. CURRENT REGIME ANALYSIS\nAnalyze the *current* state using Energy (XLE/USO) and Base Metals (DBB) proxies. Are we in a deficit (Bullish) or surplus (Bearish)?',
    'CLOCK_VIX_REGIME': 'Format output as two distinct sections: \n\n### 1. CONCEPT OVERVIEW\nExplain the VIX Volatility Regime. What characterizes Low Vol (<15), Structural Vol (15-25), and Crisis Vol (>25)?\n\n### 2. CURRENT REGIME ANALYSIS\nAnalyze the *current* VIX level. Which regime are we in currently? Is it safe to be short volatility or should we hedge?',
    'CLOCK_INFLATION_TREND': 'Format output as two distinct sections: \n\n### 1. CONCEPT OVERVIEW\nExplain Breakeven Inflation (TIPS vs Nominal). Why is the rate of change more important than the absolute number?\n\n### 2. CURRENT REGIME ANALYSIS\nAnalyze the *current* trend using TIP vs IEF. Are inflation expectations rising (Reflation) or falling (Disinflation)?',
    'CLOCK_CREDIT_IMPULSE': 'Format output as two distinct sections: \n\n### 1. CONCEPT OVERVIEW\nExplain the Credit Impulse (Change in new credit creation). Why is it a leading indicator for GDP?\n\n### 2. CURRENT REGIME ANALYSIS\nAnalyze High Yield (HYG) vs Investment Grade (LQD) spreads. Are financial conditions tightening or loosening?',
    'CLOCK_DOLLAR_STRENGTH': 'Format output as two distinct sections: \n\n### 1. CONCEPT OVERVIEW\nExplain the USD Wrecking Ball theory. How does a strong Dollar tighten global financial conditions?\n\n### 2. CURRENT REGIME ANALYSIS\nAnalyze the *current* DXY/UUP trend. Is the Dollar trend Bullish or Bearish, and which asset classes are most at risk?'
};

// Macro Tool Proxy Mapping
const TOOL_PROXIES: Record<string, string[]> = {
    'CLOCK_LIQUIDITY_CYCLE': ['BTC', 'HYG', 'SPY'],
    'CLOCK_COMMODITY_CYCLE': ['DBC', 'USO', 'DBB'],
    'CLOCK_VIX_REGIME': ['VIX', 'SPY'],
    'CLOCK_INFLATION_TREND': ['TIP', 'IEF', 'USO'],
    'CLOCK_CREDIT_IMPULSE': ['HYG', 'LQD'],
    'CLOCK_DOLLAR_STRENGTH': ['UUP', 'GLD', 'SPY']
};

export class LLMService {
    private apiKey: string;
    private modelName: string = "deepseek/deepseek-chat";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async analyze(
        scope: 'FULL' | 'SECTOR' | 'TICKER' | 'TOOL',
        marketData: Record<string, MarketData>,
        target?: string,
        tool?: string
    ): Promise<{ analysis: string; actions: AgentAction[], clocks?: MarketClock[] }> {

        // 1. Filter Data based on Scope
        let relevantTickers: Ticker[] = [];
        if (scope === 'FULL') {
            relevantTickers = UNIVERSE;
        } else if (scope === 'SECTOR') {
            relevantTickers = UNIVERSE.filter(t => t.sector === target);
        } else if (scope === 'TICKER') {
            relevantTickers = UNIVERSE.filter(t => t.symbol === target);
        } else if (scope === 'TOOL') {
            // Check if it's a Macro Tool with Proxies
            if (target && TOOL_PROXIES[target] && !target.includes(',')) {
                const proxies = TOOL_PROXIES[target];
                relevantTickers = UNIVERSE.filter(t => proxies.includes(t.symbol));
            } else if (target) {
                // User provided list (may contain symbols NOT in UNIVERSE)
                const symbols = target.split(',').map(s => s.trim().toUpperCase());
                relevantTickers = symbols.map(sym => {
                    const found = UNIVERSE.find(t => t.symbol === sym);
                    return found || { symbol: sym, name: sym, sector: 'Technology' as SectorName, role: 'Custom' };
                });
            }
        }

        if (relevantTickers.length === 0) {
            return { analysis: `No relevant tickers found for scope ${scope} / target ${target}`, actions: [] };
        }

        // 2. Construct Prompt
        const dataSummary = relevantTickers.map(t => {
            const data = marketData[t.symbol];
            if (!data) return `${t.symbol}: No Data`;
            const ta = data.rsi ? ` | RSI: ${data.rsi.toFixed(1)} | MACD: ${data.macd?.histogram.toFixed(3)} | Signal: ${data.technicalSignal}` : '';
            return `${t.symbol} (${t.sector}): Price $${data.price.toFixed(2)}, Change ${data.changePercent.toFixed(2)}%, Vol ${data.volume}${ta}`;
        }).join('\n');

        const systemPrompt = `You are the "StockCommand" AI Agent, an expert portfolio manager running a systematic sector rotation strategy.`;

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
             Based on systematic sector rotation principles:
             1. Analyze the current state of the assets provided.
             2. Identify any rotation triggers (Entry, Exit, Trim, Add).
             3. Provide a clear rationale citing sector momentum and relative strength.
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
      Return a STRICT JSON object with these fields (do not use markdown blocks):
      - "markdown_report": A string containing a concise markdown report formatted for a trader.
      - "recommended_actions": An array of objects matching this interface: { type: 'BUY'|'SELL'|'HOLD'|'TRIM'|'ALERT', ticker: string, sector: string, reason: string, confidence: number (0-1) }
      - "clocks": An array of objects matching: { label: string, status: 'green'|'yellow'|'red', code: string, reason: string }. 
         ${scope === 'FULL' ?
                'Required Codes: CLOCK_LIQUIDITY_CYCLE, CLOCK_COMMODITY_CYCLE, CLOCK_VIX_REGIME, CLOCK_INFLATION_TREND, CLOCK_CREDIT_IMPULSE, CLOCK_DOLLAR_STRENGTH' :
                scope === 'TICKER' && target ?
                    `Required Codes for ${target}: ${target}_VOL (Volatility), ${target}_MOM (Momentum), ${target}_SENT (Sentiment), ${target}_VAL (Valuation). Analyze each aspect and assign status: green=Bullish, yellow=Hold/Neutral, red=Bearish` :
                    scope === 'TOOL' && tool ?
                        `Required: Return the single clock for ${tool}. Set status: green=Favorable conditions, yellow=Neutral, red=Unfavorable. Include reason explaining your assessment.` :
                        '(Populate clocks if applicable)'
            }
    `;

        // 3. Call OpenAI-compatible LLM via Fetch (OpenRouter)
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://stockcommand.workers.dev",
                    "X-Title": "StockCommand Agent"
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.2,
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${err}`);
            }

            const data = await response.json() as any;
            let content = data.choices[0].message.content;

            // ROBUST PARSING: Strip markdown code blocks if present
            if (content.includes('```json')) {
                content = content.replace(/```json/g, '').replace(/```/g, '');
            } else if (content.includes('```')) {
                content = content.replace(/```/g, '');
            }
            content = content.trim();

            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (jsonErr) {
                console.error("Failed to parse LLM JSON:", content);
                throw new Error("Invalid JSON response from Agent");
            }

            return {
                analysis: parsed.markdown_report,
                actions: parsed.recommended_actions,
                clocks: parsed.clocks?.map((c: any) => ({ ...c, lastUpdated: Date.now() }))
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
