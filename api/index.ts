/**
 * Cloudflare Worker API
 *
 * This worker acts as a secure proxy for AI API calls and serves static assets.
 * Features: CORS, rate limiting, security headers, AI proxy, stock data, static asset serving
 */
import {
  OPENAI_CHAT_COMPLETIONS_URL,
  ANTHROPIC_MESSAGES_URL,
  OPENROUTER_CHAT_COMPLETIONS_URL,
} from './constants';
import {
  setEnv,
  APIConfig,
  getAllConfiguredProviders,
  getAvailableProvider,
} from '../services/apiConfig';
import {
  LlmModelOption,
  LLM_MODEL_OPTIONS,
  LLM_MODEL_LOOKUP,
  DEFAULT_CHAT_MODEL,
} from '../lib/constants/llmModels';
import { createStockAPI, StockAPIError } from './stock';
import type { Env } from '../types';

const DEFAULT_IMAGE_MODEL = '@cf/unum/uform-gen2-qwen-500m';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setEnv(env);

    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Rate limiting check
    const rateLimitResponse = await checkRateLimit(request, env);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const url = new URL(request.url);

    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApiRequest(request, env, ctx);
      // Add CORS headers to API responses
      return addCORSHeaders(response, env, securityHeaders);
    }

    // Serve static assets
    const assetResponse = await handleStaticAssetRequest(request, env);
    return addCORSHeaders(assetResponse, env, securityHeaders);
  },
};

async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const provider = getAvailableProvider();

  if (!provider || getConfiguredModelOptions().length === 0) {
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
    return handleChatRequest(request, env);
  }

  // Analyze endpoint
  if (url.pathname === '/api/analyze') {
    return handleAnalyzeRequest(request, env);
  }

  // Search endpoint
  if (url.pathname === '/api/search') {
    return handleSearchRequest(request, env);
  }

  // Analyze image endpoint
  if (url.pathname === '/api/analyze-image') {
    return handleAnalyzeImageRequest(request, env);
  }

  // Stock data endpoints
  if (url.pathname === '/api/stock/quote') {
    return handleStockQuoteRequest(request, env);
  }

  if (url.pathname === '/api/stock/intraday') {
    return handleStockIntradayRequest(request, env);
  }

  if (url.pathname === '/api/stock/profile') {
    return handleStockProfileRequest(request, env);
  }

  if (url.pathname === '/api/stock/search') {
    return handleStockSearchRequest(request, env);
  }

  if (url.pathname === '/api/stock/watchlist') {
    return handleWatchlistRequest(request, env);
  }

  if (url.pathname === '/api/stock/upload') {
    return handleFileUploadRequest(request, env);
  }

  // Default API response
  return new Response('API endpoint not found', { status: 404 });
}

