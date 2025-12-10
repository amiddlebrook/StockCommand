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
                reason: 'Social & News Sentiment'
            },
            {
                code: `${id}_VAL`,
                label: 'Valuation',
                status: getStatus(3),
                reason: 'P/E vs Sector'
            }
        ];
    } else if (type === 'SLEEVE') {
        return [
            { code: `${id}_ROT`, label: 'Rotation', status: getStatus(0), reason: 'Sector Rotation Signal' },
            { code: `${id}_FUND`, label: 'Fund Flows', status: getStatus(1), reason: 'ETF Inflows/Outflows' },
            { code: `${id}_TECH`, label: 'Technicals', status: getStatus(2), reason: 'Sleeve Aggregate Trend' }
        ];
    }

    // Market Clocks (Default fallback)
    return [];
};
