import { AgentCore, CoreContext, CoreOutput } from './types';
import { SentinelCore } from './sentinel';
import { QuantCore } from './quant';
import { MacroCore } from './macro';

export class CoreRouter {
    private cores: AgentCore[];

    constructor() {
        this.cores = [
            new SentinelCore(),
            new QuantCore(),
            new MacroCore()
        ];
    }

    public async dispatch(context: CoreContext): Promise<CoreOutput> {
        console.log(`[CoreRouter] Dispatching task (Scope: ${context.scope}, Timeline: ${context.timeline})`);

        // 1. Select Cores based on Scope
        const activeCores = this.selectCores(context);
        console.log(`[CoreRouter] Activated Cores: ${activeCores.map(c => c.name).join(', ')}`);

        // 2. Parallel Execution
        const results = await Promise.all(activeCores.map(core => core.process(context)));

        // 3. Aggregate Results
        return this.aggregate(results);
    }

    private selectCores(context: CoreContext): AgentCore[] {
        const { scope, target } = context;
        const selected: AgentCore[] = [];

        // Always run Sentinel (News is always relevant)
        selected.push(this.cores.find(c => c instanceof SentinelCore)!);

        if (scope === 'TICKER' || scope === 'SECTOR') {
            // Technical Analysis handling
            selected.push(this.cores.find(c => c instanceof QuantCore)!);
        }

        if (scope === 'FULL' || scope === 'SECTOR' || (scope === 'TOOL')) {
            // Macro handling
            selected.push(this.cores.find(c => c instanceof MacroCore)!);
        }

        // Special case: Tickers that represent Macro
        if (target && ['SPY', 'QQQ', 'VIX', 'GLD', 'BTC'].includes(target)) {
            selected.push(this.cores.find(c => c instanceof MacroCore)!);
        }

        // De-duplicate
        return Array.from(new Set(selected));
    }

    private aggregate(results: CoreOutput[]): CoreOutput {
        let combinedAnalysis = "";
        let combinedActions: any[] = [];
        let combinedClocks: any[] = [];
        let sentimentSum = 0;
        let sentimentCount = 0;

        results.forEach(res => {
            combinedAnalysis += res.analysis;
            combinedActions = [...combinedActions, ...res.actions];
            if (res.clocks) combinedClocks = [...combinedClocks, ...res.clocks];
            if (res.sentimentScore !== undefined) {
                sentimentSum += res.sentimentScore;
                sentimentCount++;
            }
        });

        // Add Summary Header
        const avgSentiment = sentimentCount > 0 ? Math.round(sentimentSum / sentimentCount) : 50;
        const header = `### 🧠 Multi-Core Synthesis\n- **Overall Sentiment**: ${avgSentiment}/100\n- **Active Cores**: ${results.length}\n\n`;

        return {
            analysis: header + combinedAnalysis,
            actions: combinedActions,
            clocks: combinedClocks,
            sentimentScore: avgSentiment
        };
    }
}
