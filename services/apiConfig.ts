/**
 * API Configuration Service
 * Manages multiple AI provider API keys and selects the best available provider
 */

export type AIProvider =
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'grok'
  | 'openrouter'
  | 'deepseek'
  | 'cloudflare'
  // Legacy OpenRouter individual models (deprecated, use 'openrouter' instead)
  | 'openrouter-qwen3-coder'
  | 'openrouter-deepseek-r1t2'
  | 'openrouter-deepseek-chat'
  | 'openrouter-minimax-m2'
  | 'openrouter-glm-45-air'
  | 'openrouter-qwen3-235b';

export interface APIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string; // Optional specific model to use
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  contextLength: number;
  inputCost: number;  // Per 1M tokens
  outputCost: number; // Per 1M tokens
  features: string[]; // e.g., ['vision', 'function-calling', 'streaming']
}

interface ProviderKeyMap {
  [key: string]: string[];
}

/**
 * Maps provider names to their environment variable keys
 * Multiple keys can be specified for fallback support
 */
const PROVIDER_ENV_KEYS: ProviderKeyMap = {
  gemini: ['VITE_GEMINI_API_KEY', 'VITE_API_KEY', 'GEMINI_API_KEY', 'API_KEY'],
  openai: ['VITE_OPENAI_API_KEY', 'OPENAI_API_KEY'],
  claude: ['VITE_CLAUDE_API_KEY', 'CLAUDE_API_KEY'],
  grok: ['VITE_GROK_API_KEY', 'GROK_API_KEY', 'VITE_XAI_API_KEY', 'XAI_API_KEY'],
  openrouter: ['VITE_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'],
  deepseek: ['VITE_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY'],
  cloudflare: [], // Cloudflare AI uses binding, not API key
  // Legacy individual OpenRouter model keys (deprecated)
  'openrouter-qwen3-coder': ['VITE_OPENROUTER_QWEN3_CODER_API_KEY', 'OPENROUTER_QWEN3_CODER_API_KEY'],
  'openrouter-deepseek-r1t2': ['VITE_OPENROUTER_DEEPSEEK_R1T2_API_KEY', 'OPENROUTER_DEEPSEEK_R1T2_API_KEY'],
  'openrouter-deepseek-chat': ['VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY', 'OPENROUTER_DEEPSEEK_CHAT_API_KEY'],
  'openrouter-minimax-m2': ['VITE_OPENROUTER_MINIMAX_M2_API_KEY', 'OPENROUTER_MINIMAX_M2_API_KEY'],
  'openrouter-glm-45-air': ['VITE_OPENROUTER_GLM_45_AIR_API_KEY', 'OPENROUTER_GLM_45_AIR_API_KEY'],
  'openrouter-qwen3-235b': ['VITE_OPENROUTER_QWEN3_235B_API_KEY', 'OPENROUTER_QWEN3_235B_API_KEY'],
};

/**
 * Priority order for selecting providers (first available wins)
 * Ordered by: Quality → Cost → Availability
 */
const PROVIDER_PRIORITY: AIProvider[] = [
  'gemini',           // Best free tier + excellent quality
  'claude',           // Highest quality (if paid)
  'openai',           // Popular, reliable
  'grok',             // Latest features
  'deepseek',         // Best value (direct API)
  'openrouter',       // Unified access to all models
  'cloudflare',       // Always available fallback
  // Legacy individual OpenRouter models (deprecated)
  'openrouter-deepseek-chat',
  'openrouter-qwen3-235b',
  'openrouter-qwen3-coder',
  'openrouter-deepseek-r1t2',
  'openrouter-minimax-m2',
  'openrouter-glm-45-air',
];

/**
 * Available models for each provider
 */
