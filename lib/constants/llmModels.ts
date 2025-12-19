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
    id: 'openrouter-olmo-think',
    name: 'OLMo 3.1 Think (32B)',
    provider: 'openrouter-olmo-think',
    apiModelId: 'allenai/olmo-3.1-32b-think:free',
  },
  {
    id: 'openrouter-nemotron-nano',
    name: 'Nemotron 3 Nano (30B)',
    provider: 'openrouter-nemotron-nano',
    apiModelId: 'nvidia/nemotron-3-nano-30b-a3b:free',
  },
  {
    id: 'openrouter-deepseek-nex',
    name: 'DeepSeek V3.1 Nex',
    provider: 'openrouter-deepseek-nex',
    apiModelId: 'nex-agi/deepseek-v3.1-nex-n1:free',
    isDefault: true,
  },
  {
    id: 'openrouter-katcoder-pro',
    name: 'KAT-Coder Pro',
    provider: 'openrouter-katcoder-pro',
    apiModelId: 'kwaipilot/kat-coder-pro:free',
  },
  {
    id: 'openrouter-gpt-oss',
    name: 'GPT-OSS (120B)',
    provider: 'openrouter-gpt-oss',
    apiModelId: 'openai/gpt-oss-120b:free',
  },
];

export const LLM_MODEL_LOOKUP: { [id: string]: LlmModelOption } = LLM_MODEL_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.id]: option }),
  {},
);

export const DEFAULT_CHAT_MODEL = LLM_MODEL_OPTIONS.find(option => option.isDefault) ?? LLM_MODEL_OPTIONS[0];
