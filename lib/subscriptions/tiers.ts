/**
 * Agent Fuel Pricing Model (Usage-Based)
 * 
 * Honest, transparent usage billing.
 * Users purchase "Fuel" (credits) which agents consume to operate.
 * No monthly subscriptions - pay only for active usage.
 * 
 * RATIO:
 * $1.00 USD = 1,000 Credits
 * 
 * CONSUMPTION:
 * - Agent Scan/Check: 1 Credit (approx. $0.001)
 * - Trade Execution:  10 Credits (approx. $0.01)
 * 
 * ECONOMICS:
 * - Hourly scanner cost: 24 credits/day = 720 credits/month
 * - Monthly cost per agent: ~$0.72 USD
 * - 10 Active Agents: ~$7.20 USD/month
 */

// ============================================
// PRICING CONSTANTS
// ============================================

export const PRICING = {
    // Exchange Rate
    CREDITS_PER_DOLLAR: 1000,

    // Action Costs (in Credits)
    COSTS: {
        AGENT_RUN: 1,       // Standard interval check/scan
        TRADE_EXECUTION: 10, // Executing a trade on broker
        AI_ANALYSIS: 5,     // Deep dive AI analysis (manual request)
        SIGNAL_GENERATION: 2 // Generating a signal
    },

    // Fuel Deposits
    MIN_DEPOSIT: 1, // Minimum $1 deposit

    // Volume Bonuses (Applied to deposits)
    BONUSES: [
        { threshold: 10, percent: 0.10 }, // 10% bonus for $10+
        { threshold: 25, percent: 0.20 }, // 20% bonus for $25+
        { threshold: 100, percent: 0.25 } // 25% bonus for $100+
    ],

    // Safety Caps
    MIN_BALANCE_WARNING: 100, // Warn user when balance drops below this
    AUTO_PAUSE_THRESHOLD: 0   // Pause agents when balance hits 0
};

// ============================================
// TYPES
// ============================================

export interface UserBalance {
    userId: string;
    credits: number;
    lifetimeCredits: number; // Total credits ever purchased
    isAutoRefill: boolean;   // Auto-buy starter pack when low?
    lowBalanceThreshold: number;
}

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    type: 'purchase' | 'usage' | 'bonus' | 'refund';
    description: string;
    timestamp: number;
    metadata?: any;
}

// ============================================
// HELPERS
// ============================================

export function calculateRunCost(intervalMinutes: number): number {
    // Checks per day
    const checksPerDay = (60 / intervalMinutes) * 24;
    return Math.ceil(checksPerDay * PRICING.COSTS.AGENT_RUN);
}

export function estimateMonthlyCost(agents: number, intervalMinutes: number = 60): number {
    const dailyCost = calculateRunCost(intervalMinutes) * agents;
    const monthlyCredits = dailyCost * 30;
    return monthlyCredits / PRICING.CREDITS_PER_DOLLAR;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
