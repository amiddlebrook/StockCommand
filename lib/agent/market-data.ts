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

        // https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=6mo
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=1d&range=6mo`;

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
        const volume = result.indicators?.quote?.[0]?.volume?.slice(-1)[0] || 0;

        let changePercent = 0;
        if (price && prevClose) {
            changePercent = ((price - prevClose) / prevClose) * 100;
        }

        // --- TECHNICAL ANALYSIS ---
        const closes = result.indicators?.quote?.[0]?.close || [];
        // Filter out nulls
        const validCloses: number[] = closes.filter((c: any) => c !== null);

        let rsi = undefined;
        let macd = undefined;

        if (validCloses.length > 50) {
            rsi = calculateRSI(validCloses, 14);
            macd = calculateMACD(validCloses, 12, 26, 9);
        }

        return {
            price: price || validCloses[validCloses.length - 1] || 0,
            changePercent: changePercent,
            volume: volume,
            rsi,
            macd,
            dailyClose: validCloses.slice(-50), // Send last 50 for LLM pattern matching if needed
            technicalSignal: rsi && rsi > 70 ? 'Overbought' : rsi && rsi < 30 ? 'Oversold' : 'Neutral'
        };
    }
}

// --- TA HELPERS ---

function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // First period
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothing
    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateMACD(closes: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number, signal: number, histogram: number } {
    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);

    const macdLine: number[] = [];
    // Alignment is tricky, simplistic approach:
    // We only care about the LATEST values really.
    // Calculate MACD line for the valid overlap
    const maxLength = Math.min(emaFast.length, emaSlow.length);
    // Align end
    const fastOffset = emaFast.length - maxLength;
    const slowOffset = emaSlow.length - maxLength;

    for (let i = 0; i < maxLength; i++) {
        macdLine.push(emaFast[i + fastOffset] - emaSlow[i + slowOffset]);
    }

    const signalLine = calculateEMA(macdLine, signal);

    // Get latest
    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];

    return {
        macd: currentMACD,
        signal: currentSignal,
        histogram: currentMACD - currentSignal
    };
}

function calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const emaArray = [data[0]];
    for (let i = 1; i < data.length; i++) {
        emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray;
}
