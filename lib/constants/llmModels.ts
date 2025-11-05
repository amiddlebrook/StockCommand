import type { APIProvider } from '../../services/apiConfig';

export type LlmModelOption = {
  id: string;
  name: string;
  provider: APIProvider;
  apiModelId: string;
  isDefault?: boolean;
};

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    apiModelId: 'gpt-4o',
    isDefault: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    apiModelId: 'gpt-4-turbo',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'claude',
    apiModelId: 'claude-3-opus-20240229',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    apiModelId: 'claude-3-5-sonnet-20240620',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    apiModelId: 'gemini-1.5-flash-latest',
  },
  {
    id: 'openrouter-qwen3-coder',
    name: 'OpenRouter Qwen3 Coder',
    provider: 'openrouter-qwen3-coder',
    apiModelId: 'google/gemma-2-9b-it',
  },
  {
    id: 'openrouter-deepseek-r1t2',
    name: 'OpenRouter Deepseek R1T2',
    provider: 'openrouter-deepseek-r1t2',
    apiModelId: 'deepseek/deepseek-coder',
  },
  {
    id: 'openrouter-deepseek-chat',
    name: 'OpenRouter Deepseek Chat',
    provider: 'openrouter-deepseek-chat',
    apiModelId: 'deepseek/deepseek-chat',
  },
  {
    id: 'openrouter-minimax-m2',
    name: 'OpenRouter Minimax M2',
    provider: 'openrouter-minimax-m2',
    apiModelId: 'minimax/minimax-chat',
  },
  {
    id: 'openrouter-glm-45-air',
    name: 'OpenRouter GLM 4.5 Air',
    provider: 'openrouter-glm-45-air',
    apiModelId: 'glm/glm-4-5-air',
  },
  {
    id: 'openrouter-qwen3-235b',
    name: 'OpenRouter Qwen3 235B',
    provider: 'openrouter-qwen3-235b',
    apiModelId: 'qwen/qwen-2-7b-instruct',
  },
];

export const LLM_MODEL_LOOKUP: { [id: string]: LlmModelOption } = LLM_MODEL_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.id]: option }),
  {},
);

export const DEFAULT_CHAT_MODEL = LLM_MODEL_OPTIONS.find(option => option.isDefault) ?? LLM_MODEL_OPTIONS[0];
