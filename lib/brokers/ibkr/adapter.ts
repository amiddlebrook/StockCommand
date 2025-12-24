import { BaseBrokerAdapter } from '../adapter';
import {
    BrokerAdapter,
    BrokerCredentials,
    Account,
    Balance,
    Position,
    Order,
    OrderRequest,
    OrderStatus,
    Quote,
    Bar,
    Snapshot,
    Timeframe,
    AssetClass
} from '../types';
import { IBKROAuthResponse, IBKRError, IBKRAccount, IBKRPosition } from './types';

// Constants
const IBKR_API_BASE = 'https://api.ibkr.com/v1/api';
const IBKR_OAUTH_AUTH_URL = 'https://www.interactivebrokers.com/sso/Login';
const IBKR_OAUTH_TOKEN_URL = 'https://api.ibkr.com/v1/api/oauth/access_token';

interface IBKRConfig {
    IBKR_CLIENT_ID?: string;
    IBKR_CLIENT_SECRET?: string;
    IBKR_REDIRECT_URI?: string;
}

export class IBKRAdapter extends BaseBrokerAdapter {
    private config: IBKRConfig;
    public readonly name = 'interactive_brokers';
    public readonly displayName = 'Interactive Brokers';
    public readonly logo = '/brokers/ibkr.svg';
    public readonly supportedAssets: AssetClass[] = ['stocks', 'options', 'futures', 'forex', 'crypto'];
    public readonly supportsPaperTrading = true;
    public readonly supportsExtendedHours = true;

    constructor(config: IBKRConfig) {
        super();
        this.config = config;
        this.clientId = config.IBKR_CLIENT_ID || '';
        this.clientSecret = config.IBKR_CLIENT_SECRET || '';
        this.redirectUri = config.IBKR_REDIRECT_URI || '';
    }

    protected baseUrl = 'https://api.ibkr.com/v1/api';
    protected paperBaseUrl = 'https://api.ibkr.com/v1/api';
    protected clientId: string;
    protected clientSecret: string;
    protected redirectUri: string;
    protected authUrl = 'https://www.interactivebrokers.com/sso/Login';
    protected tokenUrl = 'https://api.ibkr.com/v1/api/oauth/access_token';
    protected scopes = ['read_orders', 'read_account'];

    // --- Authentication ---

    getAuthUrl(state?: string): string {
        if (!this.config.IBKR_CLIENT_ID || !this.config.IBKR_REDIRECT_URI) {
            throw new Error('IBKR configuration missing');
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.IBKR_CLIENT_ID,
            redirect_uri: this.config.IBKR_REDIRECT_URI,
            state: state || '',
            scope: 'read_orders read_account'
        });

        return `${IBKR_OAUTH_AUTH_URL}?${params.toString()}`;
    }

    async handleCallback(code: string, state?: string): Promise<BrokerCredentials> {
        if (!this.config.IBKR_CLIENT_ID || !this.config.IBKR_CLIENT_SECRET || !this.config.IBKR_REDIRECT_URI) {
            throw new Error('IBKR configuration missing');
        }

        const authHeader = btoa(`${this.config.IBKR_CLIENT_ID}:${this.config.IBKR_CLIENT_SECRET}`);

        const response = await fetch(IBKR_OAUTH_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authHeader}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.config.IBKR_REDIRECT_URI
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IBKR OAuth failed: ${response.status} ${errorText}`);
        }

        const data: IBKROAuthResponse = await response.json();

        return {
            accessToken: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000),
            refreshToken: data.refresh_token, // IBKR might not provide refresh tokens easily
            scope: data.scope.split(' '),
        };
    }

    async refreshCredentials(credentials: BrokerCredentials): Promise<BrokerCredentials> {
        // IBKR re-auth might need re-login or use refresh token if available
        // Placeholder
        return credentials;
    }

    async revokeCredentials(credentials: BrokerCredentials): Promise<void> {
        // Placeholder
    }

    // --- Helper ---

    private async request<T>(credentials: BrokerCredentials, endpoint: string, options: RequestInit = {}): Promise<T> {
        if (!credentials.accessToken) {
            throw new Error('Not authenticated with IBKR');
        }

        const url = `${IBKR_API_BASE}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IBKR API Error: ${response.status} ${errorText}`);
        }

        return response.json() as Promise<T>;
    }

    // --- Account ---

    async getAccount(credentials: BrokerCredentials): Promise<Account> {
        const accounts = await this.request<IBKRAccount[]>(credentials, '/iserver/accounts');
        if (!accounts || accounts.length === 0) throw new Error('No IBKR accounts found');
        const main = accounts[0];

        return {
            id: main.accountId,
            brokerName: this.name,
            accountNumber: main.accountId,
            accountType: 'margin', // Simplified
            status: 'active',
            currency: main.currency
        };
    }

    async getBalances(credentials: BrokerCredentials): Promise<Balance> {
        // Mocking for scaffold
        return {
            cash: 0,
            portfolioValue: 0,
            buyingPower: 0,
            equity: 0,
            currency: 'USD'
        };
    }

    async getPositions(credentials: BrokerCredentials): Promise<Position[]> {
        const accounts = await this.request<IBKRAccount[]>(credentials, '/iserver/accounts');
        const accountId = accounts[0].accountId;
        const positions = await this.request<IBKRPosition[]>(credentials, `/portfolio/${accountId}/positions`);

        return positions.map(p => ({
            symbol: p.contractDesc,
            qty: p.position,
            side: p.position > 0 ? 'long' : 'short',
            avgEntryPrice: p.avgCost,
            currentPrice: p.mktPrice,
            marketValue: p.mktValue,
            costBasis: p.avgCost * p.position,
            unrealizedPL: p.unrealizedPnl,
            unrealizedPLPercent: (p.unrealizedPnl / (p.avgCost * p.position)) * 100,
            assetClass: 'stocks' // Infer?
        }));
    }

    // --- Orders (Scaffold) ---

    async placeOrder(credentials: BrokerCredentials, order: OrderRequest): Promise<Order> {
        throw new Error("Not implemented");
    }

    async getOrder(credentials: BrokerCredentials, orderId: string): Promise<Order> {
        throw new Error("Not implemented");
    }

    async getOrders(credentials: BrokerCredentials, status?: OrderStatus): Promise<Order[]> {
        return [];
    }

    async cancelOrder(credentials: BrokerCredentials, orderId: string): Promise<void> {
        throw new Error("Not implemented");
    }

    async cancelAllOrders(credentials: BrokerCredentials): Promise<void> {
        throw new Error("Not implemented");
    }

    // --- Market Data (Scaffold) ---

    async getQuote(credentials: BrokerCredentials, symbol: string): Promise<Quote> {
        throw new Error("Not implemented");
    }

    async getQuotes(credentials: BrokerCredentials, symbols: string[]): Promise<Map<string, Quote>> {
        throw new Error("Not implemented");
    }

    async getBars(credentials: BrokerCredentials, symbol: string, timeframe: Timeframe, start?: Date, end?: Date): Promise<Bar[]> {
        throw new Error("Not implemented");
    }

    async getSnapshot(credentials: BrokerCredentials, symbol: string): Promise<Snapshot> {
        throw new Error("Not implemented");
    }

    validateSymbol(symbol: string): boolean {
        return /^[A-Z]{1,5}$/.test(symbol);
    }

    validateOrderRequest(order: OrderRequest): { valid: boolean; errors: string[] } {
        return { valid: true, errors: [] };
    }
}
