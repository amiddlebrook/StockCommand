import { AgentEngine } from './engine';
import { ActionExecutor } from './actions';
import { MarketData, PortfolioState } from './types';
import { UNIVERSE } from './universe';
import { MarketDataService } from './market-data';

// Env variables should be passed in or loaded from process.env
// For this scaffolding, we'll try to read from process.env
const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

async function fetchMarketData(): Promise<Record<string, MarketData>> {
    console.log('Fetching market data with MarketDataService...');
    const service = new MarketDataService(AV_KEY);

    // For testing, we might want to slice the UNIVERSE to avoid hammering APIs immediately
    // But for the full run, we use the whole thing.
    // const targetSymbols = UNIVERSE.map(t => t.symbol).slice(0, 5); // Test 5
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

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''; // Cloudflare secret

export async function runAgentWorkflow(
    scope: 'FULL' | 'SLEEVE' | 'TICKER' = 'FULL',
    target?: string
) {
    console.log(`Starting StockCommand Agent Workflow (Scope: ${scope})...`);

    // 1. Refresh Data
    const marketData = await fetchMarketData();
    const portfolio = await fetchPortfolioState();

    // 2. Research & Analyze (Engine with LLM)
    if (!GEMINI_KEY) {
        console.error("Missing GEMINI_API_KEY");
        return;
    }
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
