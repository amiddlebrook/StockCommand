// Worker Entry Point
import { runAgentWorkflow } from './lib/agent/workflow';

export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        // CORS
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

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

        return new Response("StockCommand Worker Active. Endpoints: /api/agent/scan (POST), /api/agent/latest (GET), /api/chat (POST)", { status: 200 });
    },
};