export const AVAILABLE_MODELS: Record<AIProvider, ModelConfig[]> = {
  gemini: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      provider: 'gemini',
      contextLength: 1000000,
      inputCost: 0,
      outputCost: 0,
      features: ['vision', 'function-calling', 'streaming']
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      contextLength: 1000000,
      inputCost: 0.075,
      outputCost: 0.30,
      features: ['vision', 'function-calling', 'streaming']
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'gemini',
      contextLength: 2000000,
      inputCost: 1.25,
      outputCost: 5.00,
      features: ['vision', 'function-calling', 'streaming']
    }
  ],
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      contextLength: 128000,
      inputCost: 2.50,
      outputCost: 10.00,
      features: ['vision', 'function-calling', 'streaming']
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      contextLength: 128000,
      inputCost: 0.15,
      outputCost: 0.60,
      features: ['vision', 'function-calling', 'streaming']
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      contextLength: 128000,
      inputCost: 10.00,
      outputCost: 30.00,
      features: ['vision', 'function-calling', 'streaming']
    }
  ],
  claude: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'claude',
      contextLength: 200000,
      inputCost: 3.00,
      outputCost: 15.00,
      features: ['vision', 'function-calling', 'streaming']
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'claude',
      contextLength: 200000,
      inputCost: 1.00,
      outputCost: 5.00,
      features: ['vision', 'streaming']
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'claude',
      contextLength: 200000,
      inputCost: 15.00,
      outputCost: 75.00,
      features: ['vision', 'streaming']
    }
  ],
  grok: [
    {
      id: 'grok-beta',
      name: 'Grok Beta',
      provider: 'grok',
      contextLength: 128000,
      inputCost: 5.00,
      outputCost: 15.00,
      features: ['streaming', 'web-search']
    },
    {
      id: 'grok-vision-beta',
      name: 'Grok 2 Vision Beta',
      provider: 'grok',
      contextLength: 128000,
      inputCost: 2.00,
      outputCost: 10.00,
      features: ['vision', 'streaming']
    }
  ],
  openrouter: [
    {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek Chat v3 (FREE)',
      provider: 'openrouter',
      contextLength: 64000,
      inputCost: 0,
      outputCost: 0,
      features: ['streaming']
    },
    {
      id: 'deepseek/deepseek-r1',
      name: 'DeepSeek R1 (Reasoning)',
      provider: 'openrouter',
      contextLength: 64000,
      inputCost: 0.55,
      outputCost: 2.19,
      features: ['streaming', 'reasoning']
    },
    {
      id: 'qwen/qwen-2.5-72b-instruct',
      name: 'Qwen 2.5 72B (FREE)',
      provider: 'openrouter',
      contextLength: 32000,
      inputCost: 0,
      outputCost: 0,
      features: ['streaming']
    },
    {
      id: 'zhipu/glm-4-air',
      name: 'GLM 4.5 Air (FREE)',
      provider: 'openrouter',
      contextLength: 128000,
      inputCost: 0,
      outputCost: 0,
      features: ['streaming']
    },
    {
      id: 'minimax/minimax-m2',
      name: 'Minimax M2 (FREE)',
      provider: 'openrouter',
      contextLength: 32000,
      inputCost: 0,
      outputCost: 0,
      features: ['streaming']
    },
    {
      id: 'x-ai/grok-beta',
      name: 'Grok Beta (via OpenRouter)',
      provider: 'openrouter',
      contextLength: 128000,
      inputCost: 5.00,
      outputCost: 15.00,
      features: ['streaming']
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet (via OpenRouter)',
      provider: 'openrouter',
      contextLength: 200000,
      inputCost: 3.00,
      outputCost: 15.00,
      features: ['vision', 'streaming']
    },
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o (via OpenRouter)',
      provider: 'openrouter',
      contextLength: 128000,
      inputCost: 2.50,
      outputCost: 10.00,
      features: ['vision', 'streaming']
    },
    {
      id: 'google/gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (via OpenRouter)',
      provider: 'openrouter',
      contextLength: 1000000,
      inputCost: 0,
      outputCost: 0,
      features: ['vision', 'streaming']
    }
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat v3',
      provider: 'deepseek',
      contextLength: 64000,
      inputCost: 0.27,
      outputCost: 1.10,
      features: ['streaming']
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek R1',
      provider: 'deepseek',
      contextLength: 64000,
      inputCost: 0.55,
      outputCost: 2.19,
      features: ['streaming', 'reasoning']
    }
  ],
  cloudflare: [
    {
      id: '@cf/meta/llama-3.1-8b-instruct',
      name: 'Llama 3.1 8B Instruct',
      provider: 'cloudflare',
      contextLength: 8000,
      inputCost: 0,
      outputCost: 0,
      features: ['streaming']
    },
    {
      id: '@cf/meta/llama-3.1-70b-instruct',
      name: 'Llama 3.1 70B Instruct',
      provider: 'cloudflare',
      contextLength: 8000,
      inputCost: 0,
      outputCost: 0,
      features: ['streaming']
    },
    {
      id: '@cf/unum/uform-gen2-qwen-500m',
      name: 'UForm Gen2 Qwen 500M (Vision)',
      provider: 'cloudflare',
      contextLength: 2000,
      inputCost: 0,
      outputCost: 0,
      features: ['vision']
    }
  ],
  // Legacy individual providers (empty - use openrouter instead)
  'openrouter-qwen3-coder': [],
  'openrouter-deepseek-r1t2': [],
  'openrouter-deepseek-chat': [],
  'openrouter-minimax-m2': [],
  'openrouter-glm-45-air': [],
  'openrouter-qwen3-235b': []
};

