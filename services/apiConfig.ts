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
  | 'openrouter-olmo-think'
  | 'openrouter-nemotron-nano'
  | 'openrouter-deepseek-nex'
  | 'openrouter-katcoder-pro'
  | 'openrouter-gpt-oss';

export type APIConfig = {
  provider: APIProvider;
  apiKey: string;
};

export const API_CONFIGS: { [key in APIProvider]: (env: Env) => APIConfig | undefined } = {
  'openrouter-olmo-think': env =>
    env.OPENROUTER_OLMO_THINK_API_KEY
      ? { provider: 'openrouter-olmo-think', apiKey: env.OPENROUTER_OLMO_THINK_API_KEY }
      : undefined,
  'openrouter-nemotron-nano': env =>
    env.OPENROUTER_NEMOTRON_NANO_API_KEY
      ? { provider: 'openrouter-nemotron-nano', apiKey: env.OPENROUTER_NEMOTRON_NANO_API_KEY }
      : undefined,
  'openrouter-deepseek-nex': env =>
    env.OPENROUTER_DEEPSEEK_NEX_API_KEY
      ? { provider: 'openrouter-deepseek-nex', apiKey: env.OPENROUTER_DEEPSEEK_NEX_API_KEY }
      : undefined,
  'openrouter-katcoder-pro': env =>
    env.OPENROUTER_KATCODER_PRO_API_KEY
      ? { provider: 'openrouter-katcoder-pro', apiKey: env.OPENROUTER_KATCODER_PRO_API_KEY }
      : undefined,
  'openrouter-gpt-oss': env =>
    env.OPENROUTER_GPT_OSS_API_KEY
      ? { provider: 'openrouter-gpt-oss', apiKey: env.OPENROUTER_GPT_OSS_API_KEY }
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
