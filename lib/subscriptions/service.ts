/**
 * Agent Fuel Service
 * 
 * Handles credit balance, fuel purchases, and usage tracking.
 */

import { PRICING, CreditTransaction, UserBalance } from './tiers';

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Get user's current credit balance
 */
export async function getUserBalance(db: D1Database, userId: string): Promise<UserBalance> {
    const result = await db.prepare(`
        SELECT * FROM user_balances WHERE user_id = ?
    `).bind(userId).first();

    if (!result) {
        return {
            userId,
            credits: 0,
            lifetimeCredits: 0,
            isAutoRefill: false,
            lowBalanceThreshold: PRICING.MIN_BALANCE_WARNING
        };
    }

    return {
        userId: result.user_id as string,
        credits: result.credits as number,
        lifetimeCredits: result.lifetime_credits as number,
        isAutoRefill: Boolean(result.is_auto_refill),
        lowBalanceThreshold: result.low_balance_threshold as number
    };
}

/**
 * Create a fuel purchase checkout session
 */
export async function createFuelCheckout(
    env: any,
    userId: string,
    amount: number, // In dollars
    userEmail?: string
): Promise<{ sessionId: string; url: string }> {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }

    if (amount < PRICING.MIN_DEPOSIT) {
        throw new Error(`Minimum deposit is $${PRICING.MIN_DEPOSIT}`);
    }

    // Calculate credits + bonus
    const baseCredits = amount * PRICING.CREDITS_PER_DOLLAR;
    let bonusPercent = 0;

    for (const bonus of PRICING.BONUSES) {
        if (amount >= bonus.threshold) {
            // Take the highest applicable bonus
            if (bonus.percent > bonusPercent) {
                bonusPercent = bonus.percent;
            }
        }
    }

    const bonusCredits = Math.floor(baseCredits * bonusPercent);
    const totalCredits = baseCredits + bonusCredits;

    const params = new URLSearchParams();
    params.append('mode', 'payment');

    // Create line item for "Agent Fuel"
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Agent Fuel: ${totalCredits.toLocaleString()} Credits`);
    params.append('line_items[0][price_data][product_data][description]', `To power your AI agents. Includes ${bonusCredits.toLocaleString()} bonus credits.`);
    params.append('line_items[0][price_data][unit_amount]', Math.floor(amount * 100).toString()); // In cents
    params.append('line_items[0][quantity]', '1');

    params.append('success_url', `${env.APP_URL}/?fuel=success&amount=${amount}`);
    params.append('cancel_url', `${env.APP_URL}/?fuel=canceled`);
    params.append('client_reference_id', userId);

    // Metadata for webhook fulfillment
    params.append('metadata[type]', 'fuel_purchase');
    params.append('metadata[user_id]', userId);
    params.append('metadata[credits]', totalCredits.toString());
    params.append('metadata[amount]', amount.toString());

    if (userEmail) {
        params.append('customer_email', userEmail);
    }

    const auth = btoa(`${env.STRIPE_SECRET_KEY}:`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Stripe Error: ${err}`);
    }

    const session = await response.json() as { id: string; url: string };
    return {
        sessionId: session.id,
        url: session.url
    };
}

/**
 * Record credit usage (deduct from user balance)
 */
export async function recordUsage(
    db: D1Database,
    userId: string,
    cost: number,
    description: string,
    metadata?: any
): Promise<boolean> {
    const balance = await getUserBalance(db, userId);

    if (balance.credits < cost) {
        return false; // Insufficient funds
    }

    const now = Math.floor(Date.now() / 1000);

    // Transactional update
    await db.batch([
        // Deduct credits
        db.prepare(`
            UPDATE user_balances 
            SET credits = credits - ?, updated_at = ? 
            WHERE user_id = ?
        `).bind(cost, now, userId),

        // Record transaction
        db.prepare(`
            INSERT INTO credit_transactions (
                id, user_id, amount, type, description, timestamp, metadata
            ) VALUES (?, ?, ?, 'usage', ?, ?, ?)
        `).bind(
            crypto.randomUUID(),
            userId,
            -cost,
            description,
            now,
            JSON.stringify(metadata || {})
        )
    ]);

    return true;
}

/**
 * Handle Stripe webhook events for fuel
 */
export async function handleStripeWebhook(
    env: any,
    payload: string,
    signature: string
): Promise<{ success: boolean; message: string }> {
    if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    const event = JSON.parse(payload);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Only handle fuel purchases
        if (session.metadata?.type === 'fuel_purchase') {
            const userId = session.metadata.user_id;
            const credits = parseInt(session.metadata.credits);
            const amount = parseFloat(session.metadata.amount);

            if (userId && credits && env.DB) {
                const now = Math.floor(Date.now() / 1000);

                // Add credits to balance
                await env.DB.batch([
                    env.DB.prepare(`
                        INSERT INTO user_balances (user_id, credits, lifetime_credits, updated_at)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(user_id) DO UPDATE SET
                            credits = credits + ?,
                            lifetime_credits = lifetime_credits + ?,
                            updated_at = ?
                    `).bind(userId, credits, credits, now, credits, credits, now),

                    env.DB.prepare(`
                        INSERT INTO credit_transactions (
                            id, user_id, amount, type, description, timestamp, metadata
                        ) VALUES (?, ?, ?, 'purchase', ?, ?, ?)
                    `).bind(
                        crypto.randomUUID(),
                        userId,
                        credits,
                        `Purchased $${amount} Fuel`,
                        now,
                        JSON.stringify({ stripe_session: session.id })
                    )
                ]);
            }
        }
    }

    return { success: true, message: `Handled ${event.type}` };
}
