/**
 * Universal Broker Interface Types
 * 
 * All broker adapters must implement BrokerAdapter interface.
 * This allows StockCommand to be brokerage-agnostic.
 */

// ============================================
// CORE TYPES
// ============================================

export type AssetClass = 'stocks' | 'options' | 'crypto' | 'futures' | 'forex';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type OrderStatus = 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok' | 'opg' | 'cls';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

// ============================================
// CREDENTIALS & AUTH
// ============================================

export interface BrokerCredentials {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    scope?: string[];
    accountId?: string;
}

export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string[];
}

// ============================================
// ACCOUNT & PORTFOLIO
// ============================================

export interface Account {
    id: string;
    brokerName: string;
    accountNumber?: string;
    accountType: 'cash' | 'margin' | 'paper';
    status: 'active' | 'inactive' | 'restricted';
    currency: string;
    createdAt?: number;
}

export interface Balance {
    cash: number;
    portfolioValue: number;
    buyingPower: number;
    equity: number;
    dayTradeCount?: number;
    patternDayTrader?: boolean;
    currency: string;
}

export interface Position {
    symbol: string;
    qty: number;
    side: 'long' | 'short';
    avgEntryPrice: number;
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    assetClass: AssetClass;
}

// ============================================
// ORDERS & EXECUTION
// ============================================

export interface OrderRequest {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    qty: number;
    limitPrice?: number;
    stopPrice?: number;
    trailPercent?: number;
    trailPrice?: number;
    timeInForce: TimeInForce;
    extendedHours?: boolean;
    clientOrderId?: string;
}

export interface Order {
    id: string;
    clientOrderId?: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    status: OrderStatus;
    qty: number;
    filledQty: number;
    avgFillPrice?: number;
    limitPrice?: number;
    stopPrice?: number;
    timeInForce: TimeInForce;
    createdAt: number;
    updatedAt: number;
    filledAt?: number;
    cancelledAt?: number;
    assetClass: AssetClass;
}

// ============================================
// MARKET DATA
// ============================================

export interface Quote {
    symbol: string;
    bid: number;
    ask: number;
    bidSize: number;
    askSize: number;
    last: number;
    lastSize: number;
    volume: number;
    timestamp: number;
}

export interface Bar {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap?: number;
    tradeCount?: number;
}

export interface Snapshot {
    symbol: string;
    latestQuote: Quote;
    latestTrade?: {
        price: number;
        size: number;
        timestamp: number;
    };
    dailyBar?: Bar;
    prevDailyBar?: Bar;
}

// ============================================
// TRADING SIGNALS (StockCommand specific)
// ============================================

export interface TradingSignal {
    id: string;
    symbol: string;
    signalType: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
    confidence: number; // 0.0 to 1.0
    targetPrice?: number;
    stopLoss?: number;
    reasoning: string;
    source: 'AI' | 'CROWD_WISDOM' | 'MARKET_CLOCK' | 'USER_STRATEGY';
    createdAt: number;
    expiresAt: number;
}

// ============================================
// BROKER ADAPTER INTERFACE
// ============================================

export interface BrokerAdapter {
    // Broker identity
    readonly name: string;
    readonly displayName: string;
    readonly logo?: string;
    readonly supportedAssets: AssetClass[];
    readonly supportsPaperTrading: boolean;
    readonly supportsExtendedHours: boolean;

    // Authentication
    getAuthUrl(state?: string): string;
    handleCallback(code: string, state?: string): Promise<BrokerCredentials>;
    refreshCredentials(credentials: BrokerCredentials): Promise<BrokerCredentials>;
    revokeCredentials(credentials: BrokerCredentials): Promise<void>;

    // Account
    getAccount(credentials: BrokerCredentials): Promise<Account>;
    getBalances(credentials: BrokerCredentials): Promise<Balance>;
    getPositions(credentials: BrokerCredentials): Promise<Position[]>;

    // Orders
    placeOrder(credentials: BrokerCredentials, order: OrderRequest): Promise<Order>;
    getOrder(credentials: BrokerCredentials, orderId: string): Promise<Order>;
    getOrders(credentials: BrokerCredentials, status?: OrderStatus): Promise<Order[]>;
    cancelOrder(credentials: BrokerCredentials, orderId: string): Promise<void>;
    cancelAllOrders(credentials: BrokerCredentials): Promise<void>;

    // Market Data
    getQuote(credentials: BrokerCredentials, symbol: string): Promise<Quote>;
    getQuotes(credentials: BrokerCredentials, symbols: string[]): Promise<Map<string, Quote>>;
    getBars(credentials: BrokerCredentials, symbol: string, timeframe: Timeframe, start?: Date, end?: Date): Promise<Bar[]>;
    getSnapshot(credentials: BrokerCredentials, symbol: string): Promise<Snapshot>;

    // Validation
    validateSymbol(symbol: string): boolean;
    validateOrderRequest(order: OrderRequest): { valid: boolean; errors: string[] };
}

// ============================================
// BROKER REGISTRY TYPES
// ============================================

export interface BrokerInfo {
    name: string;
    displayName: string;
    logo?: string;
    description: string;
    supportedAssets: AssetClass[];
    supportsPaperTrading: boolean;
    minDeposit?: number;
    tradingFees?: string;
    website: string;
    apiDocsUrl?: string;
}

export interface BrokerConnection {
    id: string;
    userId: string;
    brokerName: string;
    credentials: BrokerCredentials; // Encrypted when stored
    isActive: boolean;
    isPaper: boolean;
    connectedAt: number;
    lastSyncAt?: number;
}

// ============================================
// DISTRIBUTION & MARKETPLACE TYPES
// ============================================

/**
 * For distribution across broker marketplaces, app stores, etc.
 */
export interface IntegrationListing {
    brokerName: string;
    marketplaceUrl?: string;
    partnerProgramUrl?: string;
    status: 'planned' | 'in_development' | 'pending_review' | 'live';
    priority: 'high' | 'medium' | 'low';
    notes?: string;
}

/**
 * Track distribution channels for growth optimization
 */
export const DISTRIBUTION_CHANNELS: IntegrationListing[] = [
    // Priority 1: Developer-friendly APIs with marketplaces
    {
        brokerName: 'alpaca',
        marketplaceUrl: 'https://alpaca.markets/learn/alpaca-marketplace/',
        partnerProgramUrl: 'https://alpaca.markets/broker-api/',
        status: 'in_development',
        priority: 'high',
        notes: 'Primary MVP broker - API-first, free, has app marketplace'
    },

    // Priority 2: Large user bases
    {
        brokerName: 'interactive_brokers',
        marketplaceUrl: 'https://www.interactivebrokers.com/en/software/overview.php',
        partnerProgramUrl: 'https://www.interactivebrokers.com/en/trading/api-solutions.php',
        status: 'planned',
        priority: 'high',
        notes: 'Gold standard, massive user base, IBKR Investors Marketplace'
    },

    // Priority 3: Options-focused
    {
        brokerName: 'tradier',
        partnerProgramUrl: 'https://developer.tradier.com/',
        status: 'planned',
        priority: 'medium',
        notes: 'Options-focused, integrated with 100+ platforms'
    },

    // Future opportunities
    {
        brokerName: 'tradestation',
        marketplaceUrl: 'https://www.tradestation.com/platforms-and-tools/',
        status: 'planned',
        priority: 'medium',
        notes: 'Active trader community'
    },
    {
        brokerName: 'webull',
        status: 'planned',
        priority: 'low',
        notes: 'Large retail user base, limited API'
    }
];