let env: any = {};

export const setEnv = (newEnv: any) => {
  env = newEnv;
};

/**
 * Resolves an API key from environment variables
 */
const resolveApiKey = (envKeys: string[]): string | undefined => {
  // Check the env object first (for worker environment)
  if (env) {
    for (const key of envKeys) {
      const value = env[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }

  // Check import.meta.env (Vite)
  const maybeImportMeta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
  if (maybeImportMeta?.env) {
    for (const key of envKeys) {
      const value = maybeImportMeta.env[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }

  // Check process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    for (const key of envKeys) {
      const value = process.env[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }

  // Check globalThis
  for (const key of envKeys) {
    const value = (globalThis as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

/**
 * Gets the API key for a specific provider
 */
export const getProviderApiKey = (provider: AIProvider): string | undefined => {
  const envKeys = PROVIDER_ENV_KEYS[provider];
  if (!envKeys || envKeys.length === 0) {
    // Cloudflare doesn't need an API key
    if (provider === 'cloudflare') {
      return 'cloudflare-ai-binding';
    }
    return undefined;
  }
  return resolveApiKey(envKeys);
};

/**
 * Checks if a specific provider is configured
 */
export const isProviderConfigured = (provider: AIProvider): boolean => {
  // Cloudflare is always available
  if (provider === 'cloudflare') {
    return true;
  }
  return Boolean(getProviderApiKey(provider));
};

/**
 * Gets the first available configured provider based on priority
 */
export const getAvailableProvider = (): APIConfig | null => {
  for (const provider of PROVIDER_PRIORITY) {
    const apiKey = getProviderApiKey(provider);
    if (apiKey) {
      return { provider, apiKey };
    }
  }
  return null;
};

/**
 * Gets all configured providers
 */
export const getAllConfiguredProviders = (): APIConfig[] => {
  const configs: APIConfig[] = [];
  for (const provider of PROVIDER_PRIORITY) {
    const apiKey = getProviderApiKey(provider);
    if (apiKey) {
      configs.push({ provider, apiKey });
    }
  }
  return configs;
};

/**
 * Checks if any AI provider is configured
 */
export const isAnyProviderConfigured = (): boolean => {
  return getAvailableProvider() !== null;
};

/**
 * Gets a display name for a provider
 */
export const getProviderDisplayName = (provider: AIProvider): string => {
  const names: Record<AIProvider, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI GPT',
    claude: 'Anthropic Claude',
    grok: 'xAI Grok',
    openrouter: 'OpenRouter (All Models)',
    deepseek: 'DeepSeek',
    cloudflare: 'Cloudflare AI',
    // Legacy individual models
    'openrouter-qwen3-coder': 'Qwen 3 Coder (OpenRouter)',
    'openrouter-deepseek-r1t2': 'DeepSeek R1-T2 (OpenRouter)',
    'openrouter-deepseek-chat': 'DeepSeek Chat (OpenRouter)',
    'openrouter-minimax-m2': 'Minimax M2 (OpenRouter)',
    'openrouter-glm-45-air': 'GLM 4.5 Air (OpenRouter)',
    'openrouter-qwen3-235b': 'Qwen 3 235B (OpenRouter)',
  };
  return names[provider] || provider;
};

/**
 * Gets available models for a provider
 */
export const getAvailableModels = (provider: AIProvider): ModelConfig[] => {
  return AVAILABLE_MODELS[provider] || [];
};

/**
 * Gets the default model for a provider
 */
export const getDefaultModel = (provider: AIProvider): ModelConfig | null => {
  const models = getAvailableModels(provider);
  return models.length > 0 ? models[0] : null;
};

/**
 * Gets the Odds API key for sports betting data
 */
export const getOddsApiKey = (): string | undefined => {
  return resolveApiKey(['VITE_ODDS_API_KEY', 'ODDS_API_KEY']);
};

/**
 * Checks if Odds API is configured
 */
export const isOddsApiConfigured = (): boolean => {
  return Boolean(getOddsApiKey());
};
