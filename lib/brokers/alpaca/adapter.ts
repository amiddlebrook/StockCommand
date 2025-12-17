/**
 * Alpaca Broker Adapter
 * 
 * Implementation of BrokerAdapter for Alpaca Markets.
 * Supports both paper and live trading.
 * 
 * API Docs: https://docs.alpaca.markets
 */

import { BaseBrokerAdapter } from '../adapter';
import type {
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
} from '../types';

// Alpaca API Response Types
interface AlpacaAccount {
    id: string;
    account_number: string;
    status: string;
    currency: string;
    cash: string;
    portfolio_value: string;
    buying_power: string;
    equity: string;
    daytrading_buying_power: string;
    pattern_day_trader: boolean;
    daytrade_count: number;
    created_at: string;
}

interface AlpacaPosition {
    asset_id: string;
    symbol: string;
    exchange: string;
    asset_class: string;
    qty: string;
    side: string;
    avg_entry_price: string;
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    current_price: string;
}

interface AlpacaOrder {
    id: string;
    client_order_id: string;
    symbol: string;
    side: string;
    type: string;
    status: string;
    qty: string;
    filled_qty: string;
    filled_avg_price: string | null;
    limit_price: string | null;
    stop_price: string | null;
    time_in_force: string;
    created_at: string;
    updated_at: string;
    filled_at: string | null;
    canceled_at: string | null;
    asset_class: string;
}

interface AlpacaQuote {
    symbol: string;
    bid_price: number;
    bid_size: number;
    ask_price: number;
    ask_size: number;
    last_trade_price: number;
    last_trade_size: number;
    volume: number;
    timestamp: string;
}

interface AlpacaBar {
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
    n: number;
}

export class AlpacaAdapter extends BaseBrokerAdapter {
    readonly name = 'alpaca';
    readonly displayName = 'Alpaca';
    readonly logo = '/brokers/alpaca.svg';
    readonly supportedAssets: AssetClass[] = ['stocks', 'crypto'];
    readonly supportsPaperTrading = true;
    readonly supportsExtendedHours = true;

    protected baseUrl: string;
    protected paperBaseUrl = 'https://paper-api.alpaca.markets';
    protected liveBaseUrl = 'https://api.alpaca.markets';
    protected dataBaseUrl = 'https://data.alpaca.markets';

    // OAuth config
    protected clientId: string;
    protected clientSecret: string;
    protected redirectUri: string;
    protected authUrl = 'https://app.alpaca.markets/oauth/authorize';
    protected tokenUrl = 'https://api.alpaca.markets/oauth/token';
    protected scopes = ['account:write', 'trading', 'data'];

    private isPaper: boolean;

