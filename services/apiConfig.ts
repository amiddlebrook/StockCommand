/**
 * API Configuration Service
 * Manages multiple AI provider API keys and selects the best available provider
 */

export type AIProvider = 
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'openrouter-qwen3-coder'
  | 'openrouter-deepseek-r1t2'
  | 'openrouter-deepseek-chat'
  | 'openrouter-minimax-m2'
  | 'openrouter-glm-45-air'
  | 'openrouter-qwen3-235b';

export interface APIConfig {
  provider: AIProvider;
  apiKey: string;
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
  'openrouter-qwen3-coder': ['VITE_OPENROUTER_QWEN3_CODER_API_KEY', 'OPENROUTER_QWEN3_CODER_API_KEY'],
  'openrouter-deepseek-r1t2': ['VITE_OPENROUTER_DEEPSEEK_R1T2_API_KEY', 'OPENROUTER_DEEPSEEK_R1T2_API_KEY'],
  'openrouter-deepseek-chat': ['VITE_OPENROUTER_DEEPSEEK_CHAT_API_KEY', 'OPENROUTER_DEEPSEEK_CHAT_API_KEY'],
  'openrouter-minimax-m2': ['VITE_OPENROUTER_MINIMAX_M2_API_KEY', 'OPENROUTER_MINIMAX_M2_API_KEY'],
  'openrouter-glm-45-air': ['VITE_OPENROUTER_GLM_45_AIR_API_KEY', 'OPENROUTER_GLM_45_AIR_API_KEY'],
  'openrouter-qwen3-235b': ['VITE_OPENROUTER_QWEN3_235B_API_KEY', 'OPENROUTER_QWEN3_235B_API_KEY'],
};

/**
 * Priority order for selecting providers (first available wins)
 */
const PROVIDER_PRIORITY: AIProvider[] = [
  'gemini',
  'openai',
  'claude',
  'openrouter-deepseek-chat',
  'openrouter-qwen3-235b',
  'openrouter-qwen3-coder',
  'openrouter-deepseek-r1t2',
  'openrouter-minimax-m2',
  'openrouter-glm-45-air',
];

/**
 * Resolves an API key from environment variables
 */
const resolveApiKey = (envKeys: string[]): string | undefined => {
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
    const value = (globalThis as any)[key];
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
  if (!envKeys) {
    return undefined;
  }
  return resolveApiKey(envKeys);
};

/**
 * Checks if a specific provider is configured
 */
export const isProviderConfigured = (provider: AIProvider): boolean => {
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
    openai: 'OpenAI',
    claude: 'Anthropic Claude',
    'openrouter-qwen3-coder': 'Qwen 3 Coder (OpenRouter)',
    'openrouter-deepseek-r1t2': 'DeepSeek R1-T2 Chimera (OpenRouter)',
    'openrouter-deepseek-chat': 'DeepSeek Chat v3.1 (OpenRouter)',
    'openrouter-minimax-m2': 'Minimax M2 (OpenRouter)',
    'openrouter-glm-45-air': 'GLM 4.5 Air (OpenRouter)',
    'openrouter-qwen3-235b': 'Qwen 3 235B (OpenRouter)',
  };
  return names[provider] || provider;
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
