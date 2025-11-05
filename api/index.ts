/**
 * Cloudflare Worker API
 *
 * This worker acts as a secure proxy for AI API calls and serves static assets.
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

  // Default API response
  return new Response('API endpoint not found', { status: 404 });
}

async function handleChatRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, history, model } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const chatMessages = buildChatMessages(history, message);
    const { selectedModel, providerConfig } = selectModelAndProvider(model);
    const responseText = await runChatCompletion(providerConfig, selectedModel, chatMessages);

    return jsonResponse({
      response: responseText,
      model: selectedModel.id,
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

async function handleSearchRequest(request: Request, env: Env): Promise<Response> {
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

type NormalisedMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function selectModelAndProvider(model?: unknown): { selectedModel: LlmModelOption; providerConfig: APIConfig } {
  const configuredModels = getConfiguredModelOptions();
  if (configuredModels.length === 0) {
    throw new Error('No AI models configured.');
  }

  const requestedModel = getValidatedModel(model);
  const selectedModel = requestedModel && configuredModels.some(option => option.id === requestedModel.id)
    ? requestedModel
    : configuredModels.find(option => option.default) ?? configuredModels[0];

  const providers = getAllConfiguredProviders();
  const providerConfig = providers.find(config => config.provider === selectedModel.provider);

  if (!providerConfig) {
    throw new Error(`Provider ${selectedModel.provider} is not configured.`);
  }

  return { selectedModel, providerConfig };
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

  const data = await response.json();
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

  const data = await response.json();
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

  const data = await response.json();
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
      role: message.role === 'assistant' ? 'assistant' : 'user',
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

