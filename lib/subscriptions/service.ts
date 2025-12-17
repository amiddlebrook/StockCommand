/**
 * Subscription Management Service
 * 
 * Handles Stripe integration, subscription status, and user tier management.
 */

import { SubscriptionTier, getTierConfig, SUBSCRIPTION_TIERS } from './tiers';

// ============================================
// TYPES
// ============================================

export interface UserSubscription {
    userId: string;
    tier: SubscriptionTier;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'free';
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
}

export interface CheckoutResult {
    sessionId: string;
    url: string;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Get user's current subscription
 */
export async function getUserSubscription(db: D1Database, userId: string): Promise<UserSubscription> {
    const result = await db.prepare(`
        SELECT * FROM user_subscriptions WHERE user_id = ?
    `).bind(userId).first();

    if (!result) {
        return {
            userId,
            tier: 'free',
            status: 'free'
        };
    }

    return {
        userId: result.user_id as string,
        tier: result.tier as SubscriptionTier,
        stripeCustomerId: result.stripe_customer_id as string | undefined,
        stripeSubscriptionId: result.stripe_subscription_id as string | undefined,
        status: result.status as UserSubscription['status'],
        currentPeriodStart: result.current_period_start as number | undefined,
        currentPeriodEnd: result.current_period_end as number | undefined,
        cancelAtPeriodEnd: Boolean(result.cancel_at_period_end)
    };
}

/**
 * Update or create user subscription
 */
export async function upsertUserSubscription(
    db: D1Database,
    subscription: UserSubscription
): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await db.prepare(`
        INSERT INTO user_subscriptions (
            user_id, tier, stripe_customer_id, stripe_subscription_id, 
            status, current_period_start, current_period_end, cancel_at_period_end, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            tier = excluded.tier,
            stripe_customer_id = excluded.stripe_customer_id,
            stripe_subscription_id = excluded.stripe_subscription_id,
            status = excluded.status,
            current_period_start = excluded.current_period_start,
            current_period_end = excluded.current_period_end,
            cancel_at_period_end = excluded.cancel_at_period_end,
            updated_at = excluded.updated_at
    `).bind(
        subscription.userId,
        subscription.tier,
        subscription.stripeCustomerId || null,
        subscription.stripeSubscriptionId || null,
        subscription.status,
        subscription.currentPeriodStart || null,
        subscription.currentPeriodEnd || null,
        subscription.cancelAtPeriodEnd ? 1 : 0,
        now
    ).run();
}

// ============================================
// STRIPE INTEGRATION
// ============================================

/**
 * Create a Stripe checkout session for a tier upgrade
 */
export async function createCheckoutSession(
    env: any,
    userId: string,
    tier: SubscriptionTier,
    userEmail?: string
): Promise<CheckoutResult> {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }

    // Get price ID for the tier from environment
    const priceIdKey = `STRIPE_PRICE_${tier.toUpperCase()}`;
    const priceId = env[priceIdKey];

    if (!priceId) {
        throw new Error(`Missing Stripe price ID for tier: ${tier}`);
    }

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${env.APP_URL}/?subscription=success&tier=${tier}`);
    params.append('cancel_url', `${env.APP_URL}/?subscription=canceled`);
    params.append('client_reference_id', userId);
    params.append('metadata[tier]', tier);
    params.append('metadata[user_id]', userId);

    if (userEmail) {
        params.append('customer_email', userEmail);
    }

    // Allow promotion codes
    params.append('allow_promotion_codes', 'true');

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
 * Create a Stripe customer portal session for subscription management
 */
export async function createPortalSession(
    env: any,
    stripeCustomerId: string
): Promise<string> {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }

    const params = new URLSearchParams();
    params.append('customer', stripeCustomerId);
    params.append('return_url', `${env.APP_URL}/settings`);

    const auth = btoa(`${env.STRIPE_SECRET_KEY}:`);

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Stripe Portal Error: ${err}`);
    }

    const session = await response.json() as { url: string };
    return session.url;
}

/**
 * Map Stripe price ID to tier
 */
export function getTierFromPriceId(priceId: string, env: any): SubscriptionTier {
    const tiers: SubscriptionTier[] = ['observer', 'analyst', 'strategist', 'executor', 'autonomous'];

    for (const tier of tiers) {
        const envPriceId = env[`STRIPE_PRICE_${tier.toUpperCase()}`];
        if (envPriceId === priceId) {
            return tier;
        }
    }

    return 'free';
}

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
    env: any,
    payload: string,
    signature: string
): Promise<{ success: boolean; message: string }> {
    // Verify webhook signature
    if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    // Parse the event (in production, verify signature with Stripe SDK)
    const event = JSON.parse(payload);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.client_reference_id || session.metadata?.user_id;
            const tier = session.metadata?.tier as SubscriptionTier;

            if (userId && tier && env.DB) {
                await upsertUserSubscription(env.DB, {
                    userId,
                    tier,
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    status: 'active'
                });
            }
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const tier = priceId ? getTierFromPriceId(priceId, env) : 'free';

            // Find user by Stripe customer ID
            if (env.DB) {
                const user = await env.DB.prepare(`
                    SELECT user_id FROM user_subscriptions WHERE stripe_customer_id = ?
                `).bind(subscription.customer).first();

                if (user) {
                    await upsertUserSubscription(env.DB, {
                        userId: user.user_id as string,
                        tier,
                        stripeCustomerId: subscription.customer,
                        stripeSubscriptionId: subscription.id,
                        status: subscription.status === 'active' ? 'active' :
                            subscription.status === 'past_due' ? 'past_due' :
                                subscription.status === 'canceled' ? 'canceled' : 'active',
                        currentPeriodStart: subscription.current_period_start,
                        currentPeriodEnd: subscription.current_period_end,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end
                    });
                }
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;

            if (env.DB) {
                const user = await env.DB.prepare(`
                    SELECT user_id FROM user_subscriptions WHERE stripe_customer_id = ?
                `).bind(subscription.customer).first();

                if (user) {
                    await upsertUserSubscription(env.DB, {
                        userId: user.user_id as string,
                        tier: 'free',
                        stripeCustomerId: subscription.customer,
                        status: 'canceled'
                    });
                }
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;

            if (env.DB) {
                await env.DB.prepare(`
                    UPDATE user_subscriptions SET status = 'past_due' WHERE stripe_customer_id = ?
                `).bind(invoice.customer).run();
            }
            break;
        }
    }

    return { success: true, message: `Handled ${event.type}` };
}
