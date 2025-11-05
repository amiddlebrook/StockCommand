let env: Env | undefined;

export const setEnv = (envConfig: Env) => {
  env = envConfig;
};

export const getEnv = (): Env => {
  if (!env) {
    throw new Error('Environment variables not set.');
  }
  return env;
};

export type APIProvider =
  | 'openai'
  | 'gemini'
  | 'claude'
  | 'openrouter-qwen3-coder'
  | 'openrouter-deepseek-r1t2'
  | 'openrouter-deepseek-chat'
  | 'openrouter-minimax-m2'
  | 'openrouter-glm-45-air'
  | 'openrouter-qwen3-235b';

export type APIConfig = {
  provider: APIProvider;
  apiKey: string;
};

export const API_CONFIGS: { [key in APIProvider]: (env: Env) => APIConfig | undefined } = {
  openai: env => (env.OPENAI_API_KEY ? { provider: 'openai', apiKey: env.OPENAI_API_KEY } : undefined),
  gemini: env => (env.GEMINI_API_KEY ? { provider: 'gemini', apiKey: env.GEMINI_API_KEY } : undefined),
  claude: env => (env.CLAUDE_API_KEY ? { provider: 'claude', apiKey: env.CLAUDE_API_KEY } : undefined),
  'openrouter-qwen3-coder': env =>
    env.OPENROUTER_QWEN3_CODER_API_KEY
      ? { provider: 'openrouter-qwen3-coder', apiKey: env.OPENROUTER_QWEN3_CODER_API_KEY }
      : undefined,
  'openrouter-deepseek-r1t2': env =>
    env.OPENROUTER_DEEPSEEK_R1T2_API_KEY
      ? { provider: 'openrouter-deepseek-r1t2', apiKey: env.OPENROUTER_DEEPSEEK_R1T2_API_KEY }
      : undefined,
  'openrouter-deepseek-chat': env =>
    env.OPENROUTER_DEEPSEEK_CHAT_API_KEY
      ? { provider: 'openrouter-deepseek-chat', apiKey: env.OPENROUTER_DEEPSEEK_CHAT_API_KEY }
      : undefined,
  'openrouter-minimax-m2': env =>
    env.OPENROUTER_MINIMAX_M2_API_KEY
      ? { provider: 'openrouter-minimax-m2', apiKey: env.OPENROUTER_MINIMAX_M2_API_KEY }
      : undefined,
  'openrouter-glm-45-air': env =>
    env.OPENROUTER_GLM_45_AIR_API_KEY
      ? { provider: 'openrouter-glm-45-air', apiKey: env.OPENROUTER_GLM_45_AIR_API_KEY }
      : undefined,
  'openrouter-qwen3-235b': env =>
    env.OPENROUTER_QWEN3_235B_API_KEY
      ? { provider: 'openrouter-qwen3-235b', apiKey: env.OPENROUTER_QWEN3_235B_API_KEY }
      : undefined,
};

export const getAllConfiguredProviders = (): APIConfig[] => {
  const env = getEnv();
  return Object.values(API_CONFIGS)
    .map(configFn => configFn(env))
    .filter((config): config is APIConfig => !!config);
};

export const getAvailableProvider = (): APIConfig | undefined => {
  const providers = getAllConfiguredProviders();
  if (providers.length > 0) {
    return providers[0];
  }
  return undefined;
};
