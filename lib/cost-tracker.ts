/**
 * D1 Cost Tracking Service
 * 
 * Tracks all API costs in D1 database with token-level granularity.
 * Implements budget auto-pause logic and user billing.
 */

import { Env } from '../types';

interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

interface CostEntry {
    userId: string;
    operation: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    creditsCharged: number;
    metadata?: Record<string, any>;
}

// Model pricing (per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
    'deepseek/deepseek-coder': { input: 0.14, output: 0.28 },
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
    'google/gemini-flash-1.5': { input: 0.075, output: 0.30 },
    '@cf/meta/llama-3-8b-instruct': { input: 0, output: 0 }, // Free (Workers AI)
    '@cf/baai/bge-base-en-v1.5': { input: 0, output: 0 }, // Free (Workers AI)
    'default': { input: 0.50, output: 1.50 }
};

// 1 credit = $0.0001 USD
const USD_TO_CREDITS = 10000;

export class CostTracker {
    private env: Env;

    constructor(env: Env) {
        this.env = env;
    }

    /**
     * Calculate cost for token usage
     */
    calculateCost(model: string, usage: TokenUsage): { costUsd: number; credits: number } {
        const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];

        const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
        const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
        const totalCostUsd = inputCost + outputCost;

        // Convert to credits with 20% markup for platform
        const creditsRaw = totalCostUsd * USD_TO_CREDITS;
        const creditsWithMarkup = Math.ceil(creditsRaw * 1.2);

