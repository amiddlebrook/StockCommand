/**
 * Cloudflare Worker API
 *
 * This worker acts as a secure proxy for AI API calls and serves static assets.
 */
import { getAvailableProvider, setEnv, getAllConfiguredProviders, type APIConfig, type AIProvider } from '../services/apiConfig';
import { determineTaskType, getProviderForTask, isToolGenerationRequest, type TaskType } from '../services/aiRouter';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Helper function to call AI providers based on configuration
 */
async function callAI(provider: APIConfig | null, prompt: string, env: Env, messages?: any[]): Promise<string> {
  if (!provider) {
    // Fallback to Workers AI if available
    if (env.AI) {
      const input = messages ? { messages } : { prompt };
      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', input);
      return response.response || JSON.stringify(response);
    }
    throw new Error('No AI provider configured');
  }

  switch (provider.provider) {
    case 'gemini': {
      const genAI = new GoogleGenerativeAI(provider.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      if (messages && messages.length > 0) {
        // Chat mode
        const chat = model.startChat({
          history: messages.slice(0, -1).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content || msg.parts?.[0]?.text || '' }],
          })),
        });
        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMessage.content || lastMessage.parts?.[0]?.text || '');
        return result.response.text();
      } else {
        // Single prompt mode
        const result = await model.generateContent(prompt);
        return result.response.text();
      }
    }

    case 'openai': {
      const openai = new OpenAI({ apiKey: provider.apiKey });

      if (messages && messages.length > 0) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: messages.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content || msg.parts?.[0]?.text || '',
          })),
        });
        return completion.choices[0]?.message?.content || '';
      } else {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        return completion.choices[0]?.message?.content || '';
      }
    }

    case 'claude': {
      const anthropic = new Anthropic({ apiKey: provider.apiKey });

      if (messages && messages.length > 0) {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: messages.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content || msg.parts?.[0]?.text || '',
          })),
        });
        return response.content[0].type === 'text' ? response.content[0].text : '';
      } else {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        return response.content[0].type === 'text' ? response.content[0].text : '';
      }
    }

    case 'openrouter-qwen3-coder':
    case 'openrouter-deepseek-r1t2':
    case 'openrouter-deepseek-chat':
    case 'openrouter-minimax-m2':
    case 'openrouter-glm-45-air':
    case 'openrouter-qwen3-235b': {
      const modelMap: Record<string, string> = {
        'openrouter-qwen3-coder': 'qwen/qwen3-coder:free',
        'openrouter-deepseek-r1t2': 'tngtech/deepseek-r1t2-chimera:free',
        'openrouter-deepseek-chat': 'deepseek/deepseek-chat-v3.1:free',
        'openrouter-minimax-m2': 'minimax/minimax-m2:free',
        'openrouter-glm-45-air': 'z-ai/glm-4.5-air:free',
        'openrouter-qwen3-235b': 'qwen/qwen3-235b-a22b:free',
      };

      const openrouter = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: provider.apiKey,
      });

      if (messages && messages.length > 0) {
        const completion = await openrouter.chat.completions.create({
          model: modelMap[provider.provider] || 'qwen/qwen3-coder:free',
          messages: messages.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content || msg.parts?.[0]?.text || '',
          })),
        });
        return completion.choices[0]?.message?.content || '';
      } else {
        const completion = await openrouter.chat.completions.create({
          model: modelMap[provider.provider] || 'qwen/qwen3-coder:free',
          messages: [{ role: 'user', content: prompt }],
        });
        return completion.choices[0]?.message?.content || '';
      }
    }

    default:
      throw new Error(`Unsupported provider: ${provider.provider}`);
  }
}

/**
 * Gets the best provider for a specific task type
 */
