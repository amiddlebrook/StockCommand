import type { Source } from '../types';

export interface StockQuoteResponse {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  timestamp: number;
}

export interface StockProfileResponse {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  ceo: string;
  employees: number;
  website: string;
  exchange: string;
}

export interface StockSnapshot {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
  volume: number;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  exchange?: string;
  timestamp: number;
  sources: Source[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchStockQuote(symbol: string): Promise<StockQuoteResponse> {
  return fetchJson<StockQuoteResponse>(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchStockProfile(symbol: string): Promise<StockProfileResponse> {
  return fetchJson<StockProfileResponse>(`/api/stock/profile?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchStockSnapshot(symbol: string): Promise<StockSnapshot> {
  const [quote, profile] = await Promise.all([
    fetchStockQuote(symbol),
    fetchStockProfile(symbol).catch(() => undefined),
  ]);

  return {
    symbol: quote.symbol,
    name: profile?.name ?? quote.symbol,
    price: quote.price,
    changePercent: quote.changePercent,
    change: quote.change,
    volume: quote.volume,
    sector: profile?.sector,
    industry: profile?.industry,
    description: profile?.description,
    website: profile?.website,
    exchange: profile?.exchange,
    timestamp: quote.timestamp,
    sources: [
      {
        web: {
          uri: 'https://www.alphavantage.co/',
          title: 'Alpha Vantage Data Feed',
        },
      },
    ],
  };
}
