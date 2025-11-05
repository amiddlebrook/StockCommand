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
    name: 'Qwen3 Coder',
    provider: 'openrouter-qwen3-coder',
    apiModelId: 'qwen/qwen3-coder',
  },
  {
    id: 'openrouter-deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'openrouter-deepseek-r1t2',
    apiModelId: 'deepseek/deepseek-r1',
  },
  {
    id: 'openrouter-deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'openrouter-deepseek-chat',
    apiModelId: 'deepseek/deepseek-chat',
  },
  {
    id: 'openrouter-minimax-m2',
    name: 'MiniMax M2',
    provider: 'openrouter-minimax-m2',
    apiModelId: 'minimax/minimax-m2',
  },
  {
    id: 'openrouter-glm-45-air',
    name: 'GLM 4.5 Air',
    provider: 'openrouter-glm-45-air',
    apiModelId: 'z-ai/glm-4.5-air',
  },
  {
    id: 'openrouter-qwen3-235b',
    name: 'Qwen3 235B',
    provider: 'openrouter-qwen3-235b',
    apiModelId: 'qwen/qwen3-235b-a22b',
  },
];

export const LLM_MODEL_LOOKUP: { [id: string]: LlmModelOption } = LLM_MODEL_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.id]: option }),
  {},
);

export const DEFAULT_CHAT_MODEL = LLM_MODEL_OPTIONS.find(option => option.isDefault) ?? LLM_MODEL_OPTIONS[0];
