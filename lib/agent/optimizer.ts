import { UserStrategy, StrategyTrigger, MarketData, TriggerOperator } from './types';

// PRO MODE GATE (Mock function found in auth.ts usually, but here checking state object directly)
// In a real implementation, this would verify the user's tier from the DB/Session.
const verifyProAccess = (isPro: boolean): void => {
    if (!isPro) {
        throw new Error("ACCESS DENIED: Optimization requires a Pro Plan.");
    }
};

/**
 * THE STRATEGY OPTIMIZATION ENGINE
 * -----------------------
 * This service implements a Genetic Algorithm to optimize user strategies.
 * It follows a Standard Optimization Loop:
 * 1. Perturbation: Randomly varies strategy parameters (Triggers)
 * 2. Validation: Testing against Historical Data (Backtesting)
 * 3. Selection: Identifying optimal configurations
 */
export class StrategyOptimizer {

    // Mutation Rate: How much a parameter can change per iteration (e.g. +/- 10%)
    private readonly MUTATION_RATE = 0.1;

    constructor() { }

    /**
     * PERTURBATION FUNCTION
     * Creates a variant strategy from a base strategy.
     */
    public mutateStrategy(parent: UserStrategy): UserStrategy {
        // Clone the base strategy to avoid reference issues
        const child: UserStrategy = JSON.parse(JSON.stringify(parent));

        child.id = `opt_${crypto.randomUUID().slice(0, 8)}`; // New Identity
        child.name = `${parent.name} (v${parent.createdAt ? 'X' : 'Opt'})`; // Mark as variant
        child.createdAt = Date.now();

        // Mutate Triggers
        child.triggers = child.triggers.map(trigger => {
            // 30% chance to mutate any specific trigger
            if (Math.random() > 0.7) {
                return this.mutateTrigger(trigger);
            }
            return trigger;
        });

        return child;
    }

    private mutateTrigger(trigger: StrategyTrigger): StrategyTrigger {
        const newTrigger = { ...trigger };

        // Mutate Value: Shift by +/- 10%
        const variance = newTrigger.value * this.MUTATION_RATE;
        const drift = (Math.random() * variance * 2) - variance; // Range: [-variance, +variance]

        newTrigger.value = Number((newTrigger.value + drift).toFixed(2));

        // 10% chance to flip operator (Rare mutation)
        if (Math.random() > 0.9) {
            newTrigger.operator = this.flipOperator(newTrigger.operator);
        }

        return newTrigger;
    }

    private flipOperator(op: TriggerOperator): TriggerOperator {
        switch (op) {
            case '>': return '<';
            case '<': return '>';
            case 'CROSSES_ABOVE': return 'CROSSES_BELOW';
            case 'CROSSES_BELOW': return 'CROSSES_ABOVE';
            default: return op;
        }
    }

    /**
     * FITNESS FUNCTION (Internal Run)
     * Replays the strategy against a history of market data snapshots.
     * Returns a "Fitness Score" (e.g., PnL % or Win Rate %)
     */
    public backtestStrategy(strategy: UserStrategy, history: Record<string, MarketData>[]): number {
        let cash = 10000;
        let position = 0;
        let tradeCount = 0;
        let entryPrice = 0;

        // Simple replay loop
        for (const marketSnapshot of history) {

            // Check if triggers are met for this snapshot
            const isEntrySignal = this.checkTriggers(strategy.triggers, marketSnapshot);

            // LOGIC: Simple Buy/Sell Reversal for testing
            // If Signal + No Position -> Buy
            // If Position + Profit Target (simulated) -> Sell
            // Note: This is an abstraction of the full Engine logic for speed.

            if (isEntrySignal && position === 0) {
                // BUY
                // Use first trigger's symbol or default to SPY logic
                const targetPrice = this.getPriceFromSnapshot(marketSnapshot, strategy.triggers[0]?.symbol || 'SPY');
                if (targetPrice > 0) {
                    position = Math.floor(cash / targetPrice);
                    cash -= position * targetPrice;
                    entryPrice = targetPrice;
                    tradeCount++;
                }
            } else if (position > 0) {
                // SELL LOGIC (Simplified: Sell if 5% gain or loss, or random exit for mutation noise)
                const currentPrice = this.getPriceFromSnapshot(marketSnapshot, strategy.triggers[0]?.symbol || 'SPY');
                const pnlPct = (currentPrice - entryPrice) / entryPrice;

                // Stop Loss / Take Profit hardcoded for fitness baseline
                if (pnlPct > 0.05 || pnlPct < -0.02) {
                    cash += position * currentPrice;
                    position = 0;
                }
            }
        }

        // Close any final positions
        if (position > 0) {
            const lastPrice = this.getPriceFromSnapshot(history[history.length - 1], strategy.triggers[0]?.symbol || 'SPY');
            cash += position * lastPrice;
        }

        const totalReturn = (cash - 10000) / 10000;

        // Fitness = Return - (Penalty for inactivity)
        if (tradeCount === 0) return -1.0; // Penalize doing nothing
        return totalReturn;
    }

    private checkTriggers(triggers: StrategyTrigger[], data: Record<string, MarketData>): boolean {
        // Assume AND logic
        return triggers.every(t => {
            const metricValue = this.getMetricFromSnapshot(data, t);
            switch (t.operator) {
                case '>': return metricValue > t.value;
                case '<': return metricValue < t.value;
                case '=': return metricValue === t.value;
                default: return false;
            }
        });
    }

    private getPriceFromSnapshot(data: Record<string, MarketData>, symbol?: string): number {
        const tick = data[symbol || 'SPY'];
        return tick ? tick.price : 0;
    }

    private getMetricFromSnapshot(data: Record<string, MarketData>, trigger: StrategyTrigger): number {
        const tick = data[trigger.symbol || 'SPY'];
        if (!tick) return 0; // Default

        switch (trigger.metric) {
            case 'PRICE': return tick.price;
            case 'RSI': return tick.rsi || 50;
            case 'CHANGE_PCT': return tick.changePercent;
            // Mocking others
            case 'VIX': return 20;
            case 'MA_50': return tick.price * 0.95;
            default: return 0;
        }
    }

    /**
     * MAIN EVOLUTION LOOP
     * Generates a population, tests them, and picks the winner.
     */
    public async evolve(
        parentStrategy: UserStrategy,
        history: Record<string, MarketData>[],
        populationSize: number = 10,
        isPro: boolean = false
    ): Promise<{ bestStrategy: UserStrategy, improvement: number }> {

        // 1. GATEKEEPING
        verifyProAccess(isPro);

        // 2. GENERATION
        const population: UserStrategy[] = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(this.mutateStrategy(parentStrategy));
        }

        // 3. INTERNAL RUNS (Parallel Mock)
        const results = population.map(strat => {
            return {
                strategy: strat,
                fitness: this.backtestStrategy(strat, history)
            };
        });

        // 4. SELECTION
        results.sort((a, b) => b.fitness - a.fitness); // Descending

        // 5. BASELINE CHECK
        const baselineFitness = this.backtestStrategy(parentStrategy, history);
        const bestVariant = results[0];

        // Only return if we found an improvement
        const improvement = bestVariant.fitness - baselineFitness;

        return {
            bestStrategy: bestVariant.strategy,
            improvement: improvement
        };
    }
}