async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { message?: string; history?: any[]; model?: string };
    
    if (!body.message) {
      return new Response('Message is required', { status: 400 });
    }

    const chatMessages = buildChatMessages(body.history || [], body.message);
    const hybridResult = await runHybridChatCompletion(chatMessages);

    return jsonResponse({
      response: hybridResult.response,
      model: hybridResult.model,
    });
  } catch (error) {
    console.error('Error in chat request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleAnalyzeRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { prompt?: string; model?: string };

    if (!body.prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const selectedModel = getValidatedModel(body.model);

    // Use Cloudflare AI binding with proper typing
    const aiResponse = await env.AI.run(selectedModel.id as any, {
      prompt: body.prompt,
    });

    return jsonResponse({
      response: extractTextResponse(aiResponse),
      model: selectedModel.id,
    });
  } catch (error) {
    console.error('Error in analyze request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleSearchRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { prompt?: string; model?: string };

    if (!body.prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const selectedModel = getValidatedModel(body.model);

    // Use Cloudflare AI binding with proper typing
    const aiResponse = await env.AI.run(selectedModel.id as any, {
      prompt: body.prompt,
    });

    return jsonResponse({
      response: extractTextResponse(aiResponse),
      model: selectedModel.id,
      sources: [],
    });
  } catch (error) {
    console.error('Error in search request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleAnalyzeImageRequest(request: Request, env: Env): Promise<Response> {
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

    // Use Cloudflare AI binding with proper typing
    const aiResponse = await env.AI.run(selectedModel as any, {
      prompt: prompt as string,
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
  const configuredModels = getConfiguredModelOptions();
  return jsonResponse({
    provider: providerName,
    models: configuredModels,
  });
}

function getValidatedModel(model?: unknown): LlmModelOption {
  if (typeof model === 'string' && LLM_MODEL_LOOKUP[model]) {
    return LLM_MODEL_LOOKUP[model];
  }
  return DEFAULT_CHAT_MODEL;
}

function buildChatMessages(history: any, latestMessage: string): NormalisedMessage[] {
  const normalisedHistory: NormalisedMessage[] = Array.isArray(history)
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

          return { role, content } as NormalisedMessage;
        })
        .filter((entry): entry is NormalisedMessage => Boolean(entry))
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

function jsonResponse(payload: any, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function handleStockApiError(error: unknown): Response {
  if (error instanceof StockAPIError) {
    const status = error.status ?? 500;
    const body = {
      error: error.message,
      code: error.code ?? 'STOCK_API_ERROR',
    };
    return jsonResponse(body, { status });
  }

  return new Response('Internal server error', { status: 500 });
}

async function handleStaticAssetRequest(request: Request, env: Env): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request);

  if (shouldServeSpaFallback(assetResponse, request)) {
    const url = new URL(request.url);
    url.pathname = '/index.html';
    return env.ASSETS.fetch(
      new Request(url.toString(), {
        method: request.method,
        headers: new Headers(request.headers),
      }),
    );
  }

  return assetResponse;
}

function shouldServeSpaFallback(response: Response, request: Request): boolean {
  // Serve SPA fallback for 404s on HTML pages (client-side routing)
  if (response.status !== 404) {
    return false;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Don't fallback for API routes
  if (path.startsWith('/api/')) {
    return false;
  }

  // Don't fallback for files with extensions (like .js, .css, .png, etc.)
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
  if (hasExtension && !path.endsWith('.html')) {
    return false;
  }

  return true;
}

type NormalisedMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function selectModelAndProvider(model?: unknown): { selectedModel: LlmModelOption; providerConfig: APIConfig } {
  const configuredModels = getConfiguredModelOptions();
  if (configuredModels.length === 0) {
    throw new Error('No AI models configured.');
  }

  const requestedModel = getValidatedModel(model);
  const selectedModel = configuredModels.some(option => option.id === requestedModel.id)
    ? requestedModel
    : configuredModels.find(option => option.isDefault) ?? configuredModels[0];

  const providers = getAllConfiguredProviders();
  const providerConfig = providers.find(config => config.provider === selectedModel.provider);

  if (!providerConfig) {
    throw new Error(`Provider ${selectedModel.provider} is not configured.`);
  }

  return { selectedModel, providerConfig };
}

const HYBRID_REASONING_MODEL_ID = 'openrouter-deepseek-r1';
const HYBRID_RESPONSE_MODEL_ID = 'openrouter-minimax-m2';

async function runHybridChatCompletion(messages: NormalisedMessage[]): Promise<{ response: string; model: string }> {
  const { model: reasoningModel, providerConfig: reasoningConfig } = getModelAndProviderById(HYBRID_REASONING_MODEL_ID);
  const reasoningOutput = await runChatCompletion(reasoningConfig, reasoningModel, messages);

  const conversationSummary = stringifyConversation(messages);
  const finalMessages: NormalisedMessage[] = [
    {
      role: 'system',
      content:
        'You are StockBrain, a decisive financial strategist. Use the provided reasoning notes to craft a clear, actionable answer. Never mention the notes explicitly.',
    },
    {
      role: 'user',
      content: `Conversation so far:\n${conversationSummary}\n\nDeepSeek R1 reasoning notes:\n${reasoningOutput}\n\nProvide the final response for the user, incorporating the reasoning above.`,
    },
  ];

  const { model: responseModel, providerConfig: responseConfig } = getModelAndProviderById(HYBRID_RESPONSE_MODEL_ID);
  const finalResponse = await runChatCompletion(responseConfig, responseModel, finalMessages);

  return {
    response: finalResponse,
    model: `${reasoningModel.id}+${responseModel.id}`,
  };
}

function stringifyConversation(messages: NormalisedMessage[]): string {
  return messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
}

function getModelAndProviderById(modelId: string): { model: LlmModelOption; providerConfig: APIConfig } {
  const modelOption = LLM_MODEL_LOOKUP[modelId];
  if (!modelOption) {
    throw new Error(`Model ${modelId} is not defined.`);
  }

  const providers = getAllConfiguredProviders();
  const providerConfig = providers.find(config => config.provider === modelOption.provider);
  if (!providerConfig) {
    throw new Error(`Provider ${modelOption.provider} is not configured.`);
  }

  return { model: modelOption, providerConfig };
}

function getConfiguredModelOptions(): LlmModelOption[] {
  const providers = getAllConfiguredProviders();
  const configuredProviders = new Set(providers.map(config => config.provider));
  return LLM_MODEL_OPTIONS.filter(option => configuredProviders.has(option.provider));
}

async function runChatCompletion(
  providerConfig: APIConfig,
  model: LlmModelOption,
  messages: NormalisedMessage[],
): Promise<string> {
  switch (model.provider) {
    case 'gemini':
      return runGeminiCompletion(providerConfig.apiKey, model.apiModelId, messages);
    case 'openai':
      return runOpenAICompletion(providerConfig.apiKey, model.apiModelId, messages);
    case 'claude':
      return runAnthropicCompletion(providerConfig.apiKey, model.apiModelId, messages);
    case 'openrouter-deepseek-chat':
    case 'openrouter-qwen3-235b':
    case 'openrouter-qwen3-coder':
    case 'openrouter-deepseek-r1t2':
    case 'openrouter-minimax-m2':
    case 'openrouter-glm-45-air':
      return runOpenRouterCompletion(providerConfig.apiKey, model.apiModelId, messages);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

async function runGeminiCompletion(apiKey: string, modelId: string, messages: NormalisedMessage[]): Promise<string> {
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`);
  url.searchParams.set('key', apiKey);

  const { contents } = convertToGeminiContents(messages);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return extractGeminiText(data);
}

async function runOpenAICompletion(apiKey: string, modelId: string, messages: NormalisedMessage[]): Promise<string> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map(message => ({ role: message.role, content: message.content })),
    }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

async function runAnthropicCompletion(apiKey: string, modelId: string, messages: NormalisedMessage[]): Promise<string> {
  const { systemPrompt, conversation } = convertToAnthropicMessages(messages);

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      system: systemPrompt || undefined,
      messages: conversation,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as any;
  const text = data.content
    ?.map((part: any) => (typeof part.text === 'string' ? part.text : part?.content?.text ?? ''))
    .filter((part: string) => part.length > 0)
    .join('\n');

  return text ?? '';
}

async function runOpenRouterCompletion(apiKey: string, modelId: string, messages: NormalisedMessage[]): Promise<string> {
  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://stockbrain.averymiddlebrook2014.workers.dev/',
      'X-Title': 'StockBrain',
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map(message => ({ role: message.role, content: message.content })),
    }),
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

function convertToGeminiContents(messages: NormalisedMessage[]): { contents: any[] } {
  const contents: any[] = [];
  const systemMessages = messages.filter(message => message.role === 'system');
  const userAndAssistant = messages.filter(message => message.role !== 'system');

  let systemPrompt = systemMessages.map(message => message.content).join('\n\n').trim();

  for (const message of userAndAssistant) {
    const role = message.role === 'assistant' ? 'model' : 'user';
    let text = message.content;

    if (role === 'user' && systemPrompt) {
      text = `${systemPrompt}\n\n${text}`;
      systemPrompt = '';
    }

    contents.push({
      role,
      parts: [{ text }],
    });
  }

  if (systemPrompt) {
    contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
  }

  return { contents };
}

function extractGeminiText(payload: any): string {
  if (!payload?.candidates?.length) {
    return '';
  }

  const parts = payload.candidates[0]?.content?.parts ?? [];
  return parts
    .map((part: any) => {
      if (typeof part === 'string') {
        return part;
      }
      if (typeof part?.text === 'string') {
        return part.text;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function convertToAnthropicMessages(messages: NormalisedMessage[]): {
  systemPrompt: string;
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const systemMessages = messages.filter(message => message.role === 'system');
  const systemPrompt = systemMessages.map(message => message.content).join('\n\n').trim();

  const conversation = messages
    .filter(message => message.role !== 'system')
    .map(message => ({
      role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: message.content,
    }));

  return { systemPrompt, conversation };
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    console.error('Failed to read error response body:', error);
    return '';
  }
}

// CORS handling
function handleCORS(request: Request, env: Env): Response {
  const headers = new Headers();
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['https://stockbrain.averymiddlebrook2014.workers.dev'];
  const origin = request.headers.get('Origin');
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  
  return new Response(null, { status: 200, headers });
}

function addCORSHeaders(response: Response, env: Env, additionalHeaders: Record<string, string> = {}): Response {
  const headers = new Headers(response.headers);
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['https://stockbrain.averymiddlebrook2014.workers.dev'];
  
  // Add CORS headers
  const origin = headers.get('Origin');
  if (!origin) {
    // For same-origin requests, add the app's origin
    headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  } else if (allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Add security headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Rate limiting
async function checkRateLimit(request: Request, env: Env): Promise<Response | null> {
  const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const key = `rate_limit:${clientIP}`;
  
  // Simple in-memory rate limiting (for production, use KV or D1)
  const limit = parseInt(env.RATE_LIMIT_REQUESTS || '100');
  const window = parseInt(env.RATE_LIMIT_WINDOW || '60');
  
  // This is a basic implementation - in production you'd use KV or D1
  // For now, we'll just log and allow all requests
  console.log(`Rate limit check for IP: ${clientIP}, limit: ${limit}/${window}s`);
  
  return null; // Allow request for now
}

// Stock API handlers
async function handleStockQuoteRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
      return new Response('Symbol is required', { status: 400 });
    }

    const stockAPI = createStockAPI(env);
    const quote = await stockAPI.getQuote(symbol);

    return jsonResponse(quote);
  } catch (error) {
    console.error('Error in stock quote request:', error);
    return handleStockApiError(error);
  }
}

async function handleStockIntradayRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const interval = url.searchParams.get('interval') || '1min';

    if (!symbol) {
      return new Response('Symbol is required', { status: 400 });
    }

    const stockAPI = createStockAPI(env);
    const data = await stockAPI.getIntradayData(symbol, interval);

    return jsonResponse(data);
  } catch (error) {
    console.error('Error in intraday request:', error);
    return handleStockApiError(error);
  }
}

async function handleStockProfileRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
      return new Response('Symbol is required', { status: 400 });
    }

    const stockAPI = createStockAPI(env);
    const profile = await stockAPI.getCompanyProfile(symbol);

    return jsonResponse(profile);
  } catch (error) {
    console.error('Error in profile request:', error);
    return handleStockApiError(error);
  }
}

async function handleStockSearchRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    const stockAPI = createStockAPI(env);
    const results = await stockAPI.searchSymbols(query);

    return jsonResponse(results);
  } catch (error) {
    console.error('Error in search request:', error);
    return handleStockApiError(error);
  }
}

async function handleWatchlistRequest(request: Request, env: Env): Promise<Response> {
  const stockAPI = createStockAPI(env);

  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId') || 'anonymous';

      const watchlist = await stockAPI.getWatchlist(userId);
      return jsonResponse({ watchlist });
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json() as { userId?: string; symbols?: string[] };
      const userId = body.userId || 'anonymous';
      const symbols = body.symbols || [];

      await stockAPI.saveWatchlist(userId, symbols);
      return jsonResponse({ success: true });
    } catch (error) {
      console.error('Error saving watchlist:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleFileUploadRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;

    if (!file || !key) {
      return new Response('File and key are required', { status: 400 });
    }

    const stockAPI = createStockAPI(env);
    const fileKey = await stockAPI.uploadFile(key, await file.arrayBuffer(), file.type);

    return jsonResponse({ success: true, key: fileKey });
  } catch (error) {
    console.error('Error in file upload:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

