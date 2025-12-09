import { AgentEngine } from './engine';
import { ActionExecutor } from './actions';
import { MarketData, PortfolioState } from './types';
import { UNIVERSE } from './universe';
import { MarketDataService } from './market-data';

// Env variables should be passed in from the worker
async function fetchMarketData(avKey: string): Promise<Record<string, MarketData>> {
    console.log('Fetching market data with MarketDataService...');
    const service = new MarketDataService(avKey);

    // For testing, we might want to slice the UNIVERSE to avoid hammering APIs immediately
    // But for the full run, we use the whole thing.
    const targetSymbols = UNIVERSE.map(t => t.symbol);

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
    const marketData = await fetchMarketData(AV_KEY);
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
