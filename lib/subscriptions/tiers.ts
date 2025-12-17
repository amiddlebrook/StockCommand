/**
 * Subscription Tiers and Feature Gating
 * 
 * Defines the 5-tier pricing structure and feature access control.
 */

// ============================================
// SUBSCRIPTION TIERS
// ============================================

export type SubscriptionTier = 'free' | 'observer' | 'analyst' | 'strategist' | 'executor' | 'autonomous';

export interface TierConfig {
    id: SubscriptionTier;
    name: string;
    displayName: string;
    price: number; // Monthly in USD
    stripePriceId?: string; // Set via environment
    features: FeatureAccess;
    limits: TierLimits;
    description: string;
    recommended?: boolean;
}

export interface FeatureAccess {
    viewSignals: boolean;
    viewMarketClocks: boolean;
    viewPortfolio: boolean;
    viewCompetitions: boolean;
    viewLeaderboards: boolean;

    // Chat & AI
    chatMessagesPerDay: number;
    aiAnalysis: boolean;

    // Broker Integration
    brokerConnections: number;
    manualTrading: boolean;
    semiAutoTrading: boolean;
    fullAutoTrading: boolean;

    // Strategy
    customAlerts: boolean;
    strategyBuilder: boolean;
    strategyBacktest: boolean;
    strategyExport: boolean;

    // Social
    competitionParticipation: boolean;
    strategySharing: boolean;
    strategyCloning: boolean;

    // Priority
    prioritySupport: boolean;
    earlyAccess: boolean;
}

export interface TierLimits {
    symbolsWatchlist: number;
    savedStrategies: number;
    competitionsActive: number;
    alertsActive: number;
    tradesPerDay: number;
}

