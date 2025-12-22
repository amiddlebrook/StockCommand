// Worker Entry Point - StockCommand v2.0
// Production-grade Cloudflare-native AI architecture
import { Env } from './types';
import { runAgentWorkflow } from './lib/agent/workflow';
import { hashPassword, verifyPassword, createSession, getSession, destroySession, createSessionCookie, createClearSessionCookie } from './lib/auth';
import { getGoogleAuthUrl, getGoogleUser } from './lib/google';
import { createCheckoutSession } from './lib/stripe';
import { initializeBrokers, getBroker, getAllBrokerInfo, getRegisteredBrokers } from './lib/brokers';
import type { BrokerCredentials, BrokerConnection } from './lib/brokers/types';
import {
    getUserBalance,
    createFuelCheckout,
    handleStripeWebhook,
    PRICING
} from './lib/subscriptions';
// Security
import { encrypt, decrypt } from './lib/security';
import {
    getUserProfile,
    createOrUpdateProfile,
    getActiveCompetitions,
    joinCompetition,
    getGlobalLeaderboard,
    getSharedStrategies
} from './lib/social';
import { SwarmDataService } from './lib/agent/market-data';

// New Architecture Imports
import { AgentSwarmDO } from './lib/swarm/AgentSwarmDO';
import { RAGService } from './lib/langchain/rag-service';
import { FlowRunner } from './lib/flow-runner';
import { CostTracker } from './lib/cost-tracker';
import { OpenRouterLLM, ChainBuilder } from './lib/langchain/orchestrator';

