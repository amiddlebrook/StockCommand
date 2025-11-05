/**
 * Unified AI Service for Cloudflare Workers
 * Handles multiple AI providers: OpenAI, Claude, Gemini, OpenRouter, and Cloudflare AI
 */

import type { AIProvider, APIConfig } from './apiConfig';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model?: string;
  provider?: string;
}

/**
 * OpenAI API Integration
 */
async function chatWithOpenAI(config: APIConfig, request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    provider: 'openai',
  };
}

/**
 * Anthropic Claude API Integration
 */
async function chatWithClaude(config: APIConfig, request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json() as any;
  return {
    content: data.content[0]?.text || '',
    model: data.model,
    provider: 'claude',
  };
}

/**
 * Google Gemini API Integration
 */
async function chatWithGemini(config: APIConfig, request: ChatRequest): Promise<ChatResponse> {
  // Convert messages to Gemini format
  const contents = request.messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json() as any;
  return {
    content: data.candidates[0]?.content?.parts[0]?.text || '',
    model: 'gemini-2.0-flash-exp',
    provider: 'gemini',
  };
}

/**
 * OpenRouter API Integration
 * Supports multiple models through a single endpoint
 */
async function chatWithOpenRouter(config: APIConfig, request: ChatRequest): Promise<ChatResponse> {
  // Map provider to model
  const modelMap: Record<string, string> = {
    'openrouter-qwen3-coder': 'qwen/qwen-3-coder-32b-instruct',
    'openrouter-deepseek-r1t2': 'deepseek/deepseek-r1-chimera',
    'openrouter-deepseek-chat': 'deepseek/deepseek-chat-v3.1',
    'openrouter-minimax-m2': 'minimax/minimax-m2',
    'openrouter-glm-45-air': 'zhipu/glm-4.5-air',
    'openrouter-qwen3-235b': 'qwen/qwen-3-235b-instruct',
  };

  const model = modelMap[config.provider] || 'qwen/qwen-3-coder-32b-instruct';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://stockbrain.app',
      'X-Title': 'StockBrain AI',
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    provider: config.provider,
  };
}

/**
 * Cloudflare AI Integration (fallback)
 */
async function chatWithCloudflareAI(env: any, request: ChatRequest): Promise<ChatResponse> {
  if (!env.AI) {
    throw new Error('Cloudflare AI binding not configured');
  }

  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: request.messages,
  });

  return {
    content: response.response || '',
    model: '@cf/meta/llama-3-8b-instruct',
    provider: 'cloudflare',
  };
}

/**
 * Main chat function that routes to the appropriate provider
 */
export async function chat(
  config: APIConfig | null,
  request: ChatRequest,
  env: any
): Promise<ChatResponse> {
  // If no provider is configured, use Cloudflare AI as fallback
  if (!config) {
    return chatWithCloudflareAI(env, request);
  }

  switch (config.provider) {
    case 'openai':
      return chatWithOpenAI(config, request);

    case 'claude':
      return chatWithClaude(config, request);

    case 'gemini':
      return chatWithGemini(config, request);

    case 'openrouter-qwen3-coder':
    case 'openrouter-deepseek-r1t2':
    case 'openrouter-deepseek-chat':
    case 'openrouter-minimax-m2':
    case 'openrouter-glm-45-air':
    case 'openrouter-qwen3-235b':
      return chatWithOpenRouter(config, request);

    default:
      // Fallback to Cloudflare AI
      return chatWithCloudflareAI(env, request);
  }
}

/**
 * Simple completion function for analyze and search endpoints
 */
export async function complete(
  config: APIConfig | null,
  prompt: string,
  env: any
): Promise<ChatResponse> {
  const request: ChatRequest = {
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  return chat(config, request, env);
}
