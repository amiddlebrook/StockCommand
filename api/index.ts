/**
 * Cloudflare Worker API
 *
 * This worker acts as a secure proxy for AI API calls and serves static assets.
 */
import { Ai } from '@cloudflare/ai';
import { getAvailableProvider, setEnv } from '../services/apiConfig';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setEnv(env);

    const url = new URL(request.url);

    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }

    // Serve static assets
    return handleStaticAssetRequest(request, env);
  },
};

async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const provider = getAvailableProvider();

  if (!provider) {
    return new Response('No AI provider configured', { status: 500 });
  }

  const url = new URL(request.url);

  // Health check endpoint
  if (url.pathname === '/api/status') {
    return new Response(JSON.stringify({ status: 'ok', provider: provider.provider }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Chat endpoint
  if (url.pathname === '/api/chat') {
    return handleChatRequest(request, env, provider);
  }

  // Analyze endpoint
  if (url.pathname === '/api/analyze') {
    return handleAnalyzeRequest(request, env, provider);
  }

  // Search endpoint
  if (url.pathname === '/api/search') {
    return handleSearchRequest(request, env, provider);
  }

  // Analyze image endpoint
  if (url.pathname === '/api/analyze-image') {
    return handleAnalyzeImageRequest(request, env, provider);
  }

  // Default API response
  return new Response('API endpoint not found', { status: 404 });
}

async function handleChatRequest(request: Request, env: Env, provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, history } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const ai = new Ai(env.AI);

    const chat = {
      messages: [
        ...history,
        { role: 'user', content: message }
      ]
    };

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', chat);

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleAnalyzeRequest(request: Request, env: Env, provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const ai = new Ai(env.AI);

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleSearchRequest(request: Request, env: Env, provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const ai = new Ai(env.AI);

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleAnalyzeImageRequest(request: Request, env: Env, provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const image = formData.get('image');

    if (!prompt || !image) {
      return new Response('Prompt and image are required', { status: 400 });
    }

    const ai = new Ai(env.AI);

    const response = await ai.run('@cf/unum/uform-gen2-qwen-500m', {
      prompt,
      image: [image],
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze image request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleStaticAssetRequest(request: Request, env: Env): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request);

  if (shouldServeSpaFallback(assetResponse, request)) {
    const url = new URL(request.url);
    url.pathname = "/index.html";
    return env.ASSETS.fetch(
      new Request(url.toString(), {
        method: request.method,
        headers: new Headers(request.headers),
      }),
    );
  }

  return assetResponse;
}

type Env = {
  ASSETS: AssetFetcher;
  AI: any;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
};

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

function shouldServeSpaFallback(response: Response, request: Request): boolean {
  return (
    response.status === 404 &&
    request.method === "GET" &&
    acceptsHtml(request)
  );
}

function acceptsHtml(request: Request): boolean {
  const acceptHeader = request.headers.get("accept") ?? "";
  return acceptHeader.includes("text/html");
}
