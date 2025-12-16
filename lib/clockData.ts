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
        // FINANCIAL / SYSTEMIC
        createBlankClock('CLOCK_LIQUIDITY', 'Global Liquidity', 'FINANCIAL'),
        createBlankClock('CLOCK_REAL_YIELDS', 'US 10Y Real Yields', 'FINANCIAL'),
        createBlankClock('CLOCK_CREDIT_SPREADS', 'HYG Credit Spreads', 'FINANCIAL'),
        createBlankClock('CLOCK_DXY_DOLLAR', 'DXY Dollar Index', 'FINANCIAL'),
        createBlankClock('CLOCK_MOVE_INDEX', 'Bond Volatility (MOVE)', 'FINANCIAL'),

        // MARKET STRUCTURE / FLOWS
        createBlankClock('CLOCK_GEX_GAMMA', 'Gamma Exposure (GEX)', 'MARKETS'),
        createBlankClock('CLOCK_DPI_DARKPOOL', 'Dark Pool Index (DPI)', 'MARKETS'),
        createBlankClock('CLOCK_COMMODITIES', 'Commodity Index', 'MARKETS'),
        createBlankClock('CLOCK_BTC_FLOWS', 'Bitcoin Net Flows', 'MARKETS'),

        // SENTIMENT
        createBlankClock('CLOCK_VIX_TERM', 'VIX Term Structure', 'SENTIMENT'),
        createBlankClock('CLOCK_PUT_CALL', 'Equity Put/Call Ratio', 'SENTIMENT'),
        createBlankClock('CLOCK_INSIDER_SENT', 'Insider Sentiment', 'SENTIMENT'),

        // SECTOR ROTATION
        createBlankClock('CLOCK_SEC_TECH', 'Tech (XLK) Relative', 'SECTOR'),
        createBlankClock('CLOCK_SEC_ENERGY', 'Energy (XLE) Relative', 'SECTOR'),
        createBlankClock('CLOCK_SEC_DEFENSE', 'Defense (ITA) Relative', 'SECTOR'),

        // NEWS / NARRATIVE
        createBlankClock('CLOCK_NEWS_WIRE', 'Live News Wire', 'NEWS'),
        createBlankClock('CLOCK_FILINGS', 'SEC Filings Stream', 'NEWS'),
        createBlankClock('CLOCK_EARNINGS', 'Earnings Calendar', 'NEWS'),
    ];
};
