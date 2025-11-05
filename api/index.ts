/**
 * Cloudflare Worker API
 *
 * This worker acts as a secure proxy for AI API calls and serves static assets.
 */
import { getAvailableProvider, setEnv } from '../services/apiConfig';
import { DEFAULT_CHAT_MODEL, LLM_MODEL_LOOKUP, LLM_MODEL_OPTIONS } from '../lib/constants/llmModels';

const DEFAULT_IMAGE_MODEL = '@cf/unum/uform-gen2-qwen-500m';

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

  if (url.pathname === '/api/models') {
    return handleModelsRequest(provider.provider);
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
    const { message, history, model } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const selectedModel = getValidatedModel(model);
    const chatMessages = buildChatMessages(history, message);

    const aiResponse = await env.AI.run(selectedModel, { messages: chatMessages });
    const responseText = extractTextResponse(aiResponse);

    return jsonResponse({
      response: responseText,
      model: selectedModel,
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
    const { prompt, model } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const selectedModel = getValidatedModel(model);

    const aiResponse = await env.AI.run(selectedModel, {
      prompt,
    });

    return jsonResponse({
      response: extractTextResponse(aiResponse),
      model: selectedModel,
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
    const { prompt, model } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const selectedModel = getValidatedModel(model);

    const aiResponse = await env.AI.run(selectedModel, {
      prompt,
    });

    return jsonResponse({
      response: extractTextResponse(aiResponse),
      model: selectedModel,
      sources: [],
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
    const model = typeof formData.get('model') === 'string' ? (formData.get('model') as string) : undefined;

    if (!prompt || !image) {
      return new Response('Prompt and image are required', { status: 400 });
    }

    const selectedModel = model && typeof model === 'string' && model.length > 0 ? model : DEFAULT_IMAGE_MODEL;

    const aiResponse = await env.AI.run(selectedModel, {
      prompt,
      image: [image],
    });

    return jsonResponse({
      response: extractTextResponse(aiResponse),
      model: selectedModel,
    });
  } catch (error) {
    console.error('Error in analyze image request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

function handleModelsRequest(providerName: string): Response {
  return jsonResponse({
    provider: providerName,
    models: LLM_MODEL_OPTIONS,
  });
}

function getValidatedModel(model?: unknown): string {
  if (typeof model === 'string' && LLM_MODEL_LOOKUP[model]) {
    return model;
  }
  return DEFAULT_CHAT_MODEL;
}

function buildChatMessages(history: any, latestMessage: string) {
  const normalisedHistory = Array.isArray(history)
    ? history
        .map((entry: any) => {
          if (!entry || typeof entry !== 'object') {
            return null;
          }

          const role = entry.role === 'model' ? 'assistant' : entry.role;
          if (role !== 'user' && role !== 'assistant' && role !== 'system') {
            return null;
          }

          const content = extractHistoryContent(entry);
          if (!content) {
            return null;
          }

          return { role, content };
        })
        .filter((entry: any): entry is { role: string; content: string } => Boolean(entry))
    : [];

  return [...normalisedHistory, { role: 'user', content: latestMessage }];
}

function extractHistoryContent(entry: any): string {
  if (typeof entry?.content === 'string' && entry.content.length > 0) {
    return entry.content;
  }

  if (Array.isArray(entry?.parts)) {
    const text = entry.parts
      .map((part: any) => {
        if (!part) {
          return '';
        }
        if (typeof part.text === 'string') {
          return part.text;
        }
        if (typeof part.content === 'string') {
          return part.content;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    if (text.length > 0) {
      return text;
    }
  }

  return '';
}

function extractTextResponse(aiResponse: any): string {
  if (!aiResponse) {
    return '';
  }

  if (typeof aiResponse === 'string') {
    return aiResponse;
  }

  if (typeof aiResponse.response === 'string') {
    return aiResponse.response;
  }

  if (typeof aiResponse.result === 'string') {
    return aiResponse.result;
  }

  if (typeof aiResponse.output === 'string') {
    return aiResponse.output;
  }

  if (aiResponse.result) {
    const { result } = aiResponse;
    if (typeof result.response === 'string') {
      return result.response;
    }
    if (typeof result.output_text === 'string') {
      return result.output_text;
    }
    if (Array.isArray(result.output)) {
      const outputText = result.output.map(extractContentFromPart).filter(Boolean).join('\n');
      if (outputText.length > 0) {
        return outputText;
      }
    }
    if (Array.isArray(result.outputs)) {
      const outputText = result.outputs.map(extractContentFromPart).filter(Boolean).join('\n');
      if (outputText.length > 0) {
        return outputText;
      }
    }
    if (result.message?.content) {
      const outputText = ensureArray(result.message.content)
        .map(extractContentFromPart)
        .filter(Boolean)
        .join('\n');
      if (outputText.length > 0) {
        return outputText;
      }
    }
  }

  if (aiResponse.choices) {
    const outputText = ensureArray(aiResponse.choices)
      .map((choice: any) => choice?.message?.content || choice?.text)
      .filter((value: any): value is string => typeof value === 'string' && value.length > 0)
      .join('\n');
    if (outputText.length > 0) {
      return outputText;
    }
  }

  return JSON.stringify(aiResponse);
}

function extractContentFromPart(part: any): string {
  if (!part) {
    return '';
  }
  if (typeof part === 'string') {
    return part;
  }
  if (typeof part.text === 'string') {
    return part.text;
  }
  if (typeof part.output_text === 'string') {
    return part.output_text;
  }
  if (part.data?.text) {
    return part.data.text;
  }
  return '';
}

function ensureArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

function jsonResponse(payload: Record<string, unknown>, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
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
