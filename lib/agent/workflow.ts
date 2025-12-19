import { AgentEngine } from './engine';
import { ActionExecutor } from './actions';
import { MarketData, PortfolioState, UserStrategy, AgentAction, StrategyTrigger, StrategyAction } from './types';
import { UNIVERSE, SECTOR_ETFS, SectorName } from './universe';
import { MarketDataService } from './market-data';

// Env variables should be passed in from the worker
const TOOL_PROXIES: Record<string, string[]> = {
    'CLOCK_LIQUIDITY_CYCLE': ['BTC', 'HYG', 'SPY'],
    'CLOCK_COMMODITY_CYCLE': ['DBC', 'USO', 'DBB'],
    'CLOCK_VIX_REGIME': ['VIX', 'SPY'],
    'CLOCK_INFLATION_TREND': ['TIP', 'IEF', 'USO'],
    'CLOCK_CREDIT_IMPULSE': ['HYG', 'LQD'],
    'CLOCK_DOLLAR_STRENGTH': ['UUP', 'GLD', 'SPY']
};

async function fetchMarketData(
    avKey: string,
    scope: 'FULL' | 'SECTOR' | 'TICKER' | 'TOOL',
    target?: string
): Promise<Record<string, MarketData>> {
    console.log(`Fetching market data via MarketDataService (Scope: ${scope}, Target: ${target})...`);
    const service = new MarketDataService(avKey);

    let targetSymbols: string[] = [];

    if (scope === 'FULL') {
        // Fetch all sector ETFs for full scan
        targetSymbols = Object.values(SECTOR_ETFS);
    } else if (scope === 'SECTOR') {
        // Fetch tickers in a specific sector
        targetSymbols = UNIVERSE.filter(t => t.sector === target).map(t => t.symbol);
        // Also include sector ETF
        const sectorEtf = SECTOR_ETFS[target as SectorName];
        if (sectorEtf) targetSymbols.push(sectorEtf);
    } else if (scope === 'TICKER') {
        if (target) targetSymbols = [target];
    } else if (scope === 'TOOL') {
        if (target) {
            if (TOOL_PROXIES[target] && !target.includes(',')) {
                targetSymbols = TOOL_PROXIES[target];
            } else {
                targetSymbols = target.split(',').map(s => s.trim());
            }
        }
    }

    targetSymbols = Array.from(new Set(targetSymbols));

    console.log(`Identified ${targetSymbols.length} symbols to fetch.`);
    return await service.fetchMarketData(targetSymbols);
}

// Mock portfolio fetcher
async function fetchPortfolioState(): Promise<PortfolioState> {
    return {
        cashBalance: 50000,
        holdings: {
            'NVDA': { quantity: 10, costBasis: 400 },
            'MSFT': { quantity: 20, costBasis: 300 }
        },
        lastUpdated: new Date().toISOString()
    };
}

function evaluateStrategies(strategies: UserStrategy[], marketData: Record<string, MarketData>): AgentAction[] {
    const actions: AgentAction[] = [];

    // Simplistic evaluation engine
    strategies.forEach(strategy => {
        if (!strategy.active) return;

        let triggersMet = false;

        // Check triggers (AND logic)
        const metCount = strategy.triggers.filter(trigger => {
            const data = marketData[trigger.metric] || marketData['SPY'];

            let currentValue = 0;
            if (trigger.metric === 'VIX') currentValue = 20; // Mock
            else if (trigger.metric === 'RSI') currentValue = 50; // Mock
            else if (trigger.metric === 'PRICE' && data) currentValue = data.price;
            else if (trigger.metric === 'DEFCON') currentValue = 3; // Mock

            switch (trigger.operator) {
                case '>': return currentValue > trigger.value;
                case '<': return currentValue < trigger.value;
                case '=': return currentValue === trigger.value;
                default: return false;
            }
        }).length;

        triggersMet = metCount === strategy.triggers.length;

        if (triggersMet) {
            console.log(`Strategy [${strategy.name}] FIRED!`);
            strategy.actions.forEach(action => {
                let agentActionType: AgentAction['type'] = 'ALERT';
                if (action.type === 'REBALANCE') agentActionType = 'TRIM';
                else if (action.type === 'BUY') agentActionType = 'BUY';
                else if (action.type === 'SELL') agentActionType = 'SELL';

                // Check if target is a sector name
                const isSector = Object.keys(SECTOR_ETFS).includes(action.target);

                actions.push({
                    type: agentActionType,
                    ticker: !isSector ? action.target : undefined,
                    sector: isSector ? action.target as SectorName : undefined,
                    confidence: 1.0,
                    reason: `Strategy [${strategy.name}] triggered: ${strategy.triggers.map(t => `${t.metric} ${t.operator} ${t.value}`).join(', ')}`
                });
            });
        }
    });

    return actions;
}

export async function runAgentWorkflow(
    env: any,
    scope: 'FULL' | 'SECTOR' | 'TICKER' | 'TOOL' = 'FULL',
    target?: string,
    tool?: string,
    strategies: UserStrategy[] = []
) {
    console.log(`Starting StockCommand Agent Workflow (Scope: ${scope}, Tool: ${tool || 'None'}, Strategies: ${strategies.length})...`);

    const AV_KEY = env.ALPHA_VANTAGE_API_KEY || '';
    const DEEPSEEK_KEY = env.OPENROUTER_DEEPSEEK_CHAT_API_KEY || '';

    if (!AV_KEY) {
        console.error("Missing ALPHA_VANTAGE_API_KEY");
        return { analysis: "Error: Missing Alpha Vantage API Key", actions: [] };
    }

    if (!DEEPSEEK_KEY) {
        console.error("Missing OPENROUTER_DEEPSEEK_CHAT_API_KEY");
        return { analysis: "Error: Missing DeepSeek API Key", actions: [] };
    }

    // 1. Refresh Data
    const [marketData, portfolio] = await Promise.all([
        fetchMarketData(AV_KEY, scope, target),
        fetchPortfolioState()
    ]);

    // 2. Research & Analyze (Engine with LLM)
    const engine = new AgentEngine(DEEPSEEK_KEY);
    const { analysis, actions: engineActions, clocks } = await engine.evaluate(scope, marketData, portfolio, target, tool);

    // 3. Evaluate User Strategies (Strategic Overlay)
    const strategyActions = evaluateStrategies(strategies, marketData);
    const allActions = [...engineActions, ...strategyActions];

    // 4. Act
    console.log("--- ANALYSIS REPORT ---");
    console.log(analysis);
    if (strategyActions.length > 0) {
        console.log("--- STRATEGY OVERRIDES ---");
        strategyActions.forEach(a => console.log(`[${a.type}] ${a.ticker || a.sector}: ${a.reason}`));
    }
    console.log("-----------------------");

    if (allActions.length > 0) {
        console.log(`Found ${allActions.length} actions (${engineActions.length} AI, ${strategyActions.length} Strategy).`);
        const executor = new ActionExecutor();
        await executor.execute(allActions);
    } else {
        console.log('No actions recommended.');
    }

    console.log('Workflow complete.');
    // Append strategy report to analysis
    const strategyReport = strategyActions.length > 0
        ? `\n\n### STRATEGY FORGE ACTIVATION\n${strategyActions.map(a => `- **${a.ticker || a.sector}**: ${a.reason}`).join('\n')}`
        : '';

    return { analysis: analysis + strategyReport, actions: allActions, clocks };
}
