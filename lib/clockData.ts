import { MarketClock } from './agent/types';

// Helper for blank slate state
const createBlankClock = (code: string, label: string, category: MarketClock['category']): MarketClock => ({
    code,
    label,
    status: 'gray', // Default to Gray (Unknown)
    reason: 'Analysis Required', // Placeholder text
    lastUpdated: 0, // Explicitly 0 to trigger "Stale" state immediately
    category
});

export const getClocksForEntity = (type: 'TICKER' | 'SLEEVE' | 'MARKET', id: string): MarketClock[] => {
    if (type === 'TICKER') {
        return [
            createBlankClock(`${id}_VOL`, 'Volatility', 'MARKETS'),
            createBlankClock(`${id}_MOM`, 'Momentum', 'MARKETS'),
            createBlankClock(`${id}_SENT`, 'Sentiment', 'SENTIMENT'),
            createBlankClock(`${id}_VAL`, 'Valuation', 'FINANCIAL')
        ];
    } else if (type === 'SLEEVE') {
        return [
            createBlankClock(`${id}_ROT`, 'Rotation', 'MARKETS'),
            createBlankClock(`${id}_FUND`, 'Fund Flows', 'FINANCIAL'),
            createBlankClock(`${id}_TECH`, 'Technicals', 'MARKETS')
        ];
    }

    return [];
};

export const getGlobalClocks = (): MarketClock[] => {
    return [
        // FINANCIAL / MACRO
        createBlankClock('CLOCK_LIQUIDITY_CYCLE', 'Global Liquidity', 'FINANCIAL'),
        createBlankClock('CLOCK_CREDIT_IMPULSE', 'Credit Impulse', 'FINANCIAL'),
        createBlankClock('CLOCK_INFLATION_TREND', 'Inflation Trend', 'FINANCIAL'),
        createBlankClock('CLOCK_DOLLAR_STRENGTH', 'Dollar Strength', 'FINANCIAL'),
        createBlankClock('CLOCK_YIELD_CURVE', 'Yield Curve', 'FINANCIAL'),

        // MARKETS (Broad Indices/Commodities)
        createBlankClock('CLOCK_COMMODITY_CYCLE', 'Commodity Cycle', 'MARKETS'),
        createBlankClock('CLOCK_SPX_TREND', 'S&P 500 Trend', 'MARKETS'),
        createBlankClock('CLOCK_NDX_TREND', 'Nasdaq 100 Trend', 'MARKETS'),
        createBlankClock('CLOCK_BTC_CYCLE', 'Bitcoin Cycle', 'MARKETS'),

        // SENTIMENT
        createBlankClock('CLOCK_VIX_REGIME', 'VIX / Volatility', 'SENTIMENT'),
        createBlankClock('CLOCK_PUT_CALL', 'Put/Call Ratio', 'SENTIMENT'),
        createBlankClock('CLOCK_FEAR_GREED', 'Fear & Greed', 'SENTIMENT'),

        // SECTOR
        createBlankClock('CLOCK_SECTOR_TECH', 'Tech Sector', 'SECTOR'),
        createBlankClock('CLOCK_SECTOR_ENERGY', 'Energy Sector', 'SECTOR'),
        createBlankClock('CLOCK_SECTOR_DEFENSE', 'Defense Sector', 'SECTOR'),
        createBlankClock('CLOCK_SECTOR_FINANCIALS', 'Financials Sector', 'SECTOR'),

        // NEWS / NARRATIVE
        createBlankClock('CLOCK_NEWS_GEOPOL', 'Geopolitics', 'NEWS'),
        createBlankClock('CLOCK_NEWS_EARNINGS', 'Earnings Season', 'NEWS'),
    ];
};
