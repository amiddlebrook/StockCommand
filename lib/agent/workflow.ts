import { AgentEngine } from './engine';
import { ActionExecutor } from './actions';
import { MarketData, PortfolioState, UserStrategy, AgentAction, StrategyTrigger, StrategyAction } from './types';
import { UNIVERSE, SECTOR_ETFS, SectorName } from './universe';
import { getTickerFromCache } from '../../src/lib/caching';
import { CoreRouter } from './cores/router';
import { CoreContext } from './cores/types';

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
    env: any,
    scope: 'FULL' | 'SECTOR' | 'TICKER' | 'TOOL',
    target?: string,
    timeline: string = '1d'
): Promise<Record<string, MarketData>> {
    console.log(`Fetching market data via Cache (Scope: ${scope}, Target: ${target}, Timeline: ${timeline})...`);

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

    if (!env || !env.STOCK_CACHE_KV) {
        console.warn("Missing STOCK_CACHE_KV in fetchMarketData");
        return {};
    }

    const results = await Promise.all(targetSymbols.map(sym => getTickerFromCache(env.STOCK_CACHE_KV, sym, 'quote')));
    const marketData: Record<string, MarketData> = {};

    targetSymbols.forEach((sym, i) => {
        const res = results[i];
        if (res.data) {
            marketData[sym] = {
                price: res.data.price,
                changePercent: res.data.changePercent || 0,
                volume: 0, // Not in TickerArtifact
                timestamp: res.data.createdAt
            } as MarketData;
        }
    });

    return marketData;
}

// Portfolio fetcher - returns empty state when no broker connected
// TODO: Integrate with broker connection to fetch real portfolio
async function fetchPortfolioState(): Promise<PortfolioState> {
    // No broker connected - return empty portfolio
    return {
        cashBalance: 0,
        holdings: {},
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
            // Use real data from cache - no more hardcoded values
            if (trigger.metric === 'VIX') {
                const vixData = marketData['VIX'];
                currentValue = vixData?.price || 0; // VIX spot price
            } else if (trigger.metric === 'RSI') {
                // RSI should come from technical analysis in cache
                currentValue = (data as any)?.rsi || 0;
            } else if (trigger.metric === 'PRICE' && data) {
                currentValue = data.price;
            } else if (trigger.metric === 'DEFCON') {
                // DEFCON is calculated from market conditions - default to neutral (3) only if no clocks
                currentValue = 3; // This would need clock aggregation logic
            }

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
    strategies: UserStrategy[] = [],
    timeline: string = '1d' // Default to 1d if not provided
) {
    console.log(`Starting StockCommand Multi-Core Workflow (Scope: ${scope}, Timeline: ${timeline})...`);

    const AV_KEY = env.ALPHA_VANTAGE_API_KEY || ''; // Legacy, unused
    const AGENT_KEY = env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '';

    if (!AGENT_KEY) {
        console.error("Missing OPENROUTER_DEEPSEEK_NEX_API_KEY");
        return { analysis: "Error: Missing LLM API Key", actions: [] };
    }

    // 1. Refresh Data
    // Fetch data respecting the requested timeline (1m, 1h, etc.)
    const [marketData, portfolio] = await Promise.all([
        fetchMarketData(AGENT_KEY, scope, target, timeline),
        fetchPortfolioState()
    ]);

    // 2. Dispatch to Cores (New Architecture)
    const router = new CoreRouter();
    const coreContext: CoreContext = {
        scope,
        target,
        tool,
        marketData,
        portfolio,
        timeline: timeline as any,
        apiKey: AGENT_KEY
    };

    const coreResult = await router.dispatch(coreContext);
    const { analysis, actions: engineActions, clocks } = coreResult;

    // 3. Evaluate User Strategies (Strategic Overlay)
    // ... Legacy Strategy logic remains valid ...
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
