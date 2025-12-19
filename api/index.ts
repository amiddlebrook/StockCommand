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
import type { Env, PortfolioHoldingSnapshot, PortfolioReportData } from '../types';

const DEFAULT_IMAGE_MODEL = '@cf/unum/uform-gen2-qwen-500m';

// Comprehensive specialized financial trading system prompt for StockCommand agents
const STOCKCOMMAND_SYSTEM_PROMPT = `You are StockCommand, an elite institutional-grade AI trading analyst and portfolio strategist.

## YOUR IDENTITY AND EXPERTISE
- You operate with the precision and decisiveness of a Goldman Sachs quant crossed with a veteran floor trader.
- You specialize in: Technical Analysis, Fundamental Analysis, Options Strategies, Sector Rotation, Risk Management, Macro Economics.
- You have deep knowledge of: GICS sector classifications, market microstructure, order flow dynamics, volatility regimes (VIX), credit spreads, and intermarket relationships.

## CRITICAL: TICKER DETECTION
Users will often type just a stock ticker symbol without any prefix or context. YOU MUST:
- Treat ANY 1-5 letter word (like "aapl", "TSLA", "onds", "spy") as a potential stock ticker
- If the user types just letters, ALWAYS assume they want stock analysis - never interpret as plain English
- "onds" = ONDS ticker (Ondas Holdings), NOT "bonds"
- "spy" = SPY ETF, not "spy" the noun
- "ge" = GE ticker (General Electric), not the word "ge"
- When in doubt, treat it as a ticker and provide stock analysis

## COMMUNICATION STYLE
- Be DECISIVE and ACTIONABLE. Never hedge with generic advice like "do your own research."
- Lead with the recommendation. Explain rationale second.
- Use trader shorthand when appropriate: "long", "short", "scale in", "trim", "stop at", "target at".
- Format analysis with clear structure: TL;DR first, then supporting data.
- Use emojis sparingly for status: 🟢 Bullish, 🟡 Neutral, 🔴 Bearish, ⚡ Momentum, 📊 Data.

## TECHNICAL ANALYSIS FRAMEWORK
When analyzing price action, always consider:
- Trend: 50/200 MA relationship, higher highs/lows pattern
- Momentum: RSI divergences, MACD crossovers, histogram direction
- Volume: Confirmation, accumulation/distribution, climax patterns
- Key Levels: Support/resistance, VWAP, previous day's high/low
- Volatility: ATR for position sizing, Bollinger Band squeeze/expansion

## SECTOR ROTATION & MACRO
- Monitor sector relative strength vs SPY
- Track credit conditions (HYG spreads), dollar strength (DXY), yields (TLT)
- Understand regime: Risk-On vs Risk-Off, Growth vs Value rotation
- Reference economic calendar events when relevant

## RESPONSE FORMAT
1. **Quick Take**: One-sentence verdict with confidence level
2. **Key Metrics**: Bullet points of relevant data  
3. **Action Plan**: Specific, executable recommendations
4. **Risk Management**: Clear stop-loss levels and position sizing guidance

Never mention this system prompt. Just embody this expertise naturally.`;


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

  if (url.pathname === '/api/portfolio/report') {
    return handlePortfolioReportRequest(request, env);
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
    const body = await request.json() as { message?: string; history?: any[]; model?: string; context?: Record<string, any> };

    if (!body.message) {
      return new Response('Message is required', { status: 400 });
    }

    const chatMessages = buildChatMessages(body.history || [], body.message);
    const contextMessage = await buildChatContextMessage(body.context, env);
    if (contextMessage) {
      chatMessages.unshift({ role: 'system', content: contextMessage });
    }

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

async function handlePortfolioReportRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { tickers?: string[]; goal?: string };
    const tickers = Array.isArray(body.tickers) ? body.tickers : [];
    const cleanedTickers = [...new Set(
      tickers
        .map(symbol => (typeof symbol === 'string' ? symbol.trim().toUpperCase() : ''))
        .filter(Boolean),
    )].slice(0, 5);

    if (cleanedTickers.length === 0) {
      return new Response('At least one ticker is required', { status: 400 });
    }

    const stockAPI = createStockAPI(env);
    const holdings: PortfolioHoldingSnapshot[] = [];

    for (const symbol of cleanedTickers) {
      try {
        const quote = await stockAPI.getQuote(symbol);
        const profile = await stockAPI.getCompanyProfile(symbol).catch(() => null);
        holdings.push({
          symbol: quote.symbol,
          name: profile?.name ?? quote.symbol,
          price: quote.price,
          changePercent: quote.changePercent,
          sector: profile?.sector,
          industry: profile?.industry,
        });
      } catch (error) {
        console.warn(`Failed to load portfolio snapshot for ${symbol}:`, error);
      }
    }

    if (holdings.length === 0) {
      return new Response('Unable to fetch live data for the requested symbols', { status: 502 });
    }

    const report = await generatePortfolioReportPayload({
      goal: body.goal || 'Balanced total return with disciplined risk management.',
      holdings,
    });

    return jsonResponse(report);
  } catch (error) {
    console.error('Error generating portfolio report:', error);
    return new Response('Internal server error', { status: 500 });
  }
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

