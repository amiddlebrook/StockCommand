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
    scope: 'FULL' | 'SLEEVE' | 'TICKER' = 'FULL',
    target?: string
) {
    console.log(`Starting StockCommand Agent Workflow (Scope: ${scope})...`);

    const AV_KEY = env.ALPHA_VANTAGE_API_KEY || '';
    const GEMINI_KEY = env.GEMINI_API_KEY || '';

    if (!AV_KEY) {
        console.error("Missing ALPHA_VANTAGE_API_KEY");
        return { analysis: "Error: Missing Alpha Vantage API Key", actions: [] };
    }

    if (!GEMINI_KEY) {
        console.error("Missing GEMINI_API_KEY");
        return { analysis: "Error: Missing Gemini API Key", actions: [] };
    }

    console.log(`DEBUG: Gemini Key Length: ${GEMINI_KEY.length}`);
    if (GEMINI_KEY.length > 5) {
        console.log(`DEBUG: Gemini Key Start: ${GEMINI_KEY.substring(0, 4)}... End: ...${GEMINI_KEY.slice(-4)}`);
    } else {
        console.log(`DEBUG: Gemini Key is too short! (${GEMINI_KEY})`);
    }

    // 1. Refresh Data
    const marketData = await fetchMarketData(AV_KEY);
    const portfolio = await fetchPortfolioState();

    // 2. Research & Analyze (Engine with LLM)
    const engine = new AgentEngine(GEMINI_KEY);
    const { analysis, actions } = await engine.evaluate(scope, marketData, portfolio, target);

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
    return { analysis, actions };
}