// ============================================
// TIER DEFINITIONS
// ============================================

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
    free: {
        id: 'free',
        name: 'free',
        displayName: 'Free Trial',
        price: 0,
        description: 'Try StockCommand with limited features',
        features: {
            viewSignals: true,
            viewMarketClocks: true,
            viewPortfolio: false,
            viewCompetitions: true,
            viewLeaderboards: true,
            chatMessagesPerDay: 5,
            aiAnalysis: false,
            brokerConnections: 0,
            manualTrading: false,
            semiAutoTrading: false,
            fullAutoTrading: false,
            customAlerts: false,
            strategyBuilder: false,
            strategyBacktest: false,
            strategyExport: false,
            competitionParticipation: false,
            strategySharing: false,
            strategyCloning: false,
            prioritySupport: false,
            earlyAccess: false
        },
        limits: {
            symbolsWatchlist: 5,
            savedStrategies: 0,
            competitionsActive: 0,
            alertsActive: 0,
            tradesPerDay: 0
        }
    },

    observer: {
        id: 'observer',
        name: 'observer',
        displayName: 'Observer',
        price: 9.99,
        description: 'View signals and track markets manually',
        features: {
            viewSignals: true,
            viewMarketClocks: true,
            viewPortfolio: true,
            viewCompetitions: true,
            viewLeaderboards: true,
            chatMessagesPerDay: 20,
            aiAnalysis: true,
            brokerConnections: 0,
            manualTrading: false,
            semiAutoTrading: false,
            fullAutoTrading: false,
            customAlerts: false,
            strategyBuilder: false,
            strategyBacktest: false,
            strategyExport: false,
            competitionParticipation: true,
            strategySharing: false,
            strategyCloning: false,
            prioritySupport: false,
            earlyAccess: false
        },
        limits: {
            symbolsWatchlist: 20,
            savedStrategies: 0,
            competitionsActive: 1,
            alertsActive: 0,
            tradesPerDay: 0
        }
    },

    analyst: {
        id: 'analyst',
        name: 'analyst',
        displayName: 'Analyst',
        price: 14.99,
        description: 'Custom alerts and 1 broker connection',
        features: {
            viewSignals: true,
            viewMarketClocks: true,
            viewPortfolio: true,
            viewCompetitions: true,
            viewLeaderboards: true,
            chatMessagesPerDay: 50,
            aiAnalysis: true,
            brokerConnections: 1,
            manualTrading: true,
            semiAutoTrading: false,
            fullAutoTrading: false,
            customAlerts: true,
            strategyBuilder: false,
            strategyBacktest: false,
            strategyExport: false,
            competitionParticipation: true,
            strategySharing: false,
            strategyCloning: true,
            prioritySupport: false,
            earlyAccess: false
        },
        limits: {
            symbolsWatchlist: 50,
            savedStrategies: 3,
            competitionsActive: 3,
            alertsActive: 5,
            tradesPerDay: 10
        }
    },

    strategist: {
        id: 'strategist',
        name: 'strategist',
        displayName: 'Strategist',
        price: 24.99,
        description: 'Strategy builder with 2 broker connections',
        recommended: true,
        features: {
            viewSignals: true,
            viewMarketClocks: true,
            viewPortfolio: true,
            viewCompetitions: true,
            viewLeaderboards: true,
            chatMessagesPerDay: 100,
            aiAnalysis: true,
            brokerConnections: 2,
            manualTrading: true,
            semiAutoTrading: false,
            fullAutoTrading: false,
            customAlerts: true,
            strategyBuilder: true,
            strategyBacktest: true,
            strategyExport: false,
            competitionParticipation: true,
            strategySharing: true,
            strategyCloning: true,
            prioritySupport: false,
            earlyAccess: true
        },
        limits: {
            symbolsWatchlist: 100,
            savedStrategies: 10,
            competitionsActive: 5,
            alertsActive: 20,
            tradesPerDay: 25
        }
    },

    executor: {
        id: 'executor',
        name: 'executor',
        displayName: 'Executor',
        price: 34.99,
        description: 'Semi-automatic trading with 3 brokers',
        features: {
            viewSignals: true,
            viewMarketClocks: true,
            viewPortfolio: true,
            viewCompetitions: true,
            viewLeaderboards: true,
            chatMessagesPerDay: 200,
            aiAnalysis: true,
            brokerConnections: 3,
            manualTrading: true,
            semiAutoTrading: true,
            fullAutoTrading: false,
            customAlerts: true,
            strategyBuilder: true,
            strategyBacktest: true,
            strategyExport: true,
            competitionParticipation: true,
            strategySharing: true,
            strategyCloning: true,
            prioritySupport: true,
            earlyAccess: true
        },
        limits: {
            symbolsWatchlist: 200,
            savedStrategies: 25,
            competitionsActive: 10,
            alertsActive: 50,
            tradesPerDay: 50
        }
    },

    autonomous: {
        id: 'autonomous',
        name: 'autonomous',
        displayName: 'Autonomous',
        price: 49.99,
        description: 'Full auto-trading, unlimited brokers',
        features: {
            viewSignals: true,
            viewMarketClocks: true,
            viewPortfolio: true,
            viewCompetitions: true,
            viewLeaderboards: true,
            chatMessagesPerDay: -1, // Unlimited
            aiAnalysis: true,
            brokerConnections: -1, // Unlimited
            manualTrading: true,
            semiAutoTrading: true,
            fullAutoTrading: true,
            customAlerts: true,
            strategyBuilder: true,
            strategyBacktest: true,
            strategyExport: true,
            competitionParticipation: true,
            strategySharing: true,
            strategyCloning: true,
            prioritySupport: true,
            earlyAccess: true
        },
        limits: {
            symbolsWatchlist: -1, // Unlimited
            savedStrategies: -1,
            competitionsActive: -1,
            alertsActive: -1,
            tradesPerDay: -1
        }
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier config by name
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
    return SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
}

/**
 * Check if a tier has access to a feature
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: keyof FeatureAccess): boolean {
    const config = getTierConfig(tier);
    const value = config.features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return false;
}

/**
 * Get the limit for a tier
 */
export function getTierLimit(tier: SubscriptionTier, limit: keyof TierLimits): number {
    const config = getTierConfig(tier);
    return config.limits[limit];
}

/**
 * Check if within tier limits (-1 means unlimited)
 */
export function isWithinLimit(tier: SubscriptionTier, limit: keyof TierLimits, current: number): boolean {
    const max = getTierLimit(tier, limit);
    if (max === -1) return true; // Unlimited
    return current < max;
}

/**
 * Get all available tiers for display
 */
export function getDisplayTiers(): TierConfig[] {
    return Object.values(SUBSCRIPTION_TIERS).filter(t => t.id !== 'free');
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: keyof FeatureAccess): SubscriptionTier {
    const tierOrder: SubscriptionTier[] = ['free', 'observer', 'analyst', 'strategist', 'executor', 'autonomous'];

    for (const tier of tierOrder) {
        if (hasFeatureAccess(tier, feature)) {
            return tier;
        }
    }
    return 'autonomous';
}

/**
 * Compare tiers (returns -1 if a < b, 0 if equal, 1 if a > b)
 */
export function compareTiers(a: SubscriptionTier, b: SubscriptionTier): number {
    const tierOrder: SubscriptionTier[] = ['free', 'observer', 'analyst', 'strategist', 'executor', 'autonomous'];
    return tierOrder.indexOf(a) - tierOrder.indexOf(b);
}
