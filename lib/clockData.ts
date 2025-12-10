import { MarketClock } from './agent/types';

export const getClocksForEntity = (type: 'TICKER' | 'SLEEVE' | 'MARKET', id: string): MarketClock[] => {
    // Deterministic generator based on hash of the ID
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const statuses: ('green' | 'yellow' | 'red')[] = ['green', 'yellow', 'red', 'green', 'green', 'yellow'];
    const getStatus = (offset: number) => statuses[(hash + offset) % statuses.length];

    if (type === 'TICKER') {
        return [
            {
                code: `${id}_VOL`,
                label: 'Volatility',
                status: getStatus(0),
                reason: 'Implied Volatility Check'
            },
            {
                code: `${id}_MOM`,
                label: 'Momentum',
                status: getStatus(1),
                reason: 'RSI & MA Convergence'
            },
            {
                code: `${id}_SENT`,
                label: 'Sentiment',
                status: getStatus(2),
                reason: 'Social & News Sentiment',
                lastUpdated: Date.now()
            },
            {
                code: `${id}_VAL`,
                label: 'Valuation',
                status: getStatus(3),
                reason: 'P/E vs Sector',
                lastUpdated: Date.now()
            }
        ];
    } else if (type === 'SLEEVE') {
        return [
            {
                code: `${id}_ROT`,
                label: 'Rotation',
                status: getStatus(0),
                reason: 'Sector Rotation Signal',
                lastUpdated: Date.now() - (1000 * 60 * 60 * 25) // Stale (>24h)
            },
            {
                code: `${id}_FUND`,
                label: 'Fund Flows',
                status: getStatus(1),
                reason: 'ETF Inflows/Outflows',
                lastUpdated: Date.now()
            },
            {
                code: `${id}_TECH`,
                label: 'Technicals',
                status: getStatus(2),
                reason: 'Sleeve Aggregate Trend',
                lastUpdated: Date.now()
            }
        ];
    }

    return [];
};

export const getGlobalClocks = (): MarketClock[] => {
    // Generate default global macro clocks
    const clocks: MarketClock[] = [
        { code: 'LIQ_CYC', label: 'Liquidity Cycle', status: 'green', reason: 'Global Central Bank Net Injections Positive', lastUpdated: Date.now() },
        { code: 'COM_CYC', label: 'Commodity Cycle', status: 'yellow', reason: 'Energy Soft / Metals Hardening', lastUpdated: Date.now() },
        {
            code: 'VIX_REG',
            label: 'VIX Regime',
            status: 'red',
            reason: 'Volatility Compression Extreme',
            lastUpdated: Date.now() - (1000 * 60 * 60 * 26) // EXPLICITLY STALE FOR DEMO
        },
        { code: 'INF_TRD', label: 'Inflation Trend', status: 'green', reason: 'Disinflationary Trend Intact', lastUpdated: Date.now() },
        { code: 'CRD_IMP', label: 'Credit Impulse', status: 'green', reason: 'Bank Lending Standards Easing', lastUpdated: Date.now() },
        { code: 'DXY_STR', label: 'Dollar Strength', status: 'yellow', reason: 'Rangebound / Neutral', lastUpdated: Date.now() }
    ];
    return clocks;
};
