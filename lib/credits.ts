/**
 * Credits System - API Cost-Based Pricing
 * 
 * Credits are priced based on actual API usage costs plus a profit margin
 * to ensure the platform is self-sustaining at any scale.
 * 
 * Pricing Philosophy:
 * - Base cost = Actual API cost (e.g., Gemini, Alpha Vantage, etc.)
 * - Credit price = Base cost × margin multiplier (1.5x default)
 * - 1 Credit ≈ $0.001 USD (1000 credits = $1)
 */

// Storage key for credits
const CREDITS_STORAGE_KEY = 'stockcommand_credits_v1';
const CREDITS_HISTORY_KEY = 'stockcommand_credits_history_v1';

// Default starting credits for new users (demo/free tier)
const DEFAULT_STARTING_CREDITS = 1000;

// Profit margin multiplier (1.5 = 50% margin)
const MARGIN_MULTIPLIER = 1.5;

/**
 * Credit costs per operation type
 * Based on approximate API costs:
 * - Gemini Flash: ~$0.00001 per 1K tokens input, ~$0.00004 per 1K output
 * - Alpha Vantage: ~$0.01 per call (premium tier)
 * - Google Search API: ~$0.005 per query
 */
export const CREDIT_COSTS = {
    // Data Sync Operations
    TICKER_QUOTE_SYNC: 2,          // Single ticker price quote (~$0.001 API cost)
    TICKER_FULL_SYNC: 5,           // Full ticker data (price + technicals)
    MARKET_CLOCK_SYNC: 3,          // Single market clock refresh
    GLOBAL_CLOCKS_REFRESH: 15,     // Refresh all global clocks

    // Agent Operations  
    AGENT_CHAT_MESSAGE: 5,         // Single chat message (Gemini Flash)
    AGENT_SCAN_TICKER: 25,         // Deep ticker analysis (search + LLM)
    AGENT_SCAN_SECTOR: 50,         // Sector-wide scan
    AGENT_SCAN_FULL: 100,          // Full market scan
    AGENT_GROUNDING_SEARCH: 10,    // Google grounding search

    // Premium Operations
    PORTFOLIO_REPORT: 75,          // Full portfolio analysis
    STRATEGY_BACKTEST: 50,         // Run backtest simulation
    OPTIMIZER_ITERATION: 20,       // Single optimization iteration

    // Background Sync (per interval)
    AUTO_SYNC_TICKER: 1,           // Background ticker price update
    AUTO_SYNC_CLOCK: 2,            // Background clock update
} as const;

export type CreditOperationType = keyof typeof CREDIT_COSTS;

export interface CreditTransaction {
    id: string;
    type: CreditOperationType;
    amount: number;
    timestamp: number;
    target?: string; // ticker symbol, clock code, etc.
    balance: number; // Balance after transaction
}

export interface CreditBalance {
    credits: number;
    lastUpdated: number;
}

/**
 * Credits Service - manages credit balance and transactions
 */
