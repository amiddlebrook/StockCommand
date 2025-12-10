import { MarketData } from './types';

interface AlphaVantageGlobalQuote {
    '01. symbol': string;
    '05. price': string;
    '09. change': string;
    '10. change percent': string;
    '06. volume': string;
}

export class MarketDataService {
    private alphaVantageKey: string;
    private useYahooFallback: boolean = true;

    constructor(alphaVantageKey: string) {
        this.alphaVantageKey = alphaVantageKey;
    }

    public async fetchMarketData(symbols: string[]): Promise<Record<string, MarketData>> {
        const results: Record<string, MarketData> = {};

        for (const symbol of symbols) {
            if (symbol === 'MASTERWORKS') {
                results[symbol] = { price: 100, changePercent: 0, volume: 0 };
                continue;
            }

            try {
                // 1. Try Alpha Vantage
                const data = await this.fetchAlphaVantage(symbol);
                results[symbol] = data;
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error: any) {
                console.warn(`[MarketData] Alpha Vantage failed for ${symbol}: ${error.message}`);

                if (this.useYahooFallback) {
                    try {
                        console.log(`[MarketData] Falling back to Yahoo Finance (Chart API) for ${symbol}`);
                        const data = await this.fetchYahooFinance(symbol);
                        results[symbol] = data;
                    } catch (yahooError: any) {
                        console.error(`[MarketData] Yahoo Finance also failed for ${symbol}: ${yahooError.message}`);
                        // Don't result in empty. Return mock/neutral if crucial? 
                        // For now, logging effectively allows us to debug "Fake" data claims.
                        results[symbol] = { price: 0, changePercent: 0, volume: 0, error: "Data Fetch Failed" } as any;
                    }
                }
            }
        }

        return results;
    }

    private async fetchAlphaVantage(symbol: string): Promise<MarketData> {
        if (!this.alphaVantageKey) throw new Error("No API Key");

        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data['Note'] || data['Information']) {
            throw new Error(`API Limit or Info: ${JSON.stringify(data)}`);
        }

        if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
            throw new Error("Invalid response format");
        }

        const quote: AlphaVantageGlobalQuote = data['Global Quote'];

        return {
            price: parseFloat(quote['05. price']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseFloat(quote['06. volume'])
        };
    }

    private async fetchYahooFinance(symbol: string): Promise<MarketData> {
        // Fallback using unofficial Yahoo Chart API which works well for basic current price
        // No Auth required usually
        let ySymbol = symbol;
        if (symbol === 'BTC') ySymbol = 'BTC-USD';
        if (symbol === 'ETH') ySymbol = 'ETH-USD';
        if (symbol === 'VIX') ySymbol = '^VIX';

        // https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=1d&range=1d`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Yahoo API error: ${response.status}`);
        }

        const data = await response.json() as any;
        const result = data.chart?.result?.[0];

        if (!result) throw new Error("No Yahoo data found");

        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose;
        const volume = result.indicators?.quote?.[0]?.volume?.[0] || 0;

        let changePercent = 0;
        if (price && prevClose) {
            changePercent = ((price - prevClose) / prevClose) * 100;
        }

        return {
            price: price || 0,
            changePercent: changePercent,
            volume: volume
        };
    }
}
