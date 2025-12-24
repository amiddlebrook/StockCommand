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
    id: 'nex-deepseek-v3',
    name: 'DeepSeek V3.1 Nex (Analyst)',
    provider: 'openrouter-deepseek-nex',
    apiModelId: 'nex-agi/deepseek-v3.1-nex-n1:free',
    isDefault: true,
  },
  {
    id: 'hermes-3-405b',
    name: 'Hermes 3 (405B)',
    provider: 'openrouter-hermes-405b',
    apiModelId: 'nousresearch/hermes-3-llama-3.1-405b:free',
  },
  {
    id: 'nvidia-nemotron-70b',
    name: 'Nemotron 70B Instruct',
    provider: 'openrouter-nemotron-70b',
    apiModelId: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
  },
  {
    id: 'kat-coder-pro',
    name: 'KAT-Coder Pro',
    provider: 'openrouter-katcoder-pro',
    apiModelId: 'kwaipilot/kat-coder-pro:free',
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS (120B)',
    provider: 'openrouter-gpt-oss',
    apiModelId: 'openai/gpt-oss-120b:free',
  },
  {
    id: 'tongyi-deepresearch',
    name: 'Tongyi DeepResearch (30B)',
    provider: 'openrouter-tongyi',
    apiModelId: 'alibaba/tongyi-deepresearch-30b-a3b:free',
  },
  {
    id: 'olmo-2-instruct',
    name: 'OLMo 2 Instruct',
    provider: 'openrouter-olmo',
    apiModelId: 'allenai/olmo-2-0325-32b-instruct:free',
  },
  {
    id: 'mimo-v2-flash',
    name: 'Xiaomi Mimo V2 Flash',
    provider: 'openrouter-mimo',
    apiModelId: 'xiaomi/mimo-v2-flash:free',
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT-OSS (20B)',
    provider: 'openrouter-gpt-oss-20b',
    apiModelId: 'openai/gpt-oss-20b:free',
  },
];

export const LLM_MODEL_LOOKUP: { [id: string]: LlmModelOption } = LLM_MODEL_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.id]: option }),
  {},
);

export const DEFAULT_CHAT_MODEL = LLM_MODEL_OPTIONS.find(option => option.isDefault) ?? LLM_MODEL_OPTIONS[0];