export const CreditsService = {
    /**
     * Load current credit balance from storage
     */
    loadBalance: (): CreditBalance => {
        try {
            const saved = localStorage.getItem(CREDITS_STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
            // Initialize new user with default credits
            const initial: CreditBalance = {
                credits: DEFAULT_STARTING_CREDITS,
                lastUpdated: Date.now()
            };
            localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(initial));
            return initial;
        } catch (e) {
            console.error('Failed to load credits', e);
            return { credits: DEFAULT_STARTING_CREDITS, lastUpdated: Date.now() };
        }
    },

    /**
     * Save credit balance to storage
     */
    saveBalance: (balance: CreditBalance): void => {
        try {
            localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(balance));
        } catch (e) {
            console.error('Failed to save credits', e);
        }
    },

    /**
     * Get credit cost for an operation
     */
    getCost: (operation: CreditOperationType): number => {
        return CREDIT_COSTS[operation];
    },

    /**
     * Check if user has enough credits for an operation
     */
    canAfford: (operation: CreditOperationType, quantity: number = 1): boolean => {
        const balance = CreditsService.loadBalance();
        const cost = CREDIT_COSTS[operation] * quantity;
        return balance.credits >= cost;
    },

    /**
     * Deduct credits for an operation
     * Returns true if successful, false if insufficient credits
     */
    deduct: (operation: CreditOperationType, target?: string, quantity: number = 1): boolean => {
        const balance = CreditsService.loadBalance();
        const cost = CREDIT_COSTS[operation] * quantity;

        if (balance.credits < cost) {
            console.warn(`Insufficient credits: need ${cost}, have ${balance.credits}`);
            return false;
        }

        const newBalance: CreditBalance = {
            credits: balance.credits - cost,
            lastUpdated: Date.now()
        };

        CreditsService.saveBalance(newBalance);
        CreditsService.logTransaction(operation, cost, target, newBalance.credits);

        return true;
    },

    /**
     * Add credits to balance (purchase, reward, etc.)
     */
    addCredits: (amount: number, reason?: string): void => {
        const balance = CreditsService.loadBalance();
        const newBalance: CreditBalance = {
            credits: balance.credits + amount,
            lastUpdated: Date.now()
        };
        CreditsService.saveBalance(newBalance);

        // Log as a special "CREDIT_ADD" transaction
        CreditsService.logTransaction('AGENT_CHAT_MESSAGE', -amount, reason || 'Credit Purchase', newBalance.credits);
    },

    /**
     * Log transaction to history
     */
    logTransaction: (operation: CreditOperationType, amount: number, target: string | undefined, balanceAfter: number): void => {
        try {
            const saved = localStorage.getItem(CREDITS_HISTORY_KEY);
            const history: CreditTransaction[] = saved ? JSON.parse(saved) : [];

            const transaction: CreditTransaction = {
                id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: operation,
                amount,
                timestamp: Date.now(),
                target,
                balance: balanceAfter
            };

            // Keep last 100 transactions
            history.unshift(transaction);
            if (history.length > 100) history.pop();

            localStorage.setItem(CREDITS_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to log credit transaction', e);
        }
    },

    /**
     * Get transaction history
     */
    getHistory: (limit: number = 20): CreditTransaction[] => {
        try {
            const saved = localStorage.getItem(CREDITS_HISTORY_KEY);
            const history: CreditTransaction[] = saved ? JSON.parse(saved) : [];
            return history.slice(0, limit);
        } catch (e) {
            return [];
        }
    },

    /**
     * Get credit cost breakdown for display
     */
    getCostBreakdown: () => {
        return [
            {
                category: 'Data Sync', items: [
                    { name: 'Ticker Quote', cost: CREDIT_COSTS.TICKER_QUOTE_SYNC, description: 'Real-time price update' },
                    { name: 'Full Ticker Sync', cost: CREDIT_COSTS.TICKER_FULL_SYNC, description: 'Price + technicals' },
                    { name: 'Clock Sync', cost: CREDIT_COSTS.MARKET_CLOCK_SYNC, description: 'Single clock refresh' },
                    { name: 'All Clocks Refresh', cost: CREDIT_COSTS.GLOBAL_CLOCKS_REFRESH, description: 'Refresh all market clocks' },
                ]
            },
            {
                category: 'Agent Operations', items: [
                    { name: 'Chat Message', cost: CREDIT_COSTS.AGENT_CHAT_MESSAGE, description: 'AI conversation' },
                    { name: 'Ticker Scan', cost: CREDIT_COSTS.AGENT_SCAN_TICKER, description: 'Deep ticker analysis' },
                    { name: 'Sector Scan', cost: CREDIT_COSTS.AGENT_SCAN_SECTOR, description: 'Full sector analysis' },
                    { name: 'Market Scan', cost: CREDIT_COSTS.AGENT_SCAN_FULL, description: 'Complete market scan' },
                ]
            },
            {
                category: 'Premium', items: [
                    { name: 'Portfolio Report', cost: CREDIT_COSTS.PORTFOLIO_REPORT, description: 'Full portfolio analysis' },
                    { name: 'Strategy Backtest', cost: CREDIT_COSTS.STRATEGY_BACKTEST, description: 'Historical simulation' },
                    { name: 'Optimizer Run', cost: CREDIT_COSTS.OPTIMIZER_ITERATION, description: 'Per optimization cycle' },
                ]
            },
            {
                category: 'Background Sync', items: [
                    { name: 'Auto Ticker Update', cost: CREDIT_COSTS.AUTO_SYNC_TICKER, description: 'Per ticker per interval' },
                    { name: 'Auto Clock Update', cost: CREDIT_COSTS.AUTO_SYNC_CLOCK, description: 'Per clock per interval' },
                ]
            },
        ];
    },

    /**
     * Calculate estimated monthly cost based on current usage
     */
    estimateMonthlyCost: (tickerCount: number, clockCount: number, scansPerDay: number, chatsPerDay: number): number => {
        // Assuming auto-sync every 5 minutes during market hours (6.5 hrs = 78 syncs/day)
        const syncsPerDay = 78;
        const daysPerMonth = 22; // Trading days

        const tickerCost = tickerCount * CREDIT_COSTS.AUTO_SYNC_TICKER * syncsPerDay * daysPerMonth;
        const clockCost = clockCount * CREDIT_COSTS.AUTO_SYNC_CLOCK * syncsPerDay * daysPerMonth;
        const scanCost = scansPerDay * CREDIT_COSTS.AGENT_SCAN_TICKER * daysPerMonth;
        const chatCost = chatsPerDay * CREDIT_COSTS.AGENT_CHAT_MESSAGE * daysPerMonth;

        return tickerCost + clockCost + scanCost + chatCost;
    },

    /**
     * Reset credits (for demo/testing)
     */
    resetCredits: (): void => {
        const balance: CreditBalance = {
            credits: DEFAULT_STARTING_CREDITS,
            lastUpdated: Date.now()
        };
        localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(balance));
        localStorage.removeItem(CREDITS_HISTORY_KEY);
    }
};
