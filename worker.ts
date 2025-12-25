// Worker Entry Point - StockCommand v2.0
// Production-grade Cloudflare-native AI architecture
import { Env } from './types';
import { hashPassword, verifyPassword, createSession, getSession, destroySession, createSessionCookie, createClearSessionCookie } from './lib/auth';
import { getGoogleAuthUrl, getGoogleUser } from './lib/google';

// Security
import { encrypt, decrypt } from './lib/security';

// New Architecture Imports
import { AgentSwarmDO } from './lib/swarm/AgentSwarmDO';
import { RAGService } from './lib/langchain/rag-service';
import { FlowRunner } from './lib/flow-runner';
import { CostTracker } from './lib/cost-tracker';
import { OpenRouterLLM, ChainBuilder } from './lib/langchain/orchestrator';

// Two-Plane Architecture Imports
import { EntityLockDO } from './src/do/EntityLockDO';
import { getAllClocksFromCache, getTickerFromCache, addToWatchlist, getUserWatchlist } from './src/lib/caching';
import { refreshClock, refreshAllClocks } from './src/lib/refresh/clock-refresher';
import { refreshTicker, refreshTickers } from './src/lib/refresh/ticker-refresher';
import { batchGetTickers } from './src/lib/caching';
import { CLOCK_DEFINITIONS, BUCKET_CONFIG } from './src/lib/types/artifacts';

