import yahooFinance from 'yahoo-finance2';
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
                // Special case for manual asset, mock or skip
                results[symbol] = { price: 100, changePercent: 0, volume: 0 };
                continue;
            }

            try {
                // 1. Try Alpha Vantage
                const data = await this.fetchAlphaVantage(symbol);
                results[symbol] = data;
                // Small delay to be nice to rate limits if running sequentially
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error: any) {
                console.warn(`[MarketData] Alpha Vantage failed for ${symbol}: ${error.message}`);

                if (this.useYahooFallback) {
                    try {
                        console.log(`[MarketData] Falling back to Yahoo Finance for ${symbol}`);
                        const data = await this.fetchYahooFinance(symbol);
                        results[symbol] = data;
                    } catch (yahooError: any) {
                        console.error(`[MarketData] Yahoo Finance also failed for ${symbol}: ${yahooError.message}`);
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
        const data = await response.json();

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
        // Yahoo Finance tickers might need mapping (e.g. BTC -> BTC-USD), but usually auto-handled
        let ySymbol = symbol;
        if (symbol === 'BTC') ySymbol = 'BTC-USD';
        if (symbol === 'ETH') ySymbol = 'ETH-USD';

        const quote = await yahooFinance.quote(ySymbol) as any;

        return {
            price: quote.regularMarketPrice || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0
        };
    }
}