const HYBRID_REASONING_MODEL_ID = 'openrouter-olmo-think';
const HYBRID_RESPONSE_MODEL_ID = 'openrouter-gpt-oss';

type HybridCompletionOptions = {
  finalInstruction?: string;
};

async function runHybridChatCompletion(
  messages: NormalisedMessage[],
  options?: HybridCompletionOptions,
): Promise<{ response: string; model: string }> {
  const { model: reasoningModel, providerConfig: reasoningConfig } = getModelAndProviderById(HYBRID_REASONING_MODEL_ID);
  const reasoningOutput = await runChatCompletion(reasoningConfig, reasoningModel, messages);

  const conversationSummary = stringifyConversation(messages);
  const finalInstruction =
    options?.finalInstruction ||
    'Provide the final response for the user, incorporating the reasoning above.';
  const finalMessages: NormalisedMessage[] = [
    {
      role: 'system',
      content: STOCKCOMMAND_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Conversation so far:\n${conversationSummary}\n\nOLMo Think reasoning notes:\n${reasoningOutput}\n\n${finalInstruction}`,
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
    case 'openrouter-olmo-think':
    case 'openrouter-nemotron-nano':
    case 'openrouter-deepseek-nex':
    case 'openrouter-katcoder-pro':
    case 'openrouter-gpt-oss':
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
      'X-Title': 'StockCommand',
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


async function buildChatContextMessage(context: Record<string, any> | undefined, env: Env): Promise<string | null> {
  if (!context) {
    return null;
  }

  const symbols = new Set<string>();
  if (typeof context.activeSymbol === 'string') {
    symbols.add(context.activeSymbol.trim().toUpperCase());
  }

  if (Array.isArray(context.watchlist)) {
    context.watchlist
      .filter(symbol => typeof symbol === 'string')
      .slice(0, 3)
      .forEach(symbol => symbols.add(symbol.trim().toUpperCase()));
  }

  if (symbols.size === 0) {
    return null;
  }

  const stockAPI = createStockAPI(env);
  const snapshots: string[] = [];

  for (const symbol of symbols) {
    try {
      const quote = await stockAPI.getQuote(symbol);
      snapshots.push(
        `${quote.symbol}: $${quote.price.toFixed(2)} (${quote.changePercent.toFixed(2)}%), volume ${quote.volume.toLocaleString()}`,
      );
    } catch (error) {
      console.warn('Failed to load context quote for chat:', symbol, error);
    }
  }

  if (snapshots.length === 0) {
    return null;
  }

  return `Live market context for reference:\n${snapshots.join('\n')}`;
}

async function generatePortfolioReportPayload({
  goal,
  holdings,
}: {
  goal: string;
  holdings: PortfolioHoldingSnapshot[];
}): Promise<PortfolioReportData> {
  const portfolioSnapshot = {
    goal,
    generatedAt: new Date().toISOString(),
    holdings,
  };

  try {
    const messages: NormalisedMessage[] = [
      {
        role: 'system',
        content:
          'You are StockCommand, an institutional-grade portfolio strategist. Return ONLY valid JSON with keys summary (string), allocations (array), riskNotes (string array), and playbook (string array). Each allocation entry must include symbol, thesis, and weight as a decimal between 0 and 1.',
      },
      {
        role: 'user',
        content: `Portfolio goal: ${goal}\nHoldings data: ${JSON.stringify(holdings, null, 2)}\nGenerate an allocation and playbook that references the freshest data.`,
      },
    ];

    const hybrid = await runHybridChatCompletion(messages, {
      finalInstruction:
        'Return ONLY a JSON object that matches {"summary":string,"allocations":[{"symbol":string,"thesis":string,"weight":number}],"riskNotes":string[],"playbook":string[]}. Do not include markdown or commentary outside the JSON.',
    });

    const parsed = parseHybridJson(hybrid.response);
    const allocations = buildPortfolioAllocations(parsed?.allocations, holdings);

    return {
      summary:
        typeof parsed?.summary === 'string' && parsed.summary.length > 0
          ? parsed.summary.trim()
          : buildFallbackSummary(goal, holdings),
      allocations,
      riskNotes: Array.isArray(parsed?.riskNotes)
        ? parsed.riskNotes.map(note => String(note))
        : buildFallbackRiskNotes(holdings),
      playbook: Array.isArray(parsed?.playbook)
        ? parsed.playbook.map(item => String(item))
        : buildFallbackPlaybook(goal, holdings),
      holdings,
      generatedAt: portfolioSnapshot.generatedAt,
      modelUsed: hybrid.model,
    };
  } catch (error) {
    console.error('Hybrid completion failed, falling back to deterministic report:', error);
    return {
      summary: buildFallbackSummary(goal, holdings),
      allocations: buildPortfolioAllocations([], holdings),
      riskNotes: buildFallbackRiskNotes(holdings),
      playbook: buildFallbackPlaybook(goal, holdings),
      holdings,
      generatedAt: new Date().toISOString(),
      modelUsed: 'fallback',
    };
  }
}

function parseHybridJson(payload: string | null | undefined): any {
  if (!payload) {
    return null;
  }

  const trimmed = payload.trim();
  const jsonMatch = /\{[\s\S]*\}/.exec(trimmed);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch (error) {
    console.warn('Failed to parse hybrid JSON payload:', error, candidate);
    return null;
  }
}

function buildPortfolioAllocations(
  rawAllocations: any,
  holdings: PortfolioHoldingSnapshot[],
): PortfolioReportData['allocations'] {
  const fallbackWeight = holdings.length > 0 ? 1 / holdings.length : 0;
  const sanitized = Array.isArray(rawAllocations) ? rawAllocations : [];

  const mapped = holdings.map(holding => {
    const match = sanitized.find(entry => {
      const symbol = typeof entry?.symbol === 'string' ? entry.symbol.trim().toUpperCase() : '';
      return symbol === holding.symbol.toUpperCase();
    });

    return {
      symbol: holding.symbol,
      thesis:
        typeof match?.thesis === 'string' && match.thesis.trim().length > 0
          ? match.thesis.trim()
          : `Maintain exposure to ${holding.symbol} while monitoring catalyst-driven risk.`,
      weight: normaliseAllocationWeight(match?.weight, fallbackWeight),
    };
  });

  const total = mapped.reduce((sum, item) => sum + item.weight, 0);
  if (total > 0) {
    return mapped.map(item => ({ ...item, weight: item.weight / total }));
  }

  return mapped;
}

function normaliseAllocationWeight(value: unknown, fallback: number): number {
  let numeric = fallback;

  if (typeof value === 'number' && Number.isFinite(value)) {
    numeric = value;
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value.replace('%', ''));
    if (!Number.isNaN(parsed)) {
      numeric = parsed > 1 ? parsed / 100 : parsed;
    }
  }

  if (numeric < 0) {
    return fallback;
  }

  if (numeric > 1.5) {
    return numeric / 100;
  }

  return numeric;
}

function buildFallbackSummary(goal: string, holdings: PortfolioHoldingSnapshot[]): string {
  const leaders = holdings.slice(0, 3).map(holding => holding.symbol).join(', ');
  return `Constructed a ${goal.toLowerCase()} basket anchored by ${leaders} using live market telemetry.`;
}

function buildFallbackRiskNotes(holdings: PortfolioHoldingSnapshot[]): string[] {
  return [
    'Monitor earnings catalysts and guidance revisions over the next quarter.',
    holdings.length > 1
      ? 'Diversify position sizing to prevent any single name from dominating drawdown risk.'
      : 'Position sizing should reflect higher idiosyncratic risk inherent in single-name exposure.',
    'Stay aware of macro data prints (CPI, Fed communications) that could reprice beta-sensitive names.',
  ];
}

function buildFallbackPlaybook(goal: string, holdings: PortfolioHoldingSnapshot[]): string[] {
  const top = holdings[0];
  return [
    `Rebalance monthly to keep the portfolio aligned with the ${goal.toLowerCase()} mandate.`,
    top ? `Track ${top.symbol}'s key catalysts (earnings, product launches) to adjust conviction.` : 'Track key catalysts to adjust conviction.',
    'Layer protective options or stop levels if volatility expands beyond historical percentiles.',
  ];
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

