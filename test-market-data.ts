import { MarketDataService } from './lib/agent/market-data';

// Mock key (or read from env if you populate .env)
// For local testing without .env, you might need to insert a real key here or expect Yahoo fallback.
const MOCK_KEY = 'demo';

async function test() {
    console.log('Testing MarketDataService...');

    // Test a mix of symbols
    // 'IBM' works with 'demo' key on Alpha Vantage
    // 'NVDA' might fail on 'demo' key -> should fallback to Yahoo
    const symbols = ['IBM', 'NVDA', 'BTC'];

    const service = new MarketDataService(MOCK_KEY);
    const data = await service.fetchMarketData(symbols);

    console.log('Results:', JSON.stringify(data, null, 2));
}

test();
