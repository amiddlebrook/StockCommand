/**
 * Base Broker Adapter
 * 
 * Abstract class that provides common functionality for all broker adapters.
 * Specific broker implementations extend this class.
 */

import type {
    BrokerAdapter,
    BrokerCredentials,
    AssetClass,
    Account,
    Balance,
    Position,
    OrderRequest,
    Order,
    OrderStatus,
    Quote,
    Bar,
    Snapshot,
    Timeframe
} from './types';

export abstract class BaseBrokerAdapter implements BrokerAdapter {
    abstract readonly name: string;
    abstract readonly displayName: string;
    abstract readonly logo?: string;
    abstract readonly supportedAssets: AssetClass[];
    abstract readonly supportsPaperTrading: boolean;
    abstract readonly supportsExtendedHours: boolean;

    // Base URL for API requests
    protected abstract baseUrl: string;
    protected abstract paperBaseUrl?: string;

    // OAuth configuration
    protected abstract clientId: string;
    protected abstract clientSecret: string;
    protected abstract redirectUri: string;
    protected abstract authUrl: string;
    protected abstract tokenUrl: string;
    protected abstract scopes: string[];

    // ============================================
    // AUTHENTICATION (Common patterns)
    // ============================================

    getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes.join(' '),
            ...(state && { state })
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    abstract handleCallback(code: string, state?: string): Promise<BrokerCredentials>;
    abstract refreshCredentials(credentials: BrokerCredentials): Promise<BrokerCredentials>;

    async revokeCredentials(credentials: BrokerCredentials): Promise<void> {
        // Default implementation - override if broker supports revocation
        console.log(`Revoking credentials for ${this.name}`);
    }

    // ============================================
    // ACCOUNT (Abstract - broker-specific)
    // ============================================

    abstract getAccount(credentials: BrokerCredentials): Promise<Account>;
    abstract getBalances(credentials: BrokerCredentials): Promise<Balance>;
    abstract getPositions(credentials: BrokerCredentials): Promise<Position[]>;

    // ============================================
    // ORDERS (Abstract - broker-specific)
    // ============================================

    abstract placeOrder(credentials: BrokerCredentials, order: OrderRequest): Promise<Order>;
    abstract getOrder(credentials: BrokerCredentials, orderId: string): Promise<Order>;
    abstract getOrders(credentials: BrokerCredentials, status?: OrderStatus): Promise<Order[]>;
    abstract cancelOrder(credentials: BrokerCredentials, orderId: string): Promise<void>;

    async cancelAllOrders(credentials: BrokerCredentials): Promise<void> {
        const openOrders = await this.getOrders(credentials, 'open');
        await Promise.all(openOrders.map(order => this.cancelOrder(credentials, order.id)));
    }

    // ============================================
    // MARKET DATA (Abstract - broker-specific)
    // ============================================

    abstract getQuote(credentials: BrokerCredentials, symbol: string): Promise<Quote>;

    async getQuotes(credentials: BrokerCredentials, symbols: string[]): Promise<Map<string, Quote>> {
        const quotes = new Map<string, Quote>();
        const results = await Promise.all(
            symbols.map(async symbol => {
                try {
                    const quote = await this.getQuote(credentials, symbol);
                    return { symbol, quote };
                } catch (error) {
                    console.error(`Failed to get quote for ${symbol}:`, error);
                    return null;
                }
            })
        );
        results.forEach(result => {
            if (result) quotes.set(result.symbol, result.quote);
        });
        return quotes;
    }

    abstract getBars(credentials: BrokerCredentials, symbol: string, timeframe: Timeframe, start?: Date, end?: Date): Promise<Bar[]>;
    abstract getSnapshot(credentials: BrokerCredentials, symbol: string): Promise<Snapshot>;

    // ============================================
    // VALIDATION (Common patterns)
    // ============================================

    validateSymbol(symbol: string): boolean {
        // Basic validation - override for broker-specific rules
        const symbolRegex = /^[A-Z]{1,5}$/;
        return symbolRegex.test(symbol.toUpperCase());
    }

    validateOrderRequest(order: OrderRequest): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!order.symbol || !this.validateSymbol(order.symbol)) {
            errors.push('Invalid symbol');
        }

        if (!order.qty || order.qty <= 0) {
            errors.push('Quantity must be positive');
        }

        if (order.type === 'limit' && !order.limitPrice) {
            errors.push('Limit price required for limit orders');
        }

        if ((order.type === 'stop' || order.type === 'stop_limit') && !order.stopPrice) {
            errors.push('Stop price required for stop orders');
        }

        if (order.type === 'stop_limit' && !order.limitPrice) {
            errors.push('Limit price required for stop-limit orders');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    protected async makeRequest<T>(
        credentials: BrokerCredentials,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${this.name} API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Check if credentials are expired and need refresh
     */
    protected isCredentialsExpired(credentials: BrokerCredentials): boolean {
        if (!credentials.expiresAt) return false;
        // Refresh 5 minutes before actual expiration
        return Date.now() > (credentials.expiresAt - 5 * 60 * 1000);
    }

    /**
     * Ensure credentials are valid, refresh if needed
     */
    protected async ensureValidCredentials(credentials: BrokerCredentials): Promise<BrokerCredentials> {
        if (this.isCredentialsExpired(credentials) && credentials.refreshToken) {
            return this.refreshCredentials(credentials);
        }
        return credentials;
    }
}
