export type LlmModelProvider = 'workers-ai';

export interface LlmModelOption {
  id: string;
  label: string;
  description: string;
  provider: LlmModelProvider;
  providerLabel: string;
  contextWindowTokens?: number;
  default?: boolean;
}

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  {
    id: '@cf/meta/llama-3-8b-instruct',
    label: 'Llama 3.1 8B',
    description: 'Balanced quality and speed for general research and market Q&A.',
    provider: 'workers-ai',
    providerLabel: 'Cloudflare Workers AI',
    contextWindowTokens: 8000,
    default: true,
  },
  {
    id: '@cf/meta/llama-3-70b-instruct',
    label: 'Llama 3.1 70B',
    description: 'Higher accuracy model for deeper analysis and longer reasoning.',
    provider: 'workers-ai',
    providerLabel: 'Cloudflare Workers AI',
    contextWindowTokens: 128000,
  },
  {
    id: '@cf/openai/gpt-4o-mini',
    label: 'GPT-4o mini',
    description: 'Great for creative tasks and summarisation with low latency.',
    provider: 'workers-ai',
    providerLabel: 'Cloudflare Workers AI',
    contextWindowTokens: 64000,
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
  LLM_MODEL_OPTIONS.find(model => model.default)?.id ?? LLM_MODEL_OPTIONS[0]?.id ?? '@cf/meta/llama-3-8b-instruct';