        return {
            costUsd: totalCostUsd,
            credits: Math.max(1, creditsWithMarkup) // Minimum 1 credit
        };
    }

    /**
     * Record a cost entry and deduct credits
     */
    async recordCost(entry: CostEntry): Promise<{
        success: boolean;
        remainingCredits: number;
        error?: string;
    }> {
        const db = this.env.DB;

        try {
            // Get current balance
            const balanceResult = await db
                .prepare('SELECT credits FROM user_balances WHERE user_id = ?')
                .bind(entry.userId)
                .first<{ credits: number }>();

            const currentCredits = balanceResult?.credits || 0;

            if (currentCredits < entry.creditsCharged) {
                return {
                    success: false,
                    remainingCredits: currentCredits,
                    error: 'Insufficient credits'
                };
            }

            // Deduct credits
            const newBalance = currentCredits - entry.creditsCharged;

            await db.batch([
                // Update balance
                db.prepare(`
                    INSERT INTO user_balances (user_id, credits, lifetime_credits, updated_at)
                    VALUES (?, ?, 0, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        credits = ?,
                        updated_at = ?
                `).bind(
                    entry.userId,
                    newBalance,
                    Date.now(),
                    newBalance,
                    Date.now()
                ),

                // Log transaction
                db.prepare(`
                    INSERT INTO credit_transactions (id, user_id, amount, type, description, timestamp, metadata)
                    VALUES (?, ?, ?, 'usage', ?, ?, ?)
                `).bind(
                    `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    entry.userId,
                    -entry.creditsCharged,
                    `${entry.operation} (${entry.model})`,
                    Date.now(),
                    JSON.stringify({
                        model: entry.model,
                        inputTokens: entry.inputTokens,
                        outputTokens: entry.outputTokens,
                        costUsd: entry.costUsd,
                        ...entry.metadata
                    })
                )
            ]);

            // Log to analytics
            await this.env.ANALYTICS.writeDataPoint({
                blobs: ['token_usage', entry.model, entry.operation],
                doubles: [entry.totalTokens, entry.costUsd, entry.creditsCharged],
                indexes: [entry.userId]
            });

            return {
                success: true,
                remainingCredits: newBalance
            };
        } catch (error: any) {
            console.error('Cost tracking error:', error);
            return {
                success: false,
                remainingCredits: 0,
                error: error.message
            };
        }
    }

    /**
     * Get user's current credit balance
     */
    async getBalance(userId: string): Promise<{
        credits: number;
        lifetimeCredits: number;
        isLow: boolean;
        threshold: number;
    }> {
        const result = await this.env.DB
            .prepare(`
                SELECT credits, lifetime_credits, low_balance_threshold
                FROM user_balances
                WHERE user_id = ?
            `)
            .bind(userId)
            .first<{ credits: number; lifetime_credits: number; low_balance_threshold: number }>();

        const credits = result?.credits || 0;
        const threshold = result?.low_balance_threshold || 100;

        return {
            credits,
            lifetimeCredits: result?.lifetime_credits || 0,
            isLow: credits <= threshold,
            threshold
        };
    }

    /**
     * Add credits to user's balance (purchase, bonus, etc.)
     */
    async addCredits(
        userId: string,
        amount: number,
        reason: string,
        type: 'purchase' | 'bonus' | 'refund' = 'purchase'
    ): Promise<{ success: boolean; newBalance: number }> {
        const db = this.env.DB;

        try {
            // Get current balance
            const current = await this.getBalance(userId);
            const newBalance = current.credits + amount;

            await db.batch([
                db.prepare(`
                    INSERT INTO user_balances (user_id, credits, lifetime_credits, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        credits = ?,
                        lifetime_credits = lifetime_credits + ?,
                        updated_at = ?
                `).bind(
                    userId,
                    newBalance,
                    amount,
                    Date.now(),
                    newBalance,
                    type === 'purchase' ? amount : 0,
                    Date.now()
                ),

                db.prepare(`
                    INSERT INTO credit_transactions (id, user_id, amount, type, description, timestamp, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    userId,
                    amount,
                    type,
                    reason,
                    Date.now(),
                    JSON.stringify({})
                )
            ]);

            return { success: true, newBalance };
        } catch (error: any) {
            console.error('Add credits error:', error);
            return { success: false, newBalance: 0 };
        }
    }

    /**
     * Check if user can afford an operation (budget guard)
     */
    async canAfford(userId: string, estimatedCredits: number): Promise<{
        canAfford: boolean;
        currentBalance: number;
        estimatedCost: number;
        shortfall?: number;
    }> {
        const balance = await this.getBalance(userId);
        const canAfford = balance.credits >= estimatedCredits;

        return {
            canAfford,
            currentBalance: balance.credits,
            estimatedCost: estimatedCredits,
            shortfall: canAfford ? undefined : estimatedCredits - balance.credits
        };
    }

    /**
     * Get usage history for a user
     */
    async getUsageHistory(
        userId: string,
        limit: number = 50
    ): Promise<{
        transactions: any[];
        totalSpent: number;
        totalAdded: number;
    }> {
        const result = await this.env.DB
            .prepare(`
                SELECT * FROM credit_transactions
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            `)
            .bind(userId, limit)
            .all();

        const transactions = result.results || [];

        let totalSpent = 0;
        let totalAdded = 0;

        for (const txn of transactions as any[]) {
            if (txn.amount < 0) {
                totalSpent += Math.abs(txn.amount);
            } else {
                totalAdded += txn.amount;
            }
        }

        return {
            transactions,
            totalSpent,
            totalAdded
        };
    }

    /**
     * Get usage broken down by category
     */
    async getUsageByCategory(userId: string, days: number = 30): Promise<{
        category: string;
        credits: number;
        tokenCount: number;
    }[]> {
        const since = Date.now() - (days * 24 * 60 * 60 * 1000);

        const result = await this.env.DB
            .prepare(`
                SELECT 
                    CASE 
                        WHEN description LIKE '%chat%' THEN 'Chat'
                        WHEN description LIKE '%scan%' THEN 'Analysis'
                        WHEN description LIKE '%embed%' THEN 'Embeddings'
                        ELSE 'Other'
                    END as category,
                    SUM(ABS(amount)) as credits,
                    COUNT(*) as count
                FROM credit_transactions
                WHERE user_id = ? AND amount < 0 AND timestamp > ?
                GROUP BY category
            `)
            .bind(userId, since)
            .all();

        return (result.results || []).map((r: any) => ({
            category: r.category,
            credits: r.credits,
            tokenCount: r.count * 500 // Rough estimate
        }));
    }

    /**
     * Estimate cost for an operation
     */
    estimateOperationCost(operation: string, model: string = 'deepseek/deepseek-chat'): number {
        const estimates: Record<string, TokenUsage> = {
            'chat': { inputTokens: 500, outputTokens: 1000, totalTokens: 1500 },
            'analysis': { inputTokens: 2000, outputTokens: 2000, totalTokens: 4000 },
            'scan': { inputTokens: 3000, outputTokens: 3000, totalTokens: 6000 },
            'embedding': { inputTokens: 200, outputTokens: 0, totalTokens: 200 },
            'flow': { inputTokens: 5000, outputTokens: 3000, totalTokens: 8000 }
        };

        const usage = estimates[operation] || estimates['chat'];
        const { credits } = this.calculateCost(model, usage);
        return credits;
    }
}

export type { CostEntry, TokenUsage };
