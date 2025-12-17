/**
 * Broker Registry
 * 
 * Central registry for all supported broker adapters.
 * Provides discovery, instantiation, and management of brokers.
 */

import type { BrokerAdapter, BrokerInfo, AssetClass } from './types';

// Registry storage
const brokerAdapters = new Map<string, () => BrokerAdapter>();
const brokerInfo = new Map<string, BrokerInfo>();

/**
 * Register a broker adapter
 */
export function registerBroker(
    name: string,
    info: BrokerInfo,
    factory: () => BrokerAdapter
): void {
    brokerAdapters.set(name.toLowerCase(), factory);
    brokerInfo.set(name.toLowerCase(), info);
}

/**
 * Get a broker adapter instance by name
 */
export function getBroker(name: string): BrokerAdapter | null {
    const factory = brokerAdapters.get(name.toLowerCase());
    return factory ? factory() : null;
}

/**
 * Get info about a specific broker
 */
export function getBrokerInfo(name: string): BrokerInfo | null {
    return brokerInfo.get(name.toLowerCase()) || null;
}

/**
 * Get all registered broker names
 */
export function getRegisteredBrokers(): string[] {
    return Array.from(brokerAdapters.keys());
}

/**
 * Get all broker info for display
 */
export function getAllBrokerInfo(): BrokerInfo[] {
    return Array.from(brokerInfo.values());
}

/**
 * Get brokers that support a specific asset class
 */
export function getBrokersByAsset(asset: AssetClass): BrokerInfo[] {
    return Array.from(brokerInfo.values()).filter(
        info => info.supportedAssets.includes(asset)
    );
}

/**
 * Get brokers that support paper trading
 */
export function getPaperTradingBrokers(): BrokerInfo[] {
    return Array.from(brokerInfo.values()).filter(
        info => info.supportsPaperTrading
    );
}

/**
 * Check if a broker is registered
 */
export function isBrokerRegistered(name: string): boolean {
    return brokerAdapters.has(name.toLowerCase());
}

// ============================================
// BROKER INFO DEFINITIONS
// ============================================

/**
 * Static broker information for UI display
 * Adapters are registered dynamically when env vars are available
 */
export const AVAILABLE_BROKERS: BrokerInfo[] = [
    {
        name: 'alpaca',
        displayName: 'Alpaca',
        logo: '/brokers/alpaca.svg',
        description: 'Commission-free stock and crypto trading API. Perfect for developers.',
        supportedAssets: ['stocks', 'crypto'],
        supportsPaperTrading: true,
        minDeposit: 0,
        tradingFees: 'Commission-free',
        website: 'https://alpaca.markets',
        apiDocsUrl: 'https://docs.alpaca.markets'
    },
    {
        name: 'interactive_brokers',
        displayName: 'Interactive Brokers',
        logo: '/brokers/ibkr.svg',
        description: 'Professional-grade trading with access to 160+ markets worldwide.',
        supportedAssets: ['stocks', 'options', 'futures', 'forex', 'crypto'],
        supportsPaperTrading: true,
        minDeposit: 0,
        tradingFees: 'Tiered pricing from $0.0005/share',
        website: 'https://www.interactivebrokers.com',
        apiDocsUrl: 'https://interactivebrokers.github.io/tws-api/'
    },
    {
        name: 'tradier',
        displayName: 'Tradier',
        logo: '/brokers/tradier.svg',
        description: 'API-first brokerage focused on options trading.',
        supportedAssets: ['stocks', 'options'],
        supportsPaperTrading: true,
        minDeposit: 0,
        tradingFees: '$0.35/options contract, stocks free',
        website: 'https://tradier.com',
        apiDocsUrl: 'https://developer.tradier.com'
    },
    {
        name: 'tradestation',
        displayName: 'TradeStation',
        logo: '/brokers/tradestation.svg',
        description: 'Award-winning platforms for active traders.',
        supportedAssets: ['stocks', 'options', 'futures', 'crypto'],
        supportsPaperTrading: true,
        minDeposit: 0,
        tradingFees: '$0 stocks, $0.60/options contract',
        website: 'https://www.tradestation.com',
        apiDocsUrl: 'https://tradestation.github.io/api-docs/'
    }
];

// Pre-populate broker info (adapters registered when initialized with env)
AVAILABLE_BROKERS.forEach(info => {
    brokerInfo.set(info.name, info);
});