// Export Durable Objects for Cloudflare
export { AgentSwarmDO, EntityLockDO };

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        const origin = request.headers.get("Origin");
        const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",");
        const isAllowed = origin && allowedOrigins.includes(origin);

        const corsHeaders = {
            "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0] || "https://stockcommand.averymiddlebrook2014.workers.dev",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true"
        };

        // CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // Rate Limiting (IP based)
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        if (env.USER_SESSIONS_KV && env.RATE_LIMIT_REQUESTS) {
            const limit = parseInt(env.RATE_LIMIT_REQUESTS) || 100;
            const windowSec = parseInt(env.RATE_LIMIT_WINDOW) || 60;
            const key = `ratelimit:${ip}`;

            const current = await env.USER_SESSIONS_KV.get(key);
            const count = current ? parseInt(current) : 0;

            if (count >= limit) {
                return new Response("Rate limit exceeded", { status: 429, headers: corsHeaders });
            }

            await env.USER_SESSIONS_KV.put(key, (count + 1).toString(), { expirationTtl: windowSec });
        }

        // =============================================================================
        // V2 API: TWO-PLANE ARCHITECTURE (Cache-First, Sub-100ms)
        // =============================================================================

        // GET /api/v2/clocks - Get all market clocks from cache (sub-10ms)
        if (url.pathname === "/api/v2/clocks" && request.method === "GET") {
            try {
                const { clocks, needsRefresh } = await getAllClocksFromCache(env.STOCK_CACHE_KV);

                // Transform to frontend-friendly format
                const clockList = Object.entries(CLOCK_DEFINITIONS).map(([code, def]) => ({
                    code,
                    label: def.label,
                    category: def.category,
                    status: clocks[code]?.status || 'yellow',
                    reason: clocks[code]?.reason || 'Initializing...',
                    lastUpdated: clocks[code]?.createdAt || 0,
                    needsRefresh: needsRefresh.includes(code),
                }));

                return new Response(JSON.stringify({
                    clocks: clockList,
                    needsRefresh,
                    cacheHits: Object.keys(clocks).filter(k => clocks[k]).length,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // GET /api/v2/tickers/:symbol - Get ticker artifact from cache
        if (url.pathname.startsWith("/api/v2/tickers/") && request.method === "GET") {
            try {
                const symbol = url.pathname.split('/')[4]?.toUpperCase();
                if (!symbol) {
                    return new Response(JSON.stringify({ error: "Missing symbol" }), { status: 400, headers: corsHeaders });
                }

                const kind = (url.searchParams.get('kind') || 'brief') as 'brief' | 'news' | 'quote';
                const result = await getTickerFromCache(env.STOCK_CACHE_KV, symbol, kind);

                return new Response(JSON.stringify({
                    ticker: symbol,
                    data: result.data,
                    hit: result.hit,
                    stale: result.stale,
                    needsRefresh: result.needsRefresh,
                    ageMs: result.ageMs,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // POST /api/v2/refresh - Trigger background refresh (returns immediately)
        if (url.pathname === "/api/v2/refresh" && request.method === "POST") {
            try {
                const { type, id } = await request.json() as { type: 'clock' | 'ticker'; id: string };

                if (!type || !id) {
                    return new Response(JSON.stringify({ error: "Missing type or id" }), { status: 400, headers: corsHeaders });
                }

                // Get DO for this entity
                const doId = env.ENTITY_LOCK.idFromName(`${type}:${id}`);
                const stub = env.ENTITY_LOCK.get(doId);

                // Try to acquire lock
                const freshnessMs = type === 'clock' ? BUCKET_CONFIG.clock.ttlMs : BUCKET_CONFIG.ticker_brief.ttlMs;
                const lockResult = await stub.fetch(new Request('http://internal/?action=acquire', {
                    method: 'POST',
                    body: JSON.stringify({ freshnessMs }),
                })).then((r: Response) => r.json());

                if (!lockResult.acquired) {
                    return new Response(JSON.stringify({
                        status: lockResult.status,
                        message: lockResult.status === 'fresh' ? 'Already fresh' : 'Refresh in progress'
                    }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Lock acquired - run refresh in background
                const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY;
                const baseUrl = env.OPENROUTER_API_BASE;

                ctx.waitUntil((async () => {
                    try {
                        if (type === 'clock') {
                            await refreshClock(id, env.STOCK_CACHE_KV, apiKey, baseUrl);
                        } else {
                            await refreshTicker(id, env.STOCK_CACHE_KV, apiKey, baseUrl);
                        }
                        // Mark complete
                        await stub.fetch(new Request('http://internal/?action=complete', { method: 'POST' }));
                    } catch (error: any) {
                        // Mark failed
                        await stub.fetch(new Request('http://internal/?action=fail', {
                            method: 'POST',
                            body: JSON.stringify({ error: error.message }),
                        }));
                    }
                })());

                return new Response(JSON.stringify({ status: 'started', type, id }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // POST /api/v2/refresh/batch - Batch refresh trigger
        if (url.pathname === "/api/v2/refresh/batch" && request.method === "POST") {
            try {
                const { items } = await request.json() as { items: { type: 'clock' | 'ticker'; id: string }[] };

                if (!items || !Array.isArray(items)) {
                    return new Response(JSON.stringify({ error: "Missing items array" }), { status: 400, headers: corsHeaders });
                }

                const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY;
                const baseUrl = env.OPENROUTER_API_BASE;

                const results: any[] = [];

                // Process sequentially to check locks (fast), then parallelize actual work
                await Promise.all(items.map(async (item) => {
                    const doId = env.ENTITY_LOCK.idFromName(`${item.type}:${item.id}`);
                    const stub = env.ENTITY_LOCK.get(doId);
                    const freshnessMs = item.type === 'clock' ? BUCKET_CONFIG.clock.ttlMs : BUCKET_CONFIG.ticker_brief.ttlMs;

                    const lockResult = await stub.fetch(new Request('http://internal/?action=acquire', {
                        method: 'POST',
                        body: JSON.stringify({ freshnessMs }),
                    })).then((r: Response) => r.json());

                    if (lockResult.acquired) {
                        results.push({ ...item, status: 'started' });
                        // Start background work
                        ctx.waitUntil((async () => {
                            try {
                                if (item.type === 'clock') {
                                    await refreshClock(item.id, env.STOCK_CACHE_KV, apiKey, baseUrl);
                                } else {
                                    await refreshTicker(item.id, env.STOCK_CACHE_KV, apiKey, baseUrl);
                                }
                                await stub.fetch(new Request('http://internal/?action=complete', { method: 'POST' }));
                            } catch (error: any) {
                                await stub.fetch(new Request('http://internal/?action=fail', {
                                    method: 'POST',
                                    body: JSON.stringify({ error: error.message }),
                                }));
                            }
                        })());
                    } else {
                        results.push({ ...item, status: lockResult.status });
                    }
                }));

                return new Response(JSON.stringify({ results }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // GET /api/v2/refresh/status - Check refresh job status
        if (url.pathname === "/api/v2/refresh/status" && request.method === "GET") {
            try {
                const type = url.searchParams.get('type') as 'clock' | 'ticker';
                const id = url.searchParams.get('id');

                if (!type || !id) {
                    return new Response(JSON.stringify({ error: "Missing type or id" }), { status: 400, headers: corsHeaders });
                }

                const doId = env.ENTITY_LOCK.idFromName(`${type}:${id}`);
                const stub = env.ENTITY_LOCK.get(doId);

                const status = await stub.fetch(new Request('http://internal/?action=status'))
                    .then((r: Response) => r.json());

                return new Response(JSON.stringify(status), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // POST /api/v2/watchlist - Add ticker to user watchlist
        if (url.pathname === "/api/v2/watchlist" && request.method === "POST") {
            try {
                const { symbol } = await request.json() as { symbol: string };
                const userId = request.headers.get('X-User-Id') || 'anonymous';

                const watchlist = await addToWatchlist(env.STOCK_CACHE_KV, userId, symbol.toUpperCase());

                return new Response(JSON.stringify({ watchlist }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // GET /api/v2/watchlist - Get user watchlist
        if (url.pathname === "/api/v2/watchlist" && request.method === "GET") {
            try {
                const userId = request.headers.get('X-User-Id') || 'anonymous';
                const watchlist = await getUserWatchlist(env.STOCK_CACHE_KV, userId);

                return new Response(JSON.stringify({ watchlist }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // =============================================================================
        // ADMIN SCAN - Manual trigger for cache refresh (same as cron)
        // =============================================================================

        if (url.pathname === "/api/admin/scan" && request.method === "GET") {
            const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: "No API key" }), {
                    status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Run same logic as cron - trigger in background
            ctx.waitUntil((async () => {
                console.log('[Admin Scan] Starting manual refresh...');
                try {
                    // Refresh clocks
                    console.log('[Admin Scan] Starting clock refresh...');
                    const clockResult = await refreshAllClocks(env.STOCK_CACHE_KV, apiKey);
                    console.log(`[Admin Scan] Clocks: ${clockResult.succeeded}/${clockResult.succeeded + clockResult.failed}`);

                    // Refresh priority tickers
                    console.log('[Admin Scan] Starting ticker refresh...');
                    const prioritySymbols = [
                        'SPY', 'QQQ', 'DIA', 'IWM',
                        'XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLP', 'XLY', 'XLB', 'XLU', 'XLRE', 'XLC',
                        'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA',
                    ];
                    const tickerResult = await refreshTickers(prioritySymbols, env.STOCK_CACHE_KV, apiKey);
                    console.log(`[Admin Scan] Tickers: ${tickerResult.succeeded}/${tickerResult.succeeded + tickerResult.failed}`);
                    console.log('[Admin Scan] Complete!');
                } catch (e: any) {
                    console.error('[Admin Scan] Error:', e.message);
                }
            })());

            return new Response(JSON.stringify({ status: "Scan triggered in background" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // =============================================================================
        // QUOTES API - Frontend-facing endpoint
        // =============================================================================

        // GET /api/quotes - Batch get quotes (used by TraditionalView)
        if (url.pathname === "/api/quotes" && request.method === "GET") {
            try {
                const symbolsParam = url.searchParams.get('symbols') || '';
                const symbols = symbolsParam.split(',').filter(s => s.trim()).map(s => s.trim().toUpperCase());

                if (symbols.length === 0) {
                    return new Response(JSON.stringify({}), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Get from cache
                const { tickers, needsRefresh } = await batchGetTickers(env.STOCK_CACHE_KV, symbols, 'brief');

                // Build response in format frontend expects
                const quotes: Record<string, any> = {};
                for (const symbol of symbols) {
                    const ticker = tickers[symbol];
                    if (ticker) {
                        quotes[symbol] = {
                            price: ticker.price || 0,
                            change: ticker.change || 0,
                            changePercent: ticker.changePercent || 0,
                            volume: 0,
                            lastUpdated: ticker.createdAt,
                        };
                    } else {
                        // No cache - return zeros, frontend will show loading state
                        quotes[symbol] = { price: 0, change: 0, changePercent: 0, volume: 0 };
                    }
                }

                // Trigger background refresh for stale/missing data
                if (needsRefresh.length > 0) {
                    const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY;
                    if (apiKey) {
                        ctx.waitUntil(
                            refreshTickers(needsRefresh.slice(0, 10), env.STOCK_CACHE_KV, apiKey)
                                .catch(e => console.error('[Quotes] Background refresh failed:', e))
                        );
                    }
                }

                return new Response(JSON.stringify(quotes), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                console.error('[/api/quotes] Error:', e);
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // =============================================================================
        // CHAT API
        // =============================================================================

        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                const body = await request.json() as any;
                const { message, history, context } = body;
                const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY || env.OPENROUTER_API_KEY;

                if (!apiKey) {
                    throw new Error("Missing LLM API Key");
                }

                // 🛑 HARD-CODED INTERCEPTION: GREETINGS
                // The LLM is too eager to find tickers in "hi", "hey", etc.
                // We intercept these BEFORE sending to the LLM to guarantee correct behavior.
                const cleanMsg = message.trim().toLowerCase().replace(/[^a-z ]/g, '');
                const greetings = new Set(['hi', 'hey', 'hello', 'yo', 'sup', 'hiya', 'heya', 'howdy', 'greetings', 'hola', 'good morning', 'good afternoon', 'good evening', 'gm', 'morning']);

                // Check if exact match OR starts with greeting (e.g. "yo bot")
                // Also explicitly check 2-3 char messages to prevent ticker confusion
                const isShortMsg = cleanMsg.length <= 4;

                if (greetings.has(cleanMsg) ||
                    cleanMsg.match(/^(hi|hey|hello|yo|sup) (there|stockcommand|bot|agent|world|test)$/) ||
                    (isShortMsg && greetings.has(cleanMsg.split(' ')[0]))
                ) {
                    return new Response(JSON.stringify({
                        response: "Hey! 👋 Ready to conquer the markets? Let me know which ticker to analyze or what you're looking for!"
                    }), {
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }

                // Construct conversation - smart system prompt
                let systemPrompt = `You are StockCommand, an elite AI financial analyst.

⚠️ FIRST: CHECK IF THIS IS A GREETING ⚠️
                    If the user's ENTIRE message (ignoring case/punctuation) matches ANY of these, it is a GREETING - NOT a stock ticker:
hi, hey, hello, yo, sup, hiya, heya, howdy, greetings, hola, good morning, good afternoon, good evening, gm, morning

For greetings: Respond warmly like "Hey! 👋 How can I help with your trading today?" 
DO NOT mention any stock ticker.DO NOT analyze any company.Just greet them back.

⚠️ SECOND: CHECK FOR AMBIGUITY ⚠️
                    If the user input is short, unclear, or looks like slang(e.g., "ayy", "bet", "nah") AND is not a clear stock symbol:
                    - DO NOT search for it.
- DO NOT hallucinate a ticker(e.g.do not assume "ayy" is "AAYY").
- Respond with a clarification question: "I'm not sure I caught that. Did you mean a specific ticker?" or "How can I help you regarding the markets?"
                    - Keep it SHORT.No giant paragraphs for clarification.

ONLY treat something as a stock ticker if:
                    1. User explicitly says "analyze X" or "look at X" or "what about X stock"
                2. User uses $ prefix like "$AAPL"
                3. Message has clear financial context beyond just the word
                4. It is a well - known major ticker(AAPL, TSLA, NVDA)

                Example:
                - "hi" → Greeting: "Hey! 👋 Ready to dive into the markets?"
                    - "ayy" → Clarification: "Could you clarify? Are you looking for a specific stock?"
                        - "analyze HI" → Analysis: Hillenbrand Inc(HI)
                            - "HI stock" → Analysis: Hillenbrand Inc(HI)

Communication style:
                - Use 🟢 for bullish, 🟡 for neutral, 🔴 for bearish
                    - Be concise and actionable`;


                // ROUTER AGENT (Multi-Agent Dispatch)
                // Determine user intent to select the best specialist model
                const { ROLE_MODELS } = await import('./src/lib/search');
                const { routeUserMessage } = await import('./lib/agent/router');
                const agentType = await routeUserMessage(env, message);
                console.log(`[Router] Dispatched to: ${agentType} `);

                // Select Model & Specialized System Prompt
                let selectedModel: string = ROLE_MODELS.ANALYST;
                let useTools = true;

                if (agentType === 'CODER') {
                    selectedModel = ROLE_MODELS.CODER;
                    systemPrompt = `You are StockCommand Coder.
ROLE: Expert Full-Stack Developer specializing in Cloudflare Workers, React, and TailwindCSS.
GOAL: Build high-quality, efficient tools and features for the StockCommand application.
CONTEXT:
- App is a "Cloudflare Native" financial terminal.
- Frontend: React + Tailwind + Lucide Icons.
- Backend: Cloudflare Workers + Durable Objects (AgentSwarmDO).
- Architecture: "Two-Plane" (Cache-First + Background Refresh).

INSTRUCTIONS:
1. Write clean, modern, type-safe TypeScript.
2. Use valid Tailwind classes for UI.
3. When creating tools, focus on "Creator Features" - enabling users to build their own workflows or visualizations.
4. Output Markdown code blocks.`;
                    useTools = false;

                } else if (agentType === 'CHAT') {
                    selectedModel = ROLE_MODELS.CHAT;
                    systemPrompt = `You are StockCommand Chat.
ROLE: Intelligent Financial Companion.
GOAL: Engage in natural, high-IQ conversation about markets, life, and technology.
TONE: Professional, insightful, slightly witty.
INSTRUCTIONS:
- Do NOT be a robot. Be a companion.
- If asked about stocks, give a general opinion but defer deep analysis to the Analyst.
- Keep responses concise (under 2-3 paragraphs unless asked for a monologue).`;
                    useTools = false;
                } else {
                    // ANALYST (Default)
                    selectedModel = ROLE_MODELS.ANALYST;
                    // Refined Analyst Prompt
                    systemPrompt = `You are StockCommand Analyst.
ROLE: Elite Hedge Fund Analyst & Market Data Specialist.
GOAL: Provide accurate, data-driven financial insights and real-time market updates.
CAPABILITIES:
- You have access to real-time prices, news, and technical indicators via tools.
- You can analyze complex portfolios and risk factors.

INSTRUCTIONS:
- ALWAYS cite your data sources (e.g., "According to latest price...").
- Be objective. "Green" = Bullish, "Red" = Bearish, "Yellow" = Neutral.
- Focus on the USER'S active tickers if provided.
- Do NOT hallucinate prices. Use the 'get_stock_quote' tool if you need data.`;
                }

                // Append context if Analyst (PRUNED)
                if (agentType === 'ANALYST') {
                    if (context) {
                        if (context.activeTickers && context.activeTickers.length > 0) {
                            systemPrompt += `\n\nACTIVE TICKERS: ${context.activeTickers.slice(0, 5).join(', ')}`;
                        }
                        // Prune report to last 500 chars
                        if (context.latestReport) {
                            const reportStr = typeof context.latestReport === 'string'
                                ? context.latestReport
                                : JSON.stringify(context.latestReport);
                            systemPrompt += `\nREPORT_SUMMARY: ${reportStr.substring(0, 500)}...`;
                        }
                        // Prune injected agent knowledge
                        if (context.agentKnowledge) {
                            systemPrompt += `\nKNOWLEDGE_BASE: ${context.agentKnowledge.substring(0, 1000)}...`;
                        }
                    }
                }

                // OPTIMIZATION: Truncate history to last 8 messages
                // This prevents the context window from exploding
                const recentHistory = (history || []).slice(-8);

                let messages = [
                    { role: "system", content: systemPrompt },
                    ...recentHistory.map((h: any) => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
                    { role: "user", content: message }
                ];

                // Dynamic Web Search Toggle (Only for Analyst/Chat, maybe Coder needs it? Let's limit to Analyst for now)
                const searchKeywords = ['analyze', 'stock', 'price', 'market', 'news', 'ticker', 'buying', 'selling', 'chart', 'trend', 'value', 'earnings', 'dividend', 'forecast', 'prediction', 'latest', 'today', '$'];
                // Only use web plugin if strictly needed AND not a ticker lookup (which uses the tool below)
                const shouldSearch = (agentType === 'ANALYST') && ((searchKeywords.some(kw => cleanMsg.includes(kw)) || cleanMsg.includes('$')) && !cleanMsg.match(/^(price|quote) of [a-z]+$/i));
                const plugins = shouldSearch ? [{ id: "web" }] : [];


                // MCP TOOLS DEFINITION
                const tools = [
                    {
                        type: "function",
                        function: {
                            name: "get_stock_quote",
                            description: "Get the real-time price and data for a specific stock ticker. Use this whenever the user asks for a price, quote, or analysis of a specific company.",
                            parameters: {
                                type: "object",
                                properties: {
                                    symbol: {
                                        type: "string",
                                        description: "The stock ticker symbol (e.g. AAPL, NVDA, TSLA)"
                                    }
                                },
                                required: ["symbol"]
                            }
                        }
                    }
                ];

                // 1st Call: Ask LLM (with Tools enabled if applicable)
                const llmBody: any = {
                    model: selectedModel,
                    messages: messages,
                    max_tokens: 1500,
                    plugins: plugins
                };

                if (useTools) {
                    llmBody.tools = tools;
                    llmBody.tool_choice = "auto";
                }

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey} `,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://stockcommand.workers.dev",
                        "X-Title": "StockCommand"
                    },
                    body: JSON.stringify(llmBody)
                });

                const data: any = await response.json();
                let reply = data.choices?.[0]?.message?.content || "";
                const toolCalls = data.choices?.[0]?.message?.tool_calls;

                // HANDLE TOOL CALLS
                if (toolCalls && toolCalls.length > 0) {
                    // Add assistant's tool-call message to history
                    messages.push(data.choices[0].message);

                    // Use SwarmDataService for LLM-based data
                    // Use cache for tool calls
                    // const swarmService = new SwarmDataService(apiKey);

                    for (const toolCall of toolCalls) {
                        if (toolCall.function.name === "get_stock_quote") {
                            try {
                                const args = JSON.parse(toolCall.function.arguments);
                                console.log(`[Agent] Calling Tool: get_stock_quote(${args.symbol})`);

                                // Execute the tool via Cache
                                const result = await getTickerFromCache(env.STOCK_CACHE_KV, args.symbol, 'brief');
                                const quoteData: any = result.data || {};
                                const quote = {
                                    symbol: args.symbol.toUpperCase(),
                                    price: quoteData.price || 0,
                                    changePercent: quoteData.changePercent || 0,
                                    volume: quoteData.volume || 0,
                                    timestamp: Date.now()
                                };

                                // Add tool result to messages
                                messages.push({
                                    role: "tool",
                                    tool_call_id: toolCall.id,
                                    content: JSON.stringify(quote)
                                });
                            } catch (e: any) {
                                messages.push({
                                    role: "tool",
                                    tool_call_id: toolCall.id,
                                    content: JSON.stringify({ error: e.message })
                                });
                            }
                        }
                    }

                    // 2nd Call: Get final answer based on tool results
                    const secondResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey} `,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://stockcommand.workers.dev",
                            "X-Title": "StockCommand"
                        },
                        body: JSON.stringify({
                            model: "nex-agi/deepseek-v3.1-nex-n1:free",
                            messages: messages,
                            max_tokens: 1500,
                            // No plugins for the summary step to avoid confusion
                        })
                    });
                    const secondData: any = await secondResponse.json();
                    reply = secondData.choices?.[0]?.message?.content || "Analysis failed.";
                }

                if (!reply) reply = "No response generated.";

                return new Response(JSON.stringify({ response: reply }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { "Access-Control-Allow-Origin": "*" }
                });
            }
        }

        return new Response("StockCommand Worker Active. Endpoints: /api/auth/*, /api/agent/*, /api/chat", { status: 200 });
    },

    // BACKGROUND CRON - Refresh clocks and popular tickers
    async scheduled(event: any, env: Env, ctx: any) {
        console.log('[Cron] Starting scheduled refresh...');
        const apiKey = env.STOCK_COMMAND_OPENROUTER_API_KEY;

        if (!apiKey) {
            console.error('[Cron] No API key found!');
            return;
        }

        try {
            // Refresh all clocks in parallel
            const clockResult = await refreshAllClocks(env.STOCK_CACHE_KV, apiKey);
            console.log(`[Cron] Clocks: ${clockResult.succeeded} succeeded, ${clockResult.failed} failed`);

            // Refresh sector ETFs + popular tickers
            const prioritySymbols = [
                'SPY', 'QQQ', 'DIA', 'IWM',  // Indices
                'XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLP', 'XLY', 'XLB', 'XLU', 'XLRE', 'XLC',  // Sectors
                'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA',  // Magnificent 7
            ];
            const tickerResult = await refreshTickers(prioritySymbols, env.STOCK_CACHE_KV, apiKey);
            console.log(`[Cron] Tickers: ${tickerResult.succeeded} succeeded, ${tickerResult.failed} failed`);

        } catch (error: any) {
            console.error('[Cron] Error:', error.message);
        }
    },

    // QUEUE CONSUMER - Async background processing
    async queue(batch: any, env: Env): Promise<void> {
        console.log(`[Queue] Processing batch with ${batch.messages.length} messages`);

        for (const message of batch.messages) {
            try {
                const body = message.body as any;

                switch (body.type) {
                    case 'refresh':
                        // Stock data refresh
                        const symbols = body.symbols || [];
                        for (const symbol of symbols) {
                            await env.STOCK_CACHE_KV.delete(`quote:${symbol}`);
                        }
                        break;

                    case 'embed':
                        // Generate embeddings for RAG
                        const ragService = new RAGService(env);
                        await ragService.indexDocuments(body.documents || []);
                        break;

                    case 'flow':
                        // Execute a flow in background
                        const apiKey = env.OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '';
                        const runner = new FlowRunner(env, apiKey);
                        await runner.execute(body.flowName, body.inputs || {});
                        break;

                    case 'cleanup':
                        // Cleanup old data
                        console.log('[Queue] Running cleanup tasks');
                        break;

                    default:
                        console.warn('[Queue] Unknown message type:', body.type);
                }

                message.ack();
            } catch (error: any) {
                console.error('[Queue] Error processing message:', error);
                message.retry();
            }
        }
    }
};