    constructor(env: {
        ALPACA_CLIENT_ID?: string;
        ALPACA_CLIENT_SECRET?: string;
        ALPACA_REDIRECT_URI?: string;
        ALPACA_PAPER_MODE?: string;
    }) {
        super();
        this.clientId = env.ALPACA_CLIENT_ID || '';
        this.clientSecret = env.ALPACA_CLIENT_SECRET || '';
        this.redirectUri = env.ALPACA_REDIRECT_URI || '';
        this.isPaper = env.ALPACA_PAPER_MODE !== 'false';
        this.baseUrl = this.isPaper ? this.paperBaseUrl : this.liveBaseUrl;
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    async handleCallback(code: string, state?: string): Promise<BrokerCredentials> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri
        });

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Alpaca OAuth failed: ${error}`);
        }

        const data = await response.json() as any;
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in * 1000),
            scope: data.scope?.split(' ') || this.scopes
        };
    }

    async refreshCredentials(credentials: BrokerCredentials): Promise<BrokerCredentials> {
        if (!credentials.refreshToken) {
            throw new Error('No refresh token available');
        }

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: credentials.refreshToken,
            client_id: this.clientId,
            client_secret: this.clientSecret
        });

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error('Failed to refresh Alpaca credentials');
        }

        const data = await response.json() as any;
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || credentials.refreshToken,
            expiresAt: Date.now() + (data.expires_in * 1000),
            scope: credentials.scope
        };
    }

    // ============================================
    // ACCOUNT
    // ============================================

    async getAccount(credentials: BrokerCredentials): Promise<Account> {
        const data = await this.makeRequest<AlpacaAccount>(credentials, '/v2/account');
        return {
            id: data.id,
            brokerName: this.name,
            accountNumber: data.account_number,
            accountType: this.isPaper ? 'paper' : (data.daytrading_buying_power ? 'margin' : 'cash'),
            status: data.status === 'ACTIVE' ? 'active' : 'inactive',
            currency: data.currency,
            createdAt: new Date(data.created_at).getTime()
        };
    }

    async getBalances(credentials: BrokerCredentials): Promise<Balance> {
        const data = await this.makeRequest<AlpacaAccount>(credentials, '/v2/account');
        return {
            cash: parseFloat(data.cash),
            portfolioValue: parseFloat(data.portfolio_value),
            buyingPower: parseFloat(data.buying_power),
            equity: parseFloat(data.equity),
            dayTradeCount: data.daytrade_count,
            patternDayTrader: data.pattern_day_trader,
            currency: data.currency
        };
    }

    async getPositions(credentials: BrokerCredentials): Promise<Position[]> {
        const data = await this.makeRequest<AlpacaPosition[]>(credentials, '/v2/positions');
        return data.map(p => ({
            symbol: p.symbol,
            qty: parseFloat(p.qty),
            side: parseFloat(p.qty) > 0 ? 'long' : 'short',
            avgEntryPrice: parseFloat(p.avg_entry_price),
            currentPrice: parseFloat(p.current_price),
            marketValue: parseFloat(p.market_value),
            costBasis: parseFloat(p.cost_basis),
            unrealizedPL: parseFloat(p.unrealized_pl),
            unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
            assetClass: p.asset_class === 'crypto' ? 'crypto' : 'stocks'
        }));
    }

    // ============================================
    // ORDERS
    // ============================================

    async placeOrder(credentials: BrokerCredentials, order: OrderRequest): Promise<Order> {
        const validation = this.validateOrderRequest(order);
        if (!validation.valid) {
            throw new Error(`Invalid order: ${validation.errors.join(', ')}`);
        }

        const body: Record<string, any> = {
            symbol: order.symbol.toUpperCase(),
            qty: order.qty.toString(),
            side: order.side,
            type: order.type,
            time_in_force: order.timeInForce
        };

        if (order.limitPrice) body.limit_price = order.limitPrice.toString();
        if (order.stopPrice) body.stop_price = order.stopPrice.toString();
        if (order.extendedHours) body.extended_hours = true;
        if (order.clientOrderId) body.client_order_id = order.clientOrderId;

        const data = await this.makeRequest<AlpacaOrder>(credentials, '/v2/orders', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        return this.mapOrder(data);
    }

    async getOrder(credentials: BrokerCredentials, orderId: string): Promise<Order> {
        const data = await this.makeRequest<AlpacaOrder>(credentials, `/v2/orders/${orderId}`);
        return this.mapOrder(data);
    }

    async getOrders(credentials: BrokerCredentials, status?: OrderStatus): Promise<Order[]> {
        const params = new URLSearchParams();
        if (status) {
            // Map our status to Alpaca status
            const alpacaStatus = status === 'open' ? 'open' :
                status === 'filled' ? 'closed' : 'all';
            params.set('status', alpacaStatus);
        }

        const data = await this.makeRequest<AlpacaOrder[]>(
            credentials,
            `/v2/orders?${params.toString()}`
        );
        return data.map(o => this.mapOrder(o));
    }

    async cancelOrder(credentials: BrokerCredentials, orderId: string): Promise<void> {
        await this.makeRequest(credentials, `/v2/orders/${orderId}`, {
            method: 'DELETE'
        });
    }

    async cancelAllOrders(credentials: BrokerCredentials): Promise<void> {
        await this.makeRequest(credentials, '/v2/orders', {
            method: 'DELETE'
        });
    }

    // ============================================
    // MARKET DATA
    // ============================================

    async getQuote(credentials: BrokerCredentials, symbol: string): Promise<Quote> {
        const url = `${this.dataBaseUrl}/v2/stocks/${symbol.toUpperCase()}/quotes/latest`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to get quote for ${symbol}`);
        }

        const data = await response.json() as any;
        const quote = data.quote;

        return {
            symbol: symbol.toUpperCase(),
            bid: quote.bp || 0,
            ask: quote.ap || 0,
            bidSize: quote.bs || 0,
            askSize: quote.as || 0,
            last: quote.bp || 0, // Use bid as fallback
            lastSize: 0,
            volume: 0,
            timestamp: new Date(quote.t).getTime()
        };
    }

    async getBars(
        credentials: BrokerCredentials,
        symbol: string,
        timeframe: Timeframe,
        start?: Date,
        end?: Date
    ): Promise<Bar[]> {
        const tfMap: Record<Timeframe, string> = {
            '1m': '1Min', '5m': '5Min', '15m': '15Min', '30m': '30Min',
            '1h': '1Hour', '4h': '4Hour', '1d': '1Day', '1w': '1Week', '1M': '1Month'
        };

        const params = new URLSearchParams({ timeframe: tfMap[timeframe] });
        if (start) params.set('start', start.toISOString());
        if (end) params.set('end', end.toISOString());

        const url = `${this.dataBaseUrl}/v2/stocks/${symbol.toUpperCase()}/bars?${params.toString()}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to get bars for ${symbol}`);
        }

        const data = await response.json() as any;
        return (data.bars || []).map((b: AlpacaBar) => ({
            timestamp: new Date(b.t).getTime(),
            open: b.o,
            high: b.h,
            low: b.l,
            close: b.c,
            volume: b.v,
            vwap: b.vw,
            tradeCount: b.n
        }));
    }

    async getSnapshot(credentials: BrokerCredentials, symbol: string): Promise<Snapshot> {
        const url = `${this.dataBaseUrl}/v2/stocks/${symbol.toUpperCase()}/snapshot`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to get snapshot for ${symbol}`);
        }

        const data = await response.json() as any;
        return {
            symbol: symbol.toUpperCase(),
            latestQuote: {
                symbol: symbol.toUpperCase(),
                bid: data.latestQuote?.bp || 0,
                ask: data.latestQuote?.ap || 0,
                bidSize: data.latestQuote?.bs || 0,
                askSize: data.latestQuote?.as || 0,
                last: data.latestTrade?.p || 0,
                lastSize: data.latestTrade?.s || 0,
                volume: data.dailyBar?.v || 0,
                timestamp: Date.now()
            },
            latestTrade: data.latestTrade ? {
                price: data.latestTrade.p,
                size: data.latestTrade.s,
                timestamp: new Date(data.latestTrade.t).getTime()
            } : undefined,
            dailyBar: data.dailyBar ? {
                timestamp: new Date(data.dailyBar.t).getTime(),
                open: data.dailyBar.o,
                high: data.dailyBar.h,
                low: data.dailyBar.l,
                close: data.dailyBar.c,
                volume: data.dailyBar.v,
                vwap: data.dailyBar.vw
            } : undefined,
            prevDailyBar: data.prevDailyBar ? {
                timestamp: new Date(data.prevDailyBar.t).getTime(),
                open: data.prevDailyBar.o,
                high: data.prevDailyBar.h,
                low: data.prevDailyBar.l,
                close: data.prevDailyBar.c,
                volume: data.prevDailyBar.v,
                vwap: data.prevDailyBar.vw
            } : undefined
        };
    }

    // ============================================
    // HELPERS
    // ============================================

    private mapOrder(o: AlpacaOrder): Order {
        const statusMap: Record<string, OrderStatus> = {
            'new': 'open',
            'accepted': 'open',
            'pending_new': 'pending',
            'partially_filled': 'partially_filled',
            'filled': 'filled',
            'done_for_day': 'filled',
            'canceled': 'cancelled',
            'expired': 'expired',
            'replaced': 'cancelled',
            'rejected': 'rejected'
        };

        return {
            id: o.id,
            clientOrderId: o.client_order_id,
            symbol: o.symbol,
            side: o.side as 'buy' | 'sell',
            type: o.type as any,
            status: statusMap[o.status] || 'pending',
            qty: parseFloat(o.qty),
            filledQty: parseFloat(o.filled_qty),
            avgFillPrice: o.filled_avg_price ? parseFloat(o.filled_avg_price) : undefined,
            limitPrice: o.limit_price ? parseFloat(o.limit_price) : undefined,
            stopPrice: o.stop_price ? parseFloat(o.stop_price) : undefined,
            timeInForce: o.time_in_force as any,
            createdAt: new Date(o.created_at).getTime(),
            updatedAt: new Date(o.updated_at).getTime(),
            filledAt: o.filled_at ? new Date(o.filled_at).getTime() : undefined,
            cancelledAt: o.canceled_at ? new Date(o.canceled_at).getTime() : undefined,
            assetClass: o.asset_class === 'crypto' ? 'crypto' : 'stocks'
        };
    }

    validateSymbol(symbol: string): boolean {
        // Alpaca symbols: 1-5 uppercase letters for stocks, or crypto format
        const stockRegex = /^[A-Z]{1,5}$/;
        const cryptoRegex = /^[A-Z]{3,5}\/[A-Z]{3,4}$/; // e.g., BTC/USD
        const upper = symbol.toUpperCase();
        return stockRegex.test(upper) || cryptoRegex.test(upper);
    }
}
