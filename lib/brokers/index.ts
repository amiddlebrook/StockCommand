/**
 * Broker Integration Module
 * 
 * Central export point for all broker-related functionality.
 */

// Types
export * from './types';

// Base adapter
export { BaseBrokerAdapter } from './adapter';

// Registry
export {
    registerBroker,
    getBroker,
    getBrokerInfo,
    getRegisteredBrokers,
    getAllBrokerInfo,
    getBrokersByAsset,
    getPaperTradingBrokers,
    isBrokerRegistered,
    AVAILABLE_BROKERS
} from './registry';

// Alpaca Adapter
export { AlpacaAdapter } from './alpaca/adapter';

// ============================================
// INITIALIZATION
// ============================================

import { registerBroker } from './registry';
import { AlpacaAdapter } from './alpaca/adapter';
import { AVAILABLE_BROKERS } from './registry';

/**
 * Initialize brokers with environment variables
 * Call this from worker.ts with the env object
 */
export function initializeBrokers(env: Record<string, string | undefined>): void {
    // Register Alpaca
    const alpacaInfo = AVAILABLE_BROKERS.find(b => b.name === 'alpaca');
    if (alpacaInfo && env.ALPACA_CLIENT_ID) {
        registerBroker('alpaca', alpacaInfo, () => new AlpacaAdapter({
            ALPACA_CLIENT_ID: env.ALPACA_CLIENT_ID,
            ALPACA_CLIENT_SECRET: env.ALPACA_CLIENT_SECRET,
            ALPACA_REDIRECT_URI: env.ALPACA_REDIRECT_URI,
            ALPACA_PAPER_MODE: env.ALPACA_PAPER_MODE
        }));
    }

    // Future: Register other brokers
    // if (env.IBKR_CLIENT_ID) { ... }
    // if (env.TRADIER_ACCESS_TOKEN) { ... }
}
