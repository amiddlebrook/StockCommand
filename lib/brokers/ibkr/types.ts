/**
 * IBKR Client Portal API Types
 * Ref: https://interactivebrokers.github.io/cpwebapi/
 */

export interface IBKROAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token?: string; // If applicable
}

export interface IBKRAccount {
    id: string; // U1234567
    accountId: string;
    accountVan: string;
    accountTitle: string;
    displayName: string;
    accountAlias: string;
    accountStatus: number;
    currency: string;
    type: string;
    tradingType: string;
    faclient: boolean;
    parent: string;
    desc: string;
}

export interface IBKRContract {
    conid: number;
    symbol: string;
    secType: string;
    exchange: string;
    currency: string;
    name: string;
}

export interface IBKROrder {
    orderId: number; // Internal
    conid: number;
    account: string; // U1234567
    orderType: string; // MKT, LMT
    side: string; // BUY, SELL
    quantity: number;
    limitPrice?: number;
    tif: string; // DAY, GTC
    status: string; // Submitted, Filled
    filledQuantity: number;
    remainingQuantity: number;
    avgFillPrice?: number;
}

export interface IBKRPosition {
    conid: number;
    contractDesc: string;
    assetClass: string;
    position: number;
    mktPrice: number;
    mktValue: number;
    currency: string;
    avgCost: number;
    unrealizedPnl: number;
    realizedPnl: number;
    account: string;
}

export interface IBKRError {
    error: string;
    code?: number;
    message?: string;
}
