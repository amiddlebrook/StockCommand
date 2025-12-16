import { AgentEngine } from './engine';
import { ActionExecutor } from './actions';
import { MarketData, PortfolioState } from './types';
import { UNIVERSE } from './universe';
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
    scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL',
    target?: string
): Promise<Record<string, MarketData>> {
    console.log(`Fetching market data via MarketDataService (Scope: ${scope}, Target: ${target})...`);
    const service = new MarketDataService(avKey);

    let targetSymbols: string[] = [];

    if (scope === 'FULL') {
        // For FULL scan, we might still need everything, or we can limit to top holdings + proxies
        // To avoid timeouts, let's prioritize proxies and core tech for now
        // Or specific list of "Active" tickers if we had that context.
        // For safely, let's limit to 30 random/important cached ones or just mapped proxies?
        // Actually, fetching 100+ symbols sequentially is definitely asking for a timeout.
        // Let's filter to Core Tech + Macro Proxies
        targetSymbols = UNIVERSE.filter(t => t.sleeve === 'Core Tech' || t.sleeve === 'Macro' || t.sleeve.includes("Specialized")).map(t => t.symbol);
    } else if (scope === 'SLEEVE') {
        targetSymbols = UNIVERSE.filter(t => t.sleeve === target).map(t => t.symbol);
    } else if (scope === 'TICKER') {
        if (target) targetSymbols = [target];
    } else if (scope === 'TOOL') {
        if (target) {
            // Check for proxies first, but if target looks like a list or specific symbol, use that
            if (TOOL_PROXIES[target] && !target.includes(',')) {
                targetSymbols = TOOL_PROXIES[target];
            } else {
                // It's a user-provided ticker or list of tickers
                targetSymbols = target.split(',').map(s => s.trim());
            }
        }
    }

    // Deduplicate
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

export async function runAgentWorkflow(
    env: any,
    scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL' = 'FULL',
    target?: string,
    tool?: string
) {
    console.log(`Starting StockCommand Agent Workflow (Scope: ${scope}, Tool: ${tool || 'None'})...`);

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

    console.log(`DEBUG: DeepSeek Key Length: ${DEEPSEEK_KEY.length}`);
    if (DEEPSEEK_KEY.length > 5) {
        console.log(`DEBUG: DeepSeek Key Start: ${DEEPSEEK_KEY.substring(0, 4)}... End: ...${DEEPSEEK_KEY.slice(-4)}`);
    } else {
        console.log(`DEBUG: DeepSeek Key is too short! (${DEEPSEEK_KEY})`);
    }

    // 1. Refresh Data
    // 1. Refresh Data
    const marketData = await fetchMarketData(AV_KEY, scope, target);
    const portfolio = await fetchPortfolioState();

    // 2. Research & Analyze (Engine with LLM)
    const engine = new AgentEngine(DEEPSEEK_KEY);
    const { analysis, actions, clocks } = await engine.evaluate(scope, marketData, portfolio, target, tool);

    // 3. Act
    console.log("--- ANALYSIS REPORT ---");
    console.log(analysis);
    console.log("-----------------------");

    if (actions.length > 0) {
        console.log(`Found ${actions.length} recommended actions.`);
        const executor = new ActionExecutor();
        await executor.execute(actions);
    } else {
        console.log('No actions recommended by the AI.');
    }

    console.log('Workflow complete.');
    return { analysis, actions, clocks };
}
