import { MarketData } from './types';

// Updated Cache Entry Interface
interface AgentCacheEntry {
    data: MarketData;
    timestamp: number;
    timeline: string;
}

// Global Cache Storage (In-Memory for Worker Runtime)
const CACHE: Record<string, AgentCacheEntry> = {};

// TTL definitions in milliseconds
const TIMELINE_TTLS: Record<string, number> = {
    '1m': 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000,
    '3M': 90 * 24 * 60 * 60 * 1000,
    '1Y': 365 * 24 * 60 * 60 * 1000, // 1 Year
    '5Y': 1825 * 24 * 60 * 60 * 1000 // 5 Years
};

export class SwarmDataService {
    private apiKey: string;

    // Model Config
    private models = {
        price: "nex-agi/deepseek-v3.1-nex-n1:free", // Fast for logic
        news: "nex-agi/deepseek-v3.1-nex-n1:free",  // Good for summary
        tech: "nex-agi/deepseek-v3.1-nex-n1:free"   // Good for analysis
    };

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /* 
     * MAIN ENTRY POINT
     * Retrieves data for multiple symbols, using parallel agents + caching
     */
    public async querySwarm(symbols: string[], timeline: string = '1d'): Promise<Record<string, MarketData>> {
        const results: Record<string, MarketData> = {};
        const symbolsToFetch: string[] = [];

        // 1. Check Cache
        const now = Date.now();
        const ttl = TIMELINE_TTLS[timeline] || TIMELINE_TTLS['1d'];

        for (const sym of symbols) {
            const cacheKey = `${sym}:${timeline}`;
            const cached = CACHE[cacheKey];

            if (cached && (now - cached.timestamp < ttl)) {
                console.log(`[Swarm] Cache HIT for ${sym} (${timeline})`);
                results[sym] = cached.data;
            } else {
                if (cached) console.log(`[Swarm] Cache STALE for ${sym} (Age: ${(now - cached.timestamp) / 1000}s > TTL: ${ttl / 1000}s)`);
                symbolsToFetch.push(sym);
            }
        }

        if (symbolsToFetch.length === 0) return results;

        console.log(`[Swarm] Deploying agents for: ${symbolsToFetch.join(', ')} on ${timeline} timeline...`);

        // 2. Launch Parallel Agents for EACH symbol (or batched)
        // For quality, we'll do per-symbol parallelism to avoid context limits, unless list is huge.
        // Given typically < 50 symbols, we can batch them or do parallel promises.
        // Let's do batches of 5 to respect rate limits slightly.

        const BATCH_SIZE = 5;
        for (let i = 0; i < symbolsToFetch.length; i += BATCH_SIZE) {
            const batch = symbolsToFetch.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(sym => this.fetchSymbolData(sym, timeline));

            const batchResults = await Promise.all(batchPromises);

            batchResults.forEach((data, index) => {
                const sym = batch[index];
                results[sym] = data;

                // Update Cache
                CACHE[`${sym}:${timeline}`] = {
                    data,
                    timestamp: now,
                    timeline
                };
            });
        }

        return results;
    }

    private async fetchSymbolData(symbol: string, timeline: string): Promise<MarketData> {
        // PARALLEL AGENT EXECUTION
        console.log(`[Swarm] agents working on ${symbol}...`);

        const [priceData, newsData, techData] = await Promise.all([
            this.runPriceAgent(symbol, timeline),
            this.runNewsAgent(symbol, timeline),
            this.runTechAgent(symbol, timeline)
        ]);

        return {
            ...priceData,
            ...techData,
            news: newsData
        };
    }

    // --- SUB-AGENTS ---

    private async runPriceAgent(symbol: string, timeline: string): Promise<any> {
        const prompt = `
        ROLE: Market Data Agent (Price Specialist).
        TASK: generated plausible, realistic market data for ${symbol}.
        TIMELINE: ${timeline} (Data must reflect this period).
        
        CONTEXT:
        - If ${timeline} is intraday (1m, 1h), focus on small moves.
        - If ${timeline} is long (1Y, 5Y), focus on macro trend.
        
        OUTPUT JSON ONLY:
        {
            "price": number (current price),
            "changePercent": number (change over ${timeline}),
            "volume": number (volume for this period)
        }
        `;

        try {
            return await this.callLLM(this.models.price, prompt);
        } catch (e) {
            console.error(`Price Agent failed for ${symbol}:`, e);
            return { price: 0, changePercent: 0, volume: 0 };
        }
    }

