import { AgentCore, CoreContext, CoreOutput } from './types';

export class QuantCore implements AgentCore {
    name = "Quant Core";

    public async process(context: CoreContext): Promise<CoreOutput> {
        const { target, marketData, timeline } = context;
        let analysis = "";
        let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';

        console.log(`[Quant Core] Analyzing ${target} on ${timeline} timeline...`);

        if (!target || !marketData[target]) {
            return { analysis: "Quant Core: No data available.", actions: [] };
        }

        const data = marketData[target];
        const price = data.price;
        const change = data.changePercent;
        const rsi = data.rsi || 50;

        // Simple logic stub - In real life this would check 1d vs 1m data arrays
        analysis += `### 📐 Technical Analysis (${timeline})\n`;
        analysis += `- **Price**: $${price.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)\n`;
        analysis += `- **RSI**: ${rsi.toFixed(2)} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'})\n`;

        if (rsi > 75) signal = 'SELL';
        else if (rsi < 25) signal = 'BUY';

        if (timeline === '1m' || timeline === '1h') {
            analysis += `- **Intraday Trend**: ${change > 0 ? 'Bullish' : 'Bearish'} momentum detected.\n`;
        } else if (timeline === '1M' || timeline === '1Y') {
            analysis += `- **Long-Term Trend**: ${change > 10 ? 'Strong Uptrend' : change < -10 ? 'Downtrend' : 'Consolidation'}.\n`;
        }

        analysis += `- **Signal**: **${signal}**\n\n`;

        return {
            analysis,
            actions: [], // Quant Core generates signals, usually Strategy Layer turns them into Actions
            technicalSignal: signal
        };
    }
}
