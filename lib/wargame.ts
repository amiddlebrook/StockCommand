import { MarketClock, UserStrategy, StrategyAction } from './agent/types';

export interface BattleResult {
    outcome: 'VICTORY' | 'DEFEAT' | 'DRAW';
    pnlPercent: number;
    alpha: number; // vs SPY
    log: string[];
    timestamp: number;
}

export function simulateWarGame(strategy: UserStrategy, clocks: MarketClock[]): BattleResult {
    const log: string[] = [];
    log.push(`Initializing simulation for strategy: ${strategy.name}...`);
    log.push(`Market Regime: Analyzing ${clocks.length} clocks...`);

    // 1. Calculate Market Regime Score (-10 to +10)
    let marketScore = 0;
    clocks.forEach(c => {
        if (c.status === 'green') marketScore += 1;
        if (c.status === 'red') marketScore -= 1;
        // yellow is neutral
    });

    // Normalize Market Score
    const regime = marketScore > 2 ? 'BULL' : marketScore < -2 ? 'BEAR' : 'CHOP';
    log.push(`Detected Regime: ${regime} (Score: ${marketScore})`);

    // 2. Calculate Strategy Bias (-10 to +10)
    let strategyBias = 0;
    let aggressiveness = 0;

    strategy.actions.forEach(a => {
        if (a.type === 'BUY') {
            strategyBias += 2;
            aggressiveness += 1;
        } else if (a.type === 'SELL') {
            strategyBias -= 2;
            aggressiveness += 1;
        } else if (a.type === 'REBALANCE') {
            strategyBias -= 0.5; // Slight defensive lean
        }
    });

    log.push(`Strategy Bias: ${strategyBias > 0 ? 'LONG' : strategyBias < 0 ? 'SHORT' : 'NEUTRAL'}`);
    log.push(`Aggressiveness: ${aggressiveness}`);

    // 3. Battle Logic
    // Correlation: Does Strategy fit Regime?
    let performance = 0;

    if (regime === 'BULL') {
        if (strategyBias > 0) performance = 5 + (aggressiveness * 1.5); // Aggressive longs win big
        else if (strategyBias < 0) performance = -8 - aggressiveness;   // Shorts get squeezed
        else performance = 1; // Neutral survives
    } else if (regime === 'BEAR') {
        if (strategyBias < 0) performance = 6 + (aggressiveness * 1.5); // Shorts win
        else if (strategyBias > 0) performance = -10 - aggressiveness;  // Longs get crushed
        else performance = 2; // Cash is king
    } else { // CHOP
        if (Math.abs(strategyBias) < 2) performance = 3; // Neutral/Rebalance works best
        else performance = -2; // Directional strategies get chopped
    }

    // Add Random Variance (-2 to +2)
    const variance = (Math.random() * 4) - 2;
    performance += variance;

    // 4. Calculate Results
    const pnl = parseFloat(performance.toFixed(2));
    const alpha = parseFloat((pnl - (regime === 'BULL' ? 2 : regime === 'BEAR' ? -2 : 0)).toFixed(2));

    let outcome: BattleResult['outcome'] = 'DRAW';
    if (alpha > 1) outcome = 'VICTORY';
    if (alpha < -1) outcome = 'DEFEAT';

    log.push(`Simulation Complete.`);
    log.push(`Performance: ${pnl}%`);
    log.push(`Alpha generated: ${alpha}%`);
    log.push(`Outcome: ${outcome}`);

    return {
        outcome,
        pnlPercent: pnl,
        alpha,
        log,
        timestamp: Date.now()
    };
}
