// Worker Entry Point
import { runAgentWorkflow } from './lib/agent/workflow';
import { hashPassword, verifyPassword, createSession, getSession, destroySession, createSessionCookie, createClearSessionCookie } from './lib/auth';
import { getGoogleAuthUrl, getGoogleUser } from './lib/google';
import { createCheckoutSession } from './lib/stripe';

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        // CORS
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true"
                },
            });
        }

        const corsHeaders = {
            "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
            "Access-Control-Allow-Credentials": "true"
        };

        // --- AUTH ROUTES ---

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

        // --- STRIPE ROUTES ---

        if (url.pathname === "/api/stripe/create-checkout-session" && request.method === "POST") {
            try {
                const user = await getSession(env, request);
                if (!user) return new Response("Unauthorized", { status: 401 });

                // Use a default price ID or get from body
                const body = await request.json() as any;
                const priceId = body.priceId || env.STRIPE_DEFAULT_PRICE_ID;

                const session = await createCheckoutSession(env, user.id, priceId);
                return new Response(JSON.stringify(session), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }


        // --- EXISTING ROUTES ---

        if (url.pathname === "/api/agent/scan" && request.method === "POST") {
            try {
                const body = await request.json() as any;

                // Run the agent
                const result = await runAgentWorkflow(env, body.scope, body.target, body.tool);

                // Persist the result to KV
                if (env.STOCK_CACHE_KV) {
                    const storedData = {
                        ...result,
                        timestamp: new Date().toISOString(),
                        scope: body.scope,
                        target: body.target,
                        tool: body.tool
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

        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                const body = await request.json() as any;
                const { message, history, context } = body;
                const apiKey = env.OPENROUTER_DEEPSEEK_CHAT_API_KEY;

                if (!apiKey) {
                    throw new Error("Missing OPENROUTER_DEEPSEEK_CHAT_API_KEY");
                }

                // Construct conversation for DeepSeek
                let systemPrompt = "You are StockCommand, an advanced AI financial analyst. Answer queries concisely and professionally.";

                if (context) {
                    if (context.activeTickers && context.activeTickers.length > 0) {
                        systemPrompt += `\n\nCURRENT ACTIVE TICKERS: ${context.activeTickers.join(', ')}\nFocus your answers on these tickers unless the user explicitly asks about others.`;
                    }

                    if (context.latestReport) {
                        systemPrompt += `\n\nCONTEXT - LATEST AGENT REPORT:\n"""${context.latestReport}"""\n\nINSTRUCTION: This report may be for a previously selected ticker. Only use this information if it is relevant to the Current Active Tickers or if the user explicitly asks about this specific report content. Otherwise, ignore it.`;
                    }
                }

                const messages = [
                    { role: "system", content: systemPrompt },
                    ...history.map((h: any) => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
                    { role: "user", content: message }
                ];

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "deepseek/deepseek-chat",
                        messages: messages,
                        max_tokens: 1000
                    })
                });

                const data: any = await response.json();
                const reply = data.choices?.[0]?.message?.content || "No response generated.";

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
};
