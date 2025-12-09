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
                const result = await runAgentWorkflow(env, body.scope, body.target);

                // Persist the result to KV
                if (env.STOCK_CACHE_KV) {
                    const storedData = {
                        ...result,
                        timestamp: new Date().toISOString(),
                        scope: body.scope,
                        target: body.target
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

        return new Response("StockCommand Worker Active. Endpoints: /api/agent/scan (POST), /api/agent/latest (GET)", { status: 200 });
    },
};