    private async runNewsAgent(symbol: string, timeline: string): Promise<any[]> {
        const prompt = `
        ROLE: Financial News Agent.
        TASK: generate/retrieve top 2 headlines/events driving ${symbol}.
        TIMELINE: ${timeline}.
        
        OUTPUT JSON ONLY (Array):
        [
            { "headline": "string", "sentiment": "Positive"|"Negative"|"Neutral", "source": "Analyst Wire" }
        ]
        `;

        try {
            const res = await this.callLLM(this.models.news, prompt);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            return [];
        }
    }

    private async runTechAgent(symbol: string, timeline: string): Promise<any> {
        const prompt = `
        ROLE: Technical Analysis Agent.
        TASK: Estimate technical indicators for ${symbol} based on standard market behavior.
        TIMELINE: ${timeline}.
        
        OUTPUT JSON ONLY:
        {
            "rsi": number (0-100),
            "macd": { "macd": number, "signal": number, "histogram": number },
            "technicalSignal": "Buy"|"Sell"|"Neutral"
        }
        `;

        try {
            return await this.callLLM(this.models.tech, prompt);
        } catch (e) {
            return { rsi: 50, technicalSignal: "Neutral" };
        }
    }

    public async generateIntradayHistory(symbol: string, interval: string = '5min'): Promise<any[]> {
        // 1. Get current state from Price Agent (or cache)
        const currentData = await this.runPriceAgent(symbol, '1d');
        const currentPrice = currentData.price || 100;

        // 2. Generate synthetic history backwards
        // (Since we are agent-driven, we simulate the path that led to this price)
        const points = [];
        const numPoints = 60; // 5 hours of 5min candles
        let price = currentPrice;
        const volatility = 0.002; // 0.2% per step

        for (let i = 0; i < numPoints; i++) {
            points.push({
                close: Number(price.toFixed(2)),
                price: Number(price.toFixed(2)),
                volume: Math.floor(Math.random() * 10000) + 1000,
                timestamp: Date.now() - (i * 300000) // 5 min intervals
            });

            // Random walk backwards
            const change = 1 + (Math.random() * volatility * 2 - volatility);
            price = price / change;
        }

        return points.reverse();
    }

    /**
     * Generate Intraday History via Agent Inference
     * (Constructs a plausible chart history based on current price and volatility profile)
     */
    public async generateIntradayHistory(symbol: string, interval: string = '5min'): Promise<any[]> {
        // 1. Get current state from Price Agent (or cache)
        const currentData = await this.runPriceAgent(symbol, '1d');
        const currentPrice = currentData.price || 100;

        // 2. Generate synthetic history backwards
        // (Since we are agent-driven, we simulate the path that led to this price)
        const points = [];
        const numPoints = 60; // 5 hours of 5min candles
        let price = currentPrice;
        const volatility = 0.002; // 0.2% per step

        for (let i = 0; i < numPoints; i++) {
            points.push({
                close: Number(price.toFixed(2)),
                price: Number(price.toFixed(2)),
                volume: Math.floor(Math.random() * 10000) + 1000,
                timestamp: Date.now() - (i * 300000) // 5 min intervals
            });

            // Random walk backwards
            const change = 1 + (Math.random() * volatility * 2 - volatility);
            price = price / change;
        }

        return points.reverse();
    }

    // --- HELPER: LLM CALL ---
    private async callLLM(model: string, systemPrompt: string): Promise<any> {
        if (!this.apiKey) throw new Error("No API Key");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://stockcommand.workers.dev",
                "X-Title": "StockCommand Swarm"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt }
                ],
                max_tokens: 300,
                temperature: 0.2, // Low temp for JSON stability
                response_format: { type: "json_object" } // Force JSON if supported, else rely on prompt
            })
        });

        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        // Clean markdown
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    }
}
