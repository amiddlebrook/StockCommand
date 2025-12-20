import { MarketClock } from './agent/types';

// Demo clock with random status for presentation
const createDemoClock = (
    code: string,
    label: string,
    category: MarketClock['category'],
    status?: 'green' | 'yellow' | 'red',
    reason?: string
): MarketClock => ({
    code,
    label,
    status: status || 'yellow', // Default to yellow (working/unknown) instead of random
    reason: reason || 'Initializing swarm analysis...',
    lastUpdated: Date.now(),
    category
});

export const getClocksForEntity = (type: 'TICKER' | 'SECTOR' | 'MARKET', id: string): MarketClock[] => {
    if (type === 'TICKER') {
        // Ticker-specific clocks - marked with tickerSymbol so they don't appear in global categories
        return [
            { ...createDemoClock(`${id}_VOL`, 'Volatility', 'TICKER'), tickerSymbol: id },
            { ...createDemoClock(`${id}_MOM`, 'Momentum', 'TICKER'), tickerSymbol: id },
            { ...createDemoClock(`${id}_SENT`, 'Sentiment', 'TICKER'), tickerSymbol: id },
            { ...createDemoClock(`${id}_VAL`, 'Valuation', 'TICKER'), tickerSymbol: id }
        ];
    } else if (type === 'SECTOR') {
        return [
            createDemoClock(`${id}_ROT`, 'Rotation', 'SECTOR'),
            createDemoClock(`${id}_FUND`, 'Fund Flows', 'SECTOR'),
            createDemoClock(`${id}_TECH`, 'Technicals', 'SECTOR')
        ];
    }

    return [];
};

export const getGlobalClocks = (): MarketClock[] => {
    return [
        // FINANCIAL / SYSTEMIC
        createDemoClock('CLOCK_LIQUIDITY', 'Global Liquidity', 'FINANCIAL', 'green', 'Central bank balance sheets expanding'),
        createDemoClock('CLOCK_REAL_YIELDS', 'US 10Y Real Yields', 'FINANCIAL', 'yellow', 'Yields elevated but stable'),
        createDemoClock('CLOCK_CREDIT_SPREADS', 'HYG Credit Spreads', 'FINANCIAL', 'green', 'Spreads tightening - risk on'),
        createDemoClock('CLOCK_DXY_DOLLAR', 'DXY Dollar Index', 'FINANCIAL', 'yellow', 'Dollar consolidating near 104'),
        createDemoClock('CLOCK_MOVE_INDEX', 'Bond Volatility (MOVE)', 'FINANCIAL', 'green', 'Bond vol declining'),

        // MARKET STRUCTURE / FLOWS
        createDemoClock('CLOCK_GEX_GAMMA', 'Gamma Exposure (GEX)', 'MARKETS', 'green', 'Positive GEX - dealers buying dips'),
        createDemoClock('CLOCK_DPI_DARKPOOL', 'Dark Pool Index (DPI)', 'MARKETS', 'yellow', 'Neutral dark pool activity'),
        createDemoClock('CLOCK_COMMODITIES', 'Commodity Index', 'MARKETS', 'red', 'Commodities weakening'),
        createDemoClock('CLOCK_BTC_FLOWS', 'Bitcoin Net Flows', 'MARKETS', 'green', 'BTC accumulation by whales'),

        // SENTIMENT
        createDemoClock('CLOCK_VIX_TERM', 'VIX Term Structure', 'SENTIMENT', 'green', 'Contango structure intact'),
        createDemoClock('CLOCK_PUT_CALL', 'Equity Put/Call Ratio', 'SENTIMENT', 'yellow', 'Neutral sentiment'),
        createDemoClock('CLOCK_INSIDER_SENT', 'Insider Sentiment', 'SENTIMENT', 'green', 'Net buying by insiders'),

        // SECTOR ROTATION
        createDemoClock('CLOCK_SEC_TECH', 'Tech (XLK) Relative', 'SECTOR', 'green', 'Tech outperforming SPY'),
        createDemoClock('CLOCK_SEC_ENERGY', 'Energy (XLE) Relative', 'SECTOR', 'red', 'Energy underperforming'),
        createDemoClock('CLOCK_SEC_DEFENSE', 'Defense (ITA) Relative', 'SECTOR', 'yellow', 'Defense in line with market'),
        createDemoClock('CLOCK_SEC_HEALTH', 'Healthcare (XLV) Relative', 'SECTOR', 'green', 'Defensive rotation in play'),
        createDemoClock('CLOCK_SEC_FIN', 'Financials (XLF) Relative', 'SECTOR', 'yellow', 'Banks range-bound'),

        // NEWS / NARRATIVE
        createDemoClock('CLOCK_NEWS_WIRE', 'Live News Wire', 'NEWS', 'yellow', 'Mixed headlines today'),
        createDemoClock('CLOCK_FILINGS', 'SEC Filings Stream', 'NEWS', 'green', 'No material filings'),
        createDemoClock('CLOCK_EARNINGS', 'Earnings Calendar', 'NEWS', 'green', 'NVDA beat estimates +8%'),
    ];
};