// Export Durable Object for Cloudflare
export { AgentSwarmDO };

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

        // --- AUTH ROUTES ---

        // GET /api/agent/scan - Run agent workflow
        if (url.pathname === "/api/agent/scan" && request.method === "POST") {
            try {
                const body = await request.json() as any;
                const { scope, target, tool, context, timeline = '1d', strategies } = body;

                // Execute Workflow
                const result = await runAgentWorkflow(env, scope, target, tool, strategies, timeline);
                return new Response(JSON.stringify(result), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // GET /api/auth/me - Check current session
        if (url.pathname === "/api/auth/me" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                return new Response(JSON.stringify({ user }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ user: null }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // POST /api/auth/register - Email/Password Registration
        if (url.pathname === "/api/auth/register" && request.method === "POST") {
            try {
                const { email, password, name } = await request.json() as any;
                if (!email || !password) throw new Error("Missing email or password");

                // Check if user exists
                const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
                if (existing) throw new Error("User already exists");

                const id = crypto.randomUUID();
                const hashed = await hashPassword(password);
                const now = Math.floor(Date.now() / 1000);

                await env.DB.prepare(
                    "INSERT INTO users (id, email, name, password_hash, created_at, preferences) VALUES (?, ?, ?, ?, ?, ?)"
                ).bind(id, email, name || email.split('@')[0], hashed, now, '{}').run();

                // Auto login
                const sessionId = await createSession(env, id, request.headers.get('User-Agent'), request.headers.get('CF-Connecting-IP'));

                return new Response(JSON.stringify({ success: true, user: { id, email, name } }), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Set-Cookie": createSessionCookie(sessionId)
                    }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
            }
        }

        // POST /api/auth/login - Email/Password Login
        if (url.pathname === "/api/auth/login" && request.method === "POST") {
            try {
                const { email, password } = await request.json() as any;
                const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

                if (!user || !user.password_hash) throw new Error("Invalid credentials");

                const valid = await verifyPassword(password, user.password_hash);
                if (!valid) throw new Error("Invalid credentials");

                const sessionId = await createSession(env, user.id, request.headers.get('User-Agent'), request.headers.get('CF-Connecting-IP'));

                return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email, name: user.name } }), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Set-Cookie": createSessionCookie(sessionId)
                    }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 401, headers: corsHeaders });
            }
        }

        // POST /api/auth/logout
        if (url.pathname === "/api/auth/logout" && request.method === "POST") {
            await destroySession(env, request);
            return new Response(JSON.stringify({ success: true }), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "Set-Cookie": createClearSessionCookie()
                }
            });
        }

        // GET /api/auth/google - Start Google OAuth
        if (url.pathname === "/api/auth/google" && request.method === "GET") {
            try {
                const authUrl = getGoogleAuthUrl(env);
                return Response.redirect(authUrl);
            } catch (e: any) {
                return new Response(e.message, { status: 500 });
            }
        }

        // GET /api/auth/google/callback - Handle Google Callback
        if (url.pathname === "/api/auth/google/callback" && request.method === "GET") {
            const code = url.searchParams.get("code");
            if (!code) return new Response("Missing code", { status: 400 });

            try {
                const googleUser = await getGoogleUser(env, code);

                // Find or create user
                let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(googleUser.email).first();
                let userId = user ? user.id : crypto.randomUUID();

                if (!user) {
                    await env.DB.prepare(
                        "INSERT INTO users (id, email, name, google_id, created_at, preferences) VALUES (?, ?, ?, ?, ?, ?)"
                    ).bind(userId, googleUser.email, googleUser.name, googleUser.id, Math.floor(Date.now() / 1000), '{}').run();
                } else if (!user.google_id) {
                    // Link account if exists but no google_id
                    await env.DB.prepare("UPDATE users SET google_id = ? WHERE id = ?").bind(googleUser.id, userId).run();
                }

                const sessionId = await createSession(env, userId, request.headers.get('User-Agent'), request.headers.get('CF-Connecting-IP'));

                // Redirect to app
                return new Response(null, {
                    status: 302,
                    headers: {
                        "Location": env.APP_URL || "/",
                        "Set-Cookie": createSessionCookie(sessionId)
                    }
                });

            } catch (e: any) {
                return new Response(`Google Auth Error: ${e.message}`, { status: 500 });
            }
        }

        // GET /api/quotes - Real-time quotes via Swarm Agents
        if (url.pathname.startsWith("/api/quotes") && request.method === "GET") {
            try {
                const symbolsParam = url.searchParams.get("symbols");
                if (!symbolsParam) return new Response("Missing symbols", { status: 400 });

                const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase());

                // Use Swarm Service for data
                const swarmService = new SwarmDataService(env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '');

                // Fetch all symbols in one batch call (querySwarm expects an array)
                // We use '1d' timeline for quotes as it represents "today's price action"
                const swarmResults = await swarmService.querySwarm(symbols, '1d');

                const quoteMap: Record<string, any> = {};
                symbols.forEach(sym => {
                    const data = swarmResults[sym] || {};
                    quoteMap[sym] = {
                        symbol: sym,
                        price: data.price || 0,
                        change: data.change || 0,
                        changePercent: data.changePercent || 0,
                        volume: data.volume || 0,
                        // Synthesize additional quote fields from agent data
                        timestamp: Date.now(),
                        name: sym // Agent usually knows name but we keep it simple for now
                    };
                });

                return new Response(JSON.stringify(quoteMap), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                console.error("Error in /api/quotes:", e);
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // GET /api/swarm/intraday - Agent-Generated History
        if (url.pathname === "/api/swarm/intraday" && request.method === "GET") {
            const symbol = url.searchParams.get("symbol");
            const interval = url.searchParams.get("interval") || "5min";

            if (!symbol) return new Response("Missing symbol", { status: 400 });

            // Use Swarm Service
            const swarmService = new SwarmDataService(env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '');
            const history = await swarmService.generateIntradayHistory(symbol, interval);

            return new Response(JSON.stringify({ data: history }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // GET /api/intraday - Synthetic/Agent History for Charts
        if (url.pathname === "/api/intraday" && request.method === "GET") {
            const symbol = url.searchParams.get("symbol");
            const interval = url.searchParams.get("interval") || "5min";

            if (!symbol) return new Response("Missing symbol", { status: 400 });

            // Use Swarm Service
            const swarmService = new SwarmDataService(env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '');
            const history = await swarmService.generateIntradayHistory(symbol, interval);

            return new Response(JSON.stringify({ data: history }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // --- SUBSCRIPTION ROUTES ---

        // --- AGENT FUEL ROUTES ---

        // GET /api/fuel/pricing - Get fuel pricing config
        if (url.pathname === "/api/fuel/pricing" && request.method === "GET") {
            return new Response(JSON.stringify(PRICING), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // GET /api/fuel/balance - Get user's credit balance
        if (url.pathname === "/api/fuel/balance" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ credits: 0, lifetimeCredits: 0 }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                if (!env.DB) {
                    return new Response(JSON.stringify({ credits: 0, lifetimeCredits: 0 }), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const balance = await getUserBalance(env.DB, user.id);
                return new Response(JSON.stringify(balance), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // POST /api/fuel/buy - Create checkout for fuel
        if (url.pathname === "/api/fuel/buy" && request.method === "POST") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                const { amount } = await request.json() as { amount: number };

                if (!amount || amount < PRICING.MIN_DEPOSIT) {
                    return new Response(JSON.stringify({ error: `Minimum deposit is $${PRICING.MIN_DEPOSIT}` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                const result = await createFuelCheckout(env, user.id, amount, user.email);
                return new Response(JSON.stringify(result), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // --- SOCIAL ROUTES ---

        // GET /api/social/profile
        if (url.pathname === "/api/social/profile" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user || !env.DB) return new Response("Unauthorized", { status: 401 });

                // Get own profile or create specific endpoint for others
                const profile = await getUserProfile(env.DB, user.id);
                return new Response(JSON.stringify(profile || {}), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
        }

        // POST /api/social/profile
        if (url.pathname === "/api/social/profile" && request.method === "POST") {
            try {
                const user = await getSession(env, request);
                if (!user || !env.DB) return new Response("Unauthorized", { status: 401 });

                const data = await request.json() as any;
                await createOrUpdateProfile(env.DB, user.id, data);
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
        }

        // GET /api/social/competitions
        if (url.pathname === "/api/social/competitions" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user || !env.DB) return new Response("Unauthorized", { status: 401 });

                const competitions = await getActiveCompetitions(env.DB);
                return new Response(JSON.stringify(competitions), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
        }

        // POST /api/social/competitions/:id/join
        if (url.pathname.startsWith("/api/social/competitions/") && url.pathname.endsWith("/join") && request.method === "POST") {
            try {
                const user = await getSession(env, request);
                if (!user || !env.DB) return new Response("Unauthorized", { status: 401 });

                const parts = url.pathname.split('/');
                const compId = parts[4]; // /api/social/competitions/[id]/join

                await joinCompetition(env.DB, user.id, compId);
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
        }

        // GET /api/social/leaderboard
        if (url.pathname === "/api/social/leaderboard" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user || !env.DB) return new Response("Unauthorized", { status: 401 });

                const leaderboard = await getGlobalLeaderboard(env.DB);
                return new Response(JSON.stringify(leaderboard), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
        }

        // GET /api/social/strategies
        if (url.pathname === "/api/social/strategies" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user || !env.DB) return new Response("Unauthorized", { status: 401 });

                const strategies = await getSharedStrategies(env.DB);
                return new Response(JSON.stringify(strategies), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
        }

        // POST /api/subscription/portal - Create customer portal session
        if (url.pathname === "/api/subscription/portal" && request.method === "POST") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                if (!env.DB) {
                    return new Response(JSON.stringify({ error: "Database not configured" }), {
                        status: 500, headers: corsHeaders
                    });
                }

                // const subscription = await getUserSubscription(env.DB, user.id);

                if (false /* !subscription.stripeCustomerId */) {
                    return new Response(JSON.stringify({ error: "No active subscription" }), {
                        status: 400, headers: corsHeaders
                    });
                }

                const portalUrl = ""; // await createPortalSession(env, subscription.stripeCustomerId);
                return new Response(JSON.stringify({ url: portalUrl }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // --- BROKER ROUTES ---

        // Initialize brokers with environment
        initializeBrokers(env);

        // GET /api/brokers - List available brokers
        if (url.pathname === "/api/brokers" && request.method === "GET") {
            const brokers = getAllBrokerInfo();
            const registered = getRegisteredBrokers();

            // Mark which brokers are configured (have env vars)
            const brokersWithStatus = brokers.map(b => ({
                ...b,
                isConfigured: registered.includes(b.name)
            }));

            return new Response(JSON.stringify(brokersWithStatus), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // GET /api/brokers/:name/auth - Initiate broker OAuth
        if (url.pathname.match(/^\/api\/brokers\/[\w]+\/auth$/) && request.method === "GET") {
            const brokerName = url.pathname.split('/')[3];
            const broker = getBroker(brokerName);

            if (!broker) {
                return new Response(JSON.stringify({ error: `Broker ${brokerName} not configured` }), {
                    status: 404, headers: corsHeaders
                });
            }

            try {
                // Generate state for CSRF protection
                const state = crypto.randomUUID();

                // Store state in KV for verification
                if (env.USER_SESSIONS_KV) {
                    await env.USER_SESSIONS_KV.put(`broker_oauth_state: ${state}`, brokerName, { expirationTtl: 600 });
                }

                const authUrl = broker.getAuthUrl(state);
                return new Response(JSON.stringify({ authUrl }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // GET /api/brokers/callback - Handle broker OAuth callback
        if (url.pathname === "/api/brokers/callback" && request.method === "GET") {
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state");

            if (!code || !state) {
                return new Response("Missing code or state", { status: 400 });
            }

            try {
                // Verify state
                let brokerName: string | null = null;
                if (env.USER_SESSIONS_KV) {
                    brokerName = await env.USER_SESSIONS_KV.get(`broker_oauth_state: ${state}`);
                    await env.USER_SESSIONS_KV.delete(`broker_oauth_state: ${state}`);
                }

                if (!brokerName) {
                    return new Response("Invalid or expired state", { status: 400 });
                }

                const broker = getBroker(brokerName);
                if (!broker) {
                    return new Response(`Broker ${brokerName} not found`, { status: 404 });
                }

                // Get current user
                const user = await getSession(env, request);
                if (!user) {
                    // Redirect to login with return URL
                    return new Response(null, {
                        status: 302,
                        headers: { "Location": `/? broker_connect = ${brokerName}` }
                    });
                }

                // Exchange code for credentials
                const credentials = await broker.handleCallback(code, state);

                // Store encrypted credentials in D1
                if (env.DB) {
                    const connectionId = crypto.randomUUID();
                    const now = Math.floor(Date.now() / 1000);

                    // AES-GCM Encryption
                    if (!env.ENCRYPTION_SECRET) throw new Error("ENCRYPTION_SECRET not configured");
                    const credentialsEncrypted = await encrypt(JSON.stringify(credentials), env.ENCRYPTION_SECRET);

                    await env.DB.prepare(`
                        INSERT INTO user_brokers(id, user_id, broker_name, credentials_encrypted, is_active, connected_at)
                        VALUES(?, ?, ?, ?, ?, ?)
                        `).bind(connectionId, user.id, brokerName, credentialsEncrypted, 1, now).run();
                }

                // Redirect to app with success
                return new Response(null, {
                    status: 302,
                    headers: { "Location": `/? broker_connected = ${brokerName}` }
                });

            } catch (e: any) {
                console.error("Broker callback error:", e);
                return new Response(`Broker connection failed: ${e.message}`, { status: 500 });
            }
        }

        // GET /api/brokers/connections - List user's connected brokers
        if (url.pathname === "/api/brokers/connections" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                if (!env.DB) {
                    return new Response(JSON.stringify([]), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const connections = await env.DB.prepare(`
                    SELECT id, broker_name, is_active, connected_at, last_sync
                    FROM user_brokers
                    WHERE user_id = ? AND is_active = 1
                    `).bind(user.id).all();

                return new Response(JSON.stringify(connections.results || []), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // DELETE /api/brokers/connections/:id - Disconnect a broker
        if (url.pathname.match(/^\/api\/brokers\/connections\/[\w-]+$/) && request.method === "DELETE") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                const connectionId = url.pathname.split('/').pop();

                if (env.DB) {
                    await env.DB.prepare(`
                        UPDATE user_brokers SET is_active = 0 WHERE id = ? AND user_id = ?
                    `).bind(connectionId, user.id).run();
                }

                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // GET /api/brokers/:name/positions - Get positions from a specific broker
        if (url.pathname.match(/^\/api\/brokers\/[\w]+\/positions$/) && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                const brokerName = url.pathname.split('/')[3];

                // Get user's broker connection
                if (!env.DB) {
                    return new Response(JSON.stringify([]), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const connection = await env.DB.prepare(`
                    SELECT * FROM user_brokers WHERE user_id = ? AND broker_name = ? AND is_active = 1
                    `).bind(user.id, brokerName).first();

                if (!connection) {
                    return new Response(JSON.stringify({ error: `No connection to ${brokerName}` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                const broker = getBroker(brokerName);
                if (!broker) {
                    return new Response(JSON.stringify({ error: `Broker ${brokerName} not configured` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                const credentials = JSON.parse(await decrypt(connection.credentials_encrypted as string, env.ENCRYPTION_SECRET));
                const positions = await broker.getPositions(credentials);

                return new Response(JSON.stringify(positions), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                console.error("Get positions error:", e);
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // GET /api/brokers/:name/balance - Get balance from a specific broker
        if (url.pathname.match(/^\/api\/brokers\/[\w]+\/balance$/) && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                const brokerName = url.pathname.split('/')[3];

                if (!env.DB) {
                    return new Response(JSON.stringify({ error: "Database not configured" }), {
                        status: 500, headers: corsHeaders
                    });
                }

                const connection = await env.DB.prepare(`
                    SELECT * FROM user_brokers WHERE user_id = ? AND broker_name = ? AND is_active = 1
                    `).bind(user.id, brokerName).first();

                if (!connection) {
                    return new Response(JSON.stringify({ error: `No connection to ${brokerName}` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                const broker = getBroker(brokerName);
                if (!broker) {
                    return new Response(JSON.stringify({ error: `Broker ${brokerName} not configured` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                const credentials = JSON.parse(await decrypt(connection.credentials_encrypted as string, env.ENCRYPTION_SECRET));
                const balance = await broker.getBalances(credentials);

                return new Response(JSON.stringify(balance), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                console.error("Get balance error:", e);
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // --- TRADING ROUTES ---

        // GET /api/signals - Get active trading signals
        if (url.pathname === "/api/signals" && request.method === "GET") {
            try {
                const user = await getSession(env, request);

                // Get signals from database or generate mock ones
                if (env.DB) {
                    const now = Math.floor(Date.now() / 1000);
                    const signals = await env.DB.prepare(`
                        SELECT * FROM signals WHERE expires_at > ? ORDER BY created_at DESC LIMIT 20
                    `).bind(now).all();

                    return new Response(JSON.stringify(signals.results || []), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Return empty if no DB
                return new Response(JSON.stringify([]), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // POST /api/orders - Execute a trade order
        if (url.pathname === "/api/orders" && request.method === "POST") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                const { brokerName, symbol, side, type, qty, limitPrice, signalId } = await request.json() as any;

                if (!brokerName || !symbol || !side || !qty) {
                    return new Response(JSON.stringify({ error: "Missing required fields" }), {
                        status: 400, headers: corsHeaders
                    });
                }

                // Get user's broker connection
                if (!env.DB) {
                    return new Response(JSON.stringify({ error: "Database not configured" }), {
                        status: 500, headers: corsHeaders
                    });
                }

                const connection = await env.DB.prepare(`
                    SELECT * FROM user_brokers WHERE user_id = ? AND broker_name = ? AND is_active = 1
                    `).bind(user.id, brokerName).first();

                if (!connection) {
                    return new Response(JSON.stringify({ error: `No active connection to ${brokerName}` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                // Get the broker adapter
                const broker = getBroker(brokerName);
                if (!broker) {
                    return new Response(JSON.stringify({ error: `Broker ${brokerName} not configured` }), {
                        status: 400, headers: corsHeaders
                    });
                }

                // Decrypt credentials
                const credentials = JSON.parse(await decrypt(connection.credentials_encrypted as string, env.ENCRYPTION_SECRET));

                // Place the order
                const order = await broker.placeOrder(credentials, {
                    symbol: symbol.toUpperCase(),
                    side,
                    type: type || 'market',
                    qty: parseFloat(qty),
                    limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
                    timeInForce: 'day'
                });

                // Record the trade
                const tradeId = crypto.randomUUID();
                const now = Math.floor(Date.now() / 1000);

                await env.DB.prepare(`
                    INSERT INTO trades(id, user_id, broker_name, symbol, side, qty, price, signal_id, executed_at)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(tradeId, user.id, brokerName, symbol, side, qty, order.avgFillPrice || 0, signalId || null, now).run();

                return new Response(JSON.stringify({ success: true, order }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                console.error("Order execution error:", e);
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }

        // GET /api/trades - Get user's trade history
        if (url.pathname === "/api/trades" && request.method === "GET") {
            try {
                const user = await getSession(env, request);
                if (!user) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                if (!env.DB) {
                    return new Response(JSON.stringify([]), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                const trades = await env.DB.prepare(`
                    SELECT * FROM trades WHERE user_id = ? ORDER BY executed_at DESC LIMIT 50
                    `).bind(user.id).all();

                return new Response(JSON.stringify(trades.results || []), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500, headers: corsHeaders
                });
            }
        }


        // --- EXISTING ROUTES ---

        if (url.pathname === "/api/agent/scan" && request.method === "POST") {
            try {
                const body = await request.json() as any;

                // Run the agent
                const result = await runAgentWorkflow(env, body.scope, body.target, body.tool, body.strategies, body.timeline);

                // Persist the result to KV
                if (env.STOCK_CACHE_KV) {
                    const storedData = {
                        ...result,
                        timestamp: new Date().toISOString(),
                        scope: body.scope,
                        target: body.target,
                        tool: body.tool,
                        timeline: body.timeline
                    };
                    await env.STOCK_CACHE_KV.put("latest_agent_run", JSON.stringify(storedData));
                }

                return new Response(JSON.stringify(result), {
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

        if (url.pathname === "/api/agent/latest" && request.method === "GET") {
            if (!env.STOCK_CACHE_KV) {
                return new Response(JSON.stringify({ error: "No KV binding" }), { status: 500 });
            }
            const data = await env.STOCK_CACHE_KV.get("latest_agent_run");
            return new Response(data || JSON.stringify({ analysis: null, actions: [] }), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // GET /api/quote - Get real-time stock quote via LLM
        if (url.pathname === "/api/quote" && request.method === "GET") {
            try {
                const symbol = url.searchParams.get("symbol");
                if (!symbol) {
                    return new Response(JSON.stringify({ error: "Missing symbol parameter" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Use SwarmDataService for LLM-based quote
                const swarmService = new SwarmDataService(env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '');
                const swarmData = await swarmService.querySwarm([symbol.toUpperCase()], '1d');
                const data = swarmData[symbol.toUpperCase()] || {};

                return new Response(JSON.stringify({
                    symbol: symbol.toUpperCase(),
                    price: data.price || 0,
                    changePercent: data.changePercent || 0,
                    volume: data.volume || 0,
                    timestamp: Date.now()
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // GET /api/quotes - Get multiple stock quotes in batch via LLM
        if (url.pathname === "/api/quotes" && request.method === "GET") {
            try {
                const symbols = url.searchParams.get("symbols")?.split(",") || [];
                if (symbols.length === 0) {
                    return new Response(JSON.stringify({ error: "Missing symbols parameter" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Use SwarmDataService for LLM-based quotes
                const swarmService = new SwarmDataService(env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '');
                const symbolList = symbols.slice(0, 10).map(s => s.toUpperCase());
                const swarmData = await swarmService.querySwarm(symbolList, '1d');

                const quotes: Record<string, any> = {};
                symbolList.forEach(symbol => {
                    const data = swarmData[symbol] || {};
                    quotes[symbol] = {
                        symbol,
                        price: data.price || 0,
                        changePercent: data.changePercent || 0,
                        volume: data.volume || 0,
                        timestamp: Date.now()
                    };
                });

                return new Response(JSON.stringify(quotes), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // GET /api/intraday - Get intraday price data for charts via LLM
        if (url.pathname === "/api/intraday" && request.method === "GET") {
            try {
                const symbol = url.searchParams.get("symbol");
                const interval = url.searchParams.get("interval") || "5min";

                if (!symbol) {
                    return new Response(JSON.stringify({ error: "Missing symbol parameter" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }

                // Use SwarmDataService for LLM-based intraday data
                const swarmService = new SwarmDataService(env.OPENROUTER_DEEPSEEK_NEX_API_KEY || '');
                const data = await swarmService.generateIntradayHistory(symbol.toUpperCase(), interval);

                return new Response(JSON.stringify({ symbol: symbol.toUpperCase(), interval, data }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        if (url.pathname === "/api/agent/analyze" && request.method === "GET") {
            try {
                const ticker = url.searchParams.get("ticker");
                if (!ticker) throw new Error("Missing ticker");

                // Use SwarmDataService for LLM-based data
                const apiKey = env.OPENROUTER_DEEPSEEK_NEX_API_KEY;
                if (!apiKey) throw new Error("Missing API Key");

                const swarmService = new SwarmDataService(apiKey);
                const swarmData = await swarmService.querySwarm([ticker.toUpperCase()], '1d');
                const quoteData = swarmData[ticker.toUpperCase()] || {};

                // Call LLM for instant analysis
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://stockcommand.workers.dev",
                        "X-Title": "StockCommand Analyst"
                    },
                    body: JSON.stringify({
                        model: "nex-agi/deepseek-v3.1-nex-n1:free",
                        messages: [
                            { role: "system", content: "You are a Senior Market Analyst. Analyze the provided stock data. Be extremely concise. Max 2 sentences. Focus on sentiment and trend." },
                            { role: "user", content: `Analyze ${ticker}. Price: $${quoteData.price || 0}. Change: ${quoteData.changePercent || 0}%.` }
                        ],
                        max_tokens: 150
                    })
                });

                const data: any = await response.json();
                const analysis = data.choices?.[0]?.message?.content || "Analysis unavailable.";

                return new Response(JSON.stringify({
                    symbol: ticker,
                    price: quoteData.price || 0,
                    analysis,
                    quote: { price: quoteData.price || 0, changePercent: quoteData.changePercent || 0, volume: quoteData.volume || 0 }
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                const body = await request.json() as any;
                const { message, history, context } = body;
                const apiKey = env.OPENROUTER_DEEPSEEK_NEX_API_KEY;

                if (!apiKey) {
                    throw new Error("Missing OPENROUTER_DEEPSEEK_NEX_API_KEY");
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
                const { routeUserMessage } = await import('./lib/agent/router');
                const agentType = await routeUserMessage(env, message);
                console.log(`[Router] Dispatched to: ${agentType} `);

                // Select Model & Tools based on Agent Type
                let selectedModel = "nex-agi/deepseek-v3.1-nex-n1:free"; // Default Analyst
                let useTools = true;

                if (agentType === 'CODER') {
                    selectedModel = "kwaipilot/kat-coder-pro:free";
                    systemPrompt = "You are StockCommand Coder. You help the user write code and fix bugs. Use markdown for code blocks.";
                    useTools = false; // Coder doesn't need stock tools usually
                } else if (agentType === 'CHAT') {
                    selectedModel = "openai/gpt-oss-120b:free"; // Good general chat model
                    useTools = false; // Pure chat, no heavy tools for speed
                }

                // Append context if Analyst
                if (agentType === 'ANALYST') {
                    if (context) {
                        if (context.activeTickers && context.activeTickers.length > 0) {
                            systemPrompt += `\n\nCURRENT ACTIVE TICKERS: ${context.activeTickers.join(', ')} \nFocus your answers on these tickers.`;
                        }
                        if (context.latestReport) {
                            systemPrompt += `\n\nLATEST PORTFOLIO REPORT: \n${JSON.stringify(context.latestReport)} `;
                        }
                    }
                }

                let messages = [
                    { role: "system", content: systemPrompt },
                    ...(history || []).map((h: any) => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
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
                    const swarmService = new SwarmDataService(apiKey);

                    for (const toolCall of toolCalls) {
                        if (toolCall.function.name === "get_stock_quote") {
                            try {
                                const args = JSON.parse(toolCall.function.arguments);
                                console.log(`[Agent] Calling Tool: get_stock_quote(${args.symbol})`);

                                // Execute the tool via SwarmDataService
                                const swarmData = await swarmService.querySwarm([args.symbol.toUpperCase()], '1d');
                                const quoteData = swarmData[args.symbol.toUpperCase()] || {};
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

    // BACKGROUND SCANNER (Cron Trigger)
    // This runs autonomously to check markets and generate "Revenue" (Agent Action)
    async scheduled(event: any, env: Env, ctx: any) {
        console.log("[Worker] Scheduled event triggered");
        try {
            const { runMarketScanner } = await import('./lib/agent/scanner');
            const result = await runMarketScanner(env);
            console.log("[Worker] Scan complete:", result);
        } catch (e) {
            console.error("[Worker] Scan failed:", e);
        }
    },

    // QUEUE CONSUMER - Async background processing
    async queue(batch: MessageBatch, env: Env): Promise<void> {
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
