import type { AIProvider } from '../../services/apiConfig';

export type LlmModelProvider = AIProvider;

export interface LlmModelOption {
  id: string;
  label: string;
  description: string;
  provider: LlmModelProvider;
  providerLabel: string;
  contextWindowTokens?: number;
  default?: boolean;
  apiModelId: string;
}

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    description: 'Fast multimodal reasoning with strong structured output support.',
    provider: 'gemini',
    providerLabel: 'Google Gemini',
    contextWindowTokens: 1_048_576,
    default: true,
    apiModelId: 'gemini-1.5-flash',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    description: 'Reliable for narrative analysis, summarisation, and chat with low latency.',
    provider: 'openai',
    providerLabel: 'OpenAI',
    contextWindowTokens: 128_000,
    apiModelId: 'gpt-4o-mini',
  },
  {
    id: 'claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    description: 'Anthropic’s high-performing generalist model for detailed market explanations.',
    provider: 'claude',
    providerLabel: 'Anthropic Claude',
    contextWindowTokens: 200_000,
    apiModelId: 'claude-3-5-sonnet-20240620',
  },
  {
    id: 'deepseek-chat-openrouter',
    label: 'DeepSeek Chat v3.1',
    description: 'Reasoning-focused assistant available via OpenRouter.',
    provider: 'openrouter-deepseek-chat',
    providerLabel: 'OpenRouter',
    contextWindowTokens: 131_072,
    apiModelId: 'deepseek/deepseek-chat',
  },
  {
    id: 'qwen3-235b-openrouter',
    label: 'Qwen 3 235B',
    description: 'Large-context equity research specialist accessed through OpenRouter.',
    provider: 'openrouter-qwen3-235b',
    providerLabel: 'OpenRouter',
    contextWindowTokens: 65_536,
    apiModelId: 'qwen/qwen-3-235b',
  },
  {
    id: 'qwen3-coder-openrouter',
    label: 'Qwen 3 Coder',
    description: 'Coding-oriented model useful for generating scripts and automations.',
    provider: 'openrouter-qwen3-coder',
    providerLabel: 'OpenRouter',
    contextWindowTokens: 32_768,
    apiModelId: 'qwen/qwen-3-coder',
  },
  {
    id: 'deepseek-r1-t2-openrouter',
    label: 'DeepSeek R1-T2 Chimera',
    description: 'Hybrid reasoning model exposed through OpenRouter for experimentation.',
    provider: 'openrouter-deepseek-r1t2',
    providerLabel: 'OpenRouter',
    contextWindowTokens: 65_536,
    apiModelId: 'deepseek/deepseek-r1-t2',
  },
  {
    id: 'minimax-m2-openrouter',
    label: 'Minimax M2',
    description: 'Balanced generalist model from MiniMax via OpenRouter.',
    provider: 'openrouter-minimax-m2',
    providerLabel: 'OpenRouter',
    contextWindowTokens: 32_768,
    apiModelId: 'minimax/minimax-01',
  },
  {
    id: 'glm-45-air-openrouter',
    label: 'GLM 4.5 Air',
    description: 'High-efficiency bilingual model provided by Zhipu AI on OpenRouter.',
    provider: 'openrouter-glm-45-air',
    providerLabel: 'OpenRouter',
    contextWindowTokens: 65_536,
    apiModelId: 'zhipu/glm-4.5-air',
  },
];

export const LLM_MODEL_LOOKUP: Record<string, LlmModelOption> = LLM_MODEL_OPTIONS.reduce(
  (acc, model) => {
    acc[model.id] = model;
    return acc;
  },
  {} as Record<string, LlmModelOption>,
);

export const DEFAULT_CHAT_MODEL =
  LLM_MODEL_OPTIONS.find(model => model.default)?.id ?? LLM_MODEL_OPTIONS[0]?.id ?? 'gemini-1.5-flash';