function getProviderForTaskType(taskType: TaskType, env: Env): APIConfig | null {
  const configuredProviders = getAllConfiguredProviders();
  const availableProviderNames = new Set<AIProvider>(
    configuredProviders.map(p => p.provider as AIProvider)
  );

  // Add Workers AI if available
  if (env.AI) {
    availableProviderNames.add('workers-ai');
  }

  const preferredProvider = getProviderForTask(taskType, availableProviderNames);

  if (!preferredProvider) {
    return null;
  }

  if (preferredProvider === 'workers-ai') {
    return null; // Will use env.AI in callAI
  }

  return configuredProviders.find(p => p.provider === preferredProvider) || null;
}

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

  const url = new URL(request.url);

  // Health check endpoint
  if (url.pathname === '/api/status') {
    const providerName = provider?.provider || (env.AI ? 'workers-ai' : 'none');
    return new Response(JSON.stringify({ status: 'ok', provider: providerName }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!provider && !env.AI) {
    return new Response('No AI provider configured', { status: 500 });
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

  // Generate tool endpoint
  if (url.pathname === '/api/generate-tool') {
    return handleGenerateToolRequest(request, env);
  }

  // Default API response
  return new Response('API endpoint not found', { status: 404 });
}

async function handleChatRequest(request: Request, env: Env, _provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, history } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    // Determine task type based on message content
    const taskType = determineTaskType({ message });

    // Get the appropriate provider for this task
    // Tool generation -> Qwen Coder
    // Regular chat -> Minimax
    const provider = getProviderForTaskType(taskType, env);

    const messages = [
      ...(history || []),
      { role: 'user', content: message }
    ];

    const responseText = await callAI(provider, message, env, messages);

    // Check if this was a tool generation request
    const isToolRequest = isToolGenerationRequest(message);

    return new Response(JSON.stringify({
      response: responseText,
      isToolGeneration: isToolRequest,
      taskType
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

async function handleAnalyzeRequest(request: Request, env: Env, _provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    // Use stock-analysis routing (Gemini/Claude preferred)
    const provider = getProviderForTaskType('stock-analysis', env);
    const responseText = await callAI(provider, prompt, env);

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

async function handleSearchRequest(request: Request, env: Env, _provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    // Use web-search routing (Gemini preferred for grounding)
    const provider = getProviderForTaskType('web-search', env);
    const responseText = await callAI(provider, prompt, env);

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

async function handleAnalyzeImageRequest(request: Request, env: Env, _provider: any): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File;

    if (!prompt || !image) {
      return new Response('Prompt and image are required', { status: 400 });
    }

    // Use image-analysis routing (Gemini/OpenAI/Claude preferred)
    const provider = getProviderForTaskType('image-analysis', env);

    let responseText = '';

    if (!provider) {
      // Fallback to Workers AI
      if (env.AI) {
        const response = await env.AI.run('@cf/unum/uform-gen2-qwen-500m', {
          prompt,
          image: [await image.arrayBuffer()],
        });
        responseText = response.response || JSON.stringify(response);
      } else {
        throw new Error('No AI provider configured for image analysis');
      }
    } else if (provider.provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(provider.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const imageData = await image.arrayBuffer();
      const base64Image = Buffer.from(imageData).toString('base64');

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: image.type,
          },
        },
      ]);
      responseText = result.response.text();
    } else if (provider.provider === 'openai') {
      const openai = new OpenAI({ apiKey: provider.apiKey });

      const imageData = await image.arrayBuffer();
      const base64Image = Buffer.from(imageData).toString('base64');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${image.type};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      });
      responseText = response.choices[0]?.message?.content || '';
    } else if (provider.provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: provider.apiKey });

      const imageData = await image.arrayBuffer();
      const base64Image = Buffer.from(imageData).toString('base64');

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });
      responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      // For OpenRouter and other providers, fall back to text-only response
      responseText = 'Image analysis is not supported for this AI provider. Please use Gemini, OpenAI, Claude, or Workers AI.';
    }

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze image request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

async function handleGenerateToolRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { description } = await request.json();

    if (!description) {
      return new Response('Tool description is required', { status: 400 });
    }

    // Use Qwen Coder for tool generation
    const provider = getProviderForTaskType('tool-generation', env);

    const systemPrompt = `You are a tool generator for StockBrain, a financial analysis platform.
Generate a JSON specification for a new analysis tool based on the user's description.

Return ONLY valid JSON in this exact format:
{
  "name": "Tool Name",
  "description": "What this tool does",
  "category": "analysis|news|technical|fundamental",
  "prompt": "The AI prompt template to use (use SYMBOL as placeholder)",
  "visualType": "text|divergence|ghost|options|chart",
  "sampleData": {}
}

For visualType, use:
- "text" for text-based analysis
- "divergence" for timeframe comparison data
- "ghost" for pattern correlation data
- "options" for options strategy recommendations
- "chart" for general chart data

Keep it simple and focused. The tool should analyze a stock ticker.`;

    const fullPrompt = `${systemPrompt}\n\nUser request: ${description}`;

    const responseText = await callAI(provider, fullPrompt, env);

    // Try to parse the JSON response
    let toolSpec;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        toolSpec = JSON.parse(jsonMatch[0]);
      } else {
        toolSpec = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse tool specification:', parseError);
      return new Response(JSON.stringify({
        error: 'Failed to generate tool specification',
        rawResponse: responseText
      }), { status: 500 });
    }

    // Add a unique ID
    toolSpec.id = `custom-${Date.now()}`;

    return new Response(JSON.stringify({
      tool: toolSpec,
      rawResponse: responseText
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate tool request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
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
  AI?: any;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  OPENROUTER_QWEN3_CODER_API_KEY?: string;
  OPENROUTER_DEEPSEEK_R1T2_API_KEY?: string;
  OPENROUTER_DEEPSEEK_CHAT_API_KEY?: string;
  OPENROUTER_MINIMAX_M2_API_KEY?: string;
  OPENROUTER_GLM_45_AIR_API_KEY?: string;
  OPENROUTER_QWEN3_235B_API_KEY?: string;
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
