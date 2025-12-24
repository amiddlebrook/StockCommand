import { Env } from '../types';

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
  | 'openrouter-gpt-oss'
  | 'openrouter-hermes-405b'
  | 'openrouter-nemotron-70b'
  | 'openrouter-tongyi'
  | 'openrouter-olmo'
  | 'openrouter-mimo'
  | 'openrouter-gpt-oss-20b';

export type APIConfig = {
  provider: APIProvider;
  apiKey: string;
};

// Universal key getter
const getUniversalKey = (env: Env) => env.STOCK_COMMAND_OPENROUTER_API_KEY || env.OPENROUTER_DEEPSEEK_NEX_API_KEY || env.OPENROUTER_API_KEY;

export const API_CONFIGS: { [key in APIProvider]: (env: Env) => APIConfig | undefined } = {
  'openrouter-olmo-think': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-olmo-think', apiKey: key } : undefined;
  },
  'openrouter-nemotron-nano': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-nemotron-nano', apiKey: key } : undefined;
  },
  'openrouter-deepseek-nex': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-deepseek-nex', apiKey: key } : undefined;
  },
  'openrouter-katcoder-pro': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-katcoder-pro', apiKey: key } : undefined;
  },
  'openrouter-gpt-oss': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-gpt-oss', apiKey: key } : undefined;
  },
  'openrouter-hermes-405b': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-hermes-405b', apiKey: key } : undefined;
  },
  'openrouter-nemotron-70b': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-nemotron-70b', apiKey: key } : undefined;
  },
  'openrouter-tongyi': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-tongyi', apiKey: key } : undefined;
  },
  'openrouter-olmo': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-olmo', apiKey: key } : undefined;
  },
  'openrouter-mimo': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-mimo', apiKey: key } : undefined;
  },
  'openrouter-gpt-oss-20b': env => {
    const key = getUniversalKey(env);
    return key ? { provider: 'openrouter-gpt-oss-20b', apiKey: key } : undefined;
  },
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
