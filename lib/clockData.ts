import { MarketClock } from './agent/types';

// Helper for blank slate state
const createBlankClock = (code: string, label: string): MarketClock => ({
    code,
    label,
    status: 'gray', // Default to Gray (Unknown)
    reason: 'Analysis Required', // Placeholder text
    lastUpdated: 0 // Explicitly 0 to trigger "Stale" state immediately
});

export const getClocksForEntity = (type: 'TICKER' | 'SLEEVE' | 'MARKET', id: string): MarketClock[] => {
    if (type === 'TICKER') {
        return [
            createBlankClock(`${id}_VOL`, 'Volatility'),
            createBlankClock(`${id}_MOM`, 'Momentum'),
            createBlankClock(`${id}_SENT`, 'Sentiment'),
            createBlankClock(`${id}_VAL`, 'Valuation')
        ];
    } else if (type === 'SLEEVE') {
        return [
            createBlankClock(`${id}_ROT`, 'Rotation'),
            createBlankClock(`${id}_FUND`, 'Fund Flows'),
            createBlankClock(`${id}_TECH`, 'Technicals')
        ];
    }

    return [];
};

export const getGlobalClocks = (): MarketClock[] => {
    // Generate default global macro clocks with NO pre-filled data
    return [
        createBlankClock('LIQ_CYC', 'Liquidity Cycle'),
        createBlankClock('COM_CYC', 'Commodity Cycle'),
        createBlankClock('VIX_REG', 'VIX Regime'),
        createBlankClock('INF_TRD', 'Inflation Trend'),
        createBlankClock('CRD_IMP', 'Credit Impulse'),
        createBlankClock('DXY_STR', 'Dollar Strength')
    ];
};
