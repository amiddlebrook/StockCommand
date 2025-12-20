import { AgentCore, CoreContext, CoreOutput } from './types';

export class QuantCore implements AgentCore {
    name = "Quant Core";

    public async process(context: CoreContext): Promise<CoreOutput> {
        const { target, marketData, timeline, apiKey } = context;
        console.log(`[Quant Core] Analyzing ${target} on ${timeline} timeline using LLM...`);

        if (!target || !marketData[target]) {
            return { analysis: "Quant Core: No data available.", actions: [] };
        }

        const data = marketData[target];
        const { price, changePercent, rsi, volume, technicalSignal } = data;

        // 1. Construct Prompt
        const systemPrompt = `You are the Quant Core of StockCommand.
Your job is to analyze technical indicators and price action for ${target} on a ${timeline} timeframe.
Be concise, data-driven, and professional.
Focus on: Trend direction, Momentum (RSI), and Volume profile.
Output format: Markdown bullet points. Start with "### 📐 Technical Analysis (${timeline})"`;

        const userPrompt = `Analyze this data:
Ticker: ${target}
Price: ${price}
Change: ${changePercent}%
RSI: ${rsi || 'N/A'}
Signal: ${technicalSignal || 'Neutral'}
Volume: ${volume}

Provide a 3-bullet summary of the technical setup and a final trading signal (BUY/SELL/NEUTRAL).`;

        try {
            // 2. Call LLM
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://stockcommand.workers.dev",
                    "X-Title": "StockCommand Quant"
                },
                body: JSON.stringify({
                    model: "nex-agi/deepseek-v3.1-nex-n1:free", // Using DeepSeek for analytical depth
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: 300,
                    temperature: 0.3
                })
            });

            const llmData: any = await response.json();
            const analysis = llmData.choices?.[0]?.message?.content || "Analysis unavailable.";

            // Simple parsing for signal (LLM usually puts it at the end)
            let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
            if (analysis.includes('Signal: BUY') || analysis.includes('Signal: **BUY**')) signal = 'BUY';
            if (analysis.includes('Signal: SELL') || analysis.includes('Signal: **SELL**')) signal = 'SELL';

            return {
                analysis,
                actions: [],
                technicalSignal: signal
            };

        } catch (e: any) {
            console.error("Quant Core LLM Failed:", e);
            return {
                analysis: `### 📐 Technical Analysis (${timeline})\n- **Error**: AI Analysis failed (${e.message}).\n- **Data**: $${price} (${changePercent}%)\n`,
                actions: [],
                technicalSignal: 'NEUTRAL'
            };
        }
    }
}
