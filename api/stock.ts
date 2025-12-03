/**
 * Stock Market Data API Service
 * 
 * This module provides real-time stock data fetching with Cloudflare integration
 * Features: KV caching, D1 persistence, rate limiting, multiple providers
 */

import type { Env } from '../types';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  timestamp: number;
}

export interface IntradayData {
  symbol: string;
  interval: string;
  data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export interface CompanyProfile {
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

export class StockAPIError extends Error {
  constructor(message: string, public status = 500, public code?: string) {
    super(message);
    this.name = 'StockAPIError';
  }
}

class StockAPIService {
  constructor(private env: Env) {}

  /**
   * Get real-time stock quote with caching
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `quote:${symbol.toUpperCase()}`;
    const cacheTTL = parseInt(this.env.CACHE_TTL) || 3600;

    // Try to get from KV cache first
    const cached = await this.env.STOCK_CACHE_KV.get(cacheKey, 'json');
    if (cached) {
      return cached as StockQuote;
    }

    // Fetch from API
    const quote = await this.fetchQuoteFromAPI(symbol);
    
    // Cache the result
    await this.env.STOCK_CACHE_KV.put(
      cacheKey,
      JSON.stringify(quote),
      { expirationTtl: cacheTTL }
    );

    // Log to analytics
    await this.logAnalytics('quote_request', { symbol });

    return quote;
  }

  /**
   * Get intraday data with caching
   */
  async getIntradayData(symbol: string, interval: string = '1min'): Promise<IntradayData> {
    const cacheKey = `intraday:${symbol.toUpperCase()}:${interval}`;
    const cacheTTL = parseInt(this.env.CACHE_TTL) || 300; // 5 minutes for intraday

    // Try cache first
    const cached = await this.env.STOCK_CACHE_KV.get(cacheKey, 'json');
    if (cached) {
      return cached as IntradayData;
    }

    // Fetch from API
    const data = await this.fetchIntradayFromAPI(symbol, interval);
    
    // Cache the result
    await this.env.STOCK_CACHE_KV.put(
      cacheKey,
      JSON.stringify(data),
      { expirationTtl: cacheTTL }
    );

    await this.logAnalytics('intraday_request', { symbol, interval });

    return data;
  }

  /**
   * Get company profile with caching
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const cacheKey = `profile:${symbol.toUpperCase()}`;
    const cacheTTL = parseInt(this.env.CACHE_TTL) || 86400; // 24 hours for profiles

    // Try cache first
    const cached = await this.env.STOCK_CACHE_KV.get(cacheKey, 'json');
    if (cached) {
      return cached as CompanyProfile;
    }

    // Fetch from API
    const profile = await this.fetchProfileFromAPI(symbol);
    
    // Cache the result
    await this.env.STOCK_CACHE_KV.put(
      cacheKey,
      JSON.stringify(profile),
      { expirationTtl: cacheTTL }
    );

    await this.logAnalytics('profile_request', { symbol });

    return profile;
  }

  /**
   * Search for stock symbols
   */
  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string }>> {
    const cacheKey = `search:${query.toLowerCase()}`;
    const cacheTTL = 3600; // 1 hour

    // Try cache first
    const cached = await this.env.STOCK_CACHE_KV.get(cacheKey, 'json');
    if (cached) {
      return cached as Array<{ symbol: string; name: string }>;
    }

    // Fetch from API
    const results = await this.searchSymbolsFromAPI(query);
    
    // Cache the result
    await this.env.STOCK_CACHE_KV.put(
      cacheKey,
      JSON.stringify(results),
      { expirationTtl: cacheTTL }
    );

    await this.logAnalytics('search_request', { query });

    return results;
  }

  /**
   * Validate stock symbol
   */
  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      await this.getQuote(symbol);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save user's watchlist to D1
   */
  async saveWatchlist(userId: string, symbols: string[]): Promise<void> {
    const stmt = this.env.DB.prepare(`
      INSERT OR REPLACE INTO user_watchlists (user_id, symbols, updated_at)
      VALUES (?, ?, ?)
    `);
    
    await stmt.bind(userId, JSON.stringify(symbols), Date.now()).run();
    
    await this.logAnalytics('watchlist_save', { userId, symbolCount: symbols.length });
  }

  /**
   * Get user's watchlist from D1
   */
  async getWatchlist(userId: string): Promise<string[]> {
    const result = await this.env.DB.prepare(`
      SELECT symbols FROM user_watchlists WHERE user_id = ?
    `).bind(userId).first();

    if (result?.symbols) {
      return JSON.parse(result.symbols as string);
    }
    return [];
  }

  /**
   * Queue background stock data refresh
   */
  async queueRefresh(symbols: string[]): Promise<void> {
    const message = {
      type: 'refresh',
      symbols,
      timestamp: Date.now()
    };

    await this.env.STOCK_DATA_QUEUE.send(message);
  }

  /**
   * Upload file to R2 storage
   */
  async uploadFile(key: string, file: ArrayBuffer, contentType: string): Promise<string> {
    const object = await this.env.STORAGE.put(key, file, {
      httpMetadata: { contentType }
    });

    return object.key;
  }

  /**
   * Get file from R2 storage
   */
  async getFile(key: string): Promise<Response | null> {
    const object = await this.env.STORAGE.get(key);
    
    if (object) {
      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Content-Length': object.size.toString()
        }
      });
    }
    
    return null;
  }

  // Private methods for API calls

  private async fetchQuoteFromAPI(symbol: string): Promise<StockQuote> {
    const provider = this.env.DEFAULT_STOCK_PROVIDER || 'alphavantage';
    
    switch (provider) {
      case 'alphavantage':
        return this.fetchAlphaVantageQuote(symbol);
      case 'finnhub':
        return this.fetchFinnhubQuote(symbol);
      case 'iexcloud':
        return this.fetchIEXCloudQuote(symbol);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async fetchAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    if (!this.env.ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    this.assertAlphaVantageResponseIsHealthy(data);

    const quote = data['Global Quote'];
    if (quote?.['01. symbol']) {
      const symbolValue = quote['01. symbol'] || symbol.toUpperCase();
      const price = parseFloat(quote['05. price'] ?? '0') || 0;
      const change = parseFloat(quote['09. change'] ?? '0') || 0;
      const changePercentRaw = quote['10. change percent'];
      const changePercent =
        typeof changePercentRaw === 'string'
          ? parseFloat(changePercentRaw.replace('%', '')) || 0
          : 0;
      const volume = parseInt(quote['06. volume'] ?? '0', 10) || 0;

      return {
        symbol: symbolValue,
        name: symbol,
        price,
        change,
        changePercent,
        volume,
        marketCap: 0, // Alpha Vantage doesn't provide this in global quote
        timestamp: Date.now()
      };
    }

    throw new StockAPIError(`Alpha Vantage returned no quote data for ${symbol.toUpperCase()}.`, 404, 'ALPHA_VANTAGE_NO_QUOTE');
  }

  private async fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
    if (!this.env.FINNHUB_API_KEY) {
      throw new Error('Finnhub API key not configured');
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.env.FINNHUB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.c) {
      return {
        symbol,
        name: symbol,
        price: data.c,
        change: data.d,
        changePercent: (data.d / (data.c - data.d)) * 100,
        volume: 0, // Not provided in quote endpoint
        marketCap: 0,
        timestamp: Date.now()
      };
    }

    throw new Error('Invalid symbol or API error');
  }

  private async fetchIEXCloudQuote(symbol: string): Promise<StockQuote> {
    // Implementation for IEX Cloud
    throw new Error('IEX Cloud not implemented yet');
  }

  private async fetchIntradayFromAPI(symbol: string, interval: string): Promise<IntradayData> {
    const provider = this.env.DEFAULT_STOCK_PROVIDER || 'alphavantage';
    
    switch (provider) {
      case 'alphavantage':
        return this.fetchAlphaVantageIntraday(symbol, interval);
      default:
        throw new Error(`Intraday data not implemented for provider: ${provider}`);
    }
  }

  private async fetchAlphaVantageIntraday(symbol: string, interval: string): Promise<IntradayData> {
    if (!this.env.ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const intervalMap: { [key: string]: string } = {
      '1min': '1min',
      '5min': '5min',
      '15min': '15min',
      '30min': '30min',
      '60min': '60min'
    };

    const apiInterval = intervalMap[interval] || '1min';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${apiInterval}&apikey=${this.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    this.assertAlphaVantageResponseIsHealthy(data);

    const timeSeriesKey = `Time Series (${apiInterval})`;
    const timeSeries = data[timeSeriesKey];

    if (!timeSeries) {
      throw new StockAPIError(`Alpha Vantage returned no intraday data for ${symbol.toUpperCase()}.`, 404, 'ALPHA_VANTAGE_NO_INTRADAY');
    }

    const dataPoints = Object.entries(timeSeries)
      .map(([timestamp, values]: [string, any]) => ({
        timestamp: new Date(timestamp).getTime(),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }))
      .reverse(); // Reverse to get chronological order

    return {
      symbol: symbol.toUpperCase(),
      interval: apiInterval,
      data: dataPoints
    };
  }

  private async fetchAlphaVantageProfile(symbol: string): Promise<CompanyProfile> {
    if (!this.env.ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    this.assertAlphaVantageResponseIsHealthy(data);

    return {
      symbol: data.Symbol,
      name: data.Name || symbol,
      description: data.Description || '',
      sector: data.Sector || '',
      industry: data.Industry || '',
      ceo: data.CEO || '',
      employees: parseInt(data.EmployeesOverall || '0'),
      website: data.Website || '',
      exchange: data.Exchange || ''
    };
  }

  private async searchSymbolsFromAPI(query: string): Promise<Array<{ symbol: string; name: string }>> {
    const provider = this.env.DEFAULT_STOCK_PROVIDER || 'alphavantage';
    
    switch (provider) {
      case 'alphavantage':
        return this.fetchAlphaVantageSearch(query);
      default:
        throw new Error(`Search not implemented for provider: ${provider}`);
    }
  }

  private async fetchAlphaVantageSearch(query: string): Promise<Array<{ symbol: string; name: string }>> {
    if (!this.env.ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    this.assertAlphaVantageResponseIsHealthy(data);

    const matches = Array.isArray(data.bestMatches) ? data.bestMatches : [];

    return matches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name']
    }));
  }

  private assertAlphaVantageResponseIsHealthy(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new StockAPIError('Invalid response from Alpha Vantage.', 502, 'ALPHA_VANTAGE_INVALID_RESPONSE');
    }

    if (typeof data['Error Message'] === 'string' && data['Error Message'].length > 0) {
      throw new StockAPIError(data['Error Message'], 400, 'ALPHA_VANTAGE_ERROR');
    }

    if (typeof data.Note === 'string' && data.Note.length > 0) {
      throw new StockAPIError(data.Note, 429, 'ALPHA_VANTAGE_RATE_LIMIT');
    }

    if (typeof data.Information === 'string' && data.Information.length > 0) {
      throw new StockAPIError(data.Information, 503, 'ALPHA_VANTAGE_INFORMATION');
    }
  }

  private async logAnalytics(event: string, data: Record<string, any>): Promise<void> {
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: [event],
        doubles: [Date.now()],
        indexes: [data.symbol || 'unknown']
      });
    } catch (error) {
      console.error('Failed to log analytics:', error);
    }
  }
}

export function createStockAPI(env: Env): StockAPIService {
  return new StockAPIService(env);
}
