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
                // Inject env keys into process.env if needed, or pass env to workflow
                // Since we used process.env in files, we might need a shim or pass it down.
                // For this quick implementation, we assume keys are available globally or we patch it.
                // Ideally we refactor 'runAgentWorkflow' to accept 'env'.
                // Let's rely on the process.env check we added but we need to ensure it's populated.
                // In Cloudflare modules, 'process' is not available by default unless using nodejs_compat and it's shimmed,
                // or we manually set it.
                Object.assign(process.env, env);

                const result = await runAgentWorkflow(env, body.scope, body.target);
                return new Response(JSON.stringify(result), {
                    headers: { "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        return new Response("StockCommand Worker Active", { status: 200 });
    },
};
