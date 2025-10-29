/**
 * AI Router - Routes different tasks to the most appropriate AI provider
 */

export type TaskType =
  | 'chat'              // General conversation - uses Minimax
  | 'tool-generation'   // Creating new tools - uses Qwen Coder
  | 'stock-analysis'    // Stock/options analysis - uses Gemini/Claude
  | 'image-analysis'    // Image analysis - uses Gemini/OpenAI/Claude
  | 'web-search'        // Grounded search - uses Gemini
  | 'code-execution';   // Code generation/execution - uses Qwen Coder

export type AIProvider =
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'openrouter-qwen3-coder'
  | 'openrouter-deepseek-r1t2'
  | 'openrouter-deepseek-chat'
  | 'openrouter-minimax-m2'
  | 'openrouter-glm-45-air'
  | 'openrouter-qwen3-235b'
  | 'workers-ai';

/**
 * Task routing configuration
 * Maps task types to their preferred AI providers in priority order
 */
const TASK_ROUTING: Record<TaskType, AIProvider[]> = {
  // Chat uses Minimax exclusively
  'chat': [
    'openrouter-minimax-m2',
    'openrouter-deepseek-chat',
    'gemini',
    'openai',
    'claude',
    'workers-ai'
  ],

  // Tool generation uses Qwen Coder exclusively
  'tool-generation': [
    'openrouter-qwen3-coder',
    'openrouter-deepseek-r1t2',
    'gemini',
    'claude',
    'openai'
  ],

  // Stock analysis uses powerful reasoning models
  'stock-analysis': [
    'gemini',
    'claude',
    'openai',
    'openrouter-deepseek-chat',
    'openrouter-qwen3-235b',
    'workers-ai'
  ],

  // Image analysis uses vision-capable models
  'image-analysis': [
    'gemini',
    'openai',
    'claude',
    'workers-ai'
  ],

  // Web search uses Gemini (has grounding support)
  'web-search': [
    'gemini',
    'openrouter-deepseek-chat',
    'openai',
    'claude',
    'workers-ai'
  ],

  // Code execution uses Qwen Coder
  'code-execution': [
    'openrouter-qwen3-coder',
    'openrouter-deepseek-r1t2',
    'claude',
    'openai'
  ]
};

/**
 * Detects if a chat message is requesting a new tool
 */
export function isToolGenerationRequest(message: string): boolean {
  const toolKeywords = [
    'create a tool',
    'make a tool',
    'build a tool',
    'new tool',
    'add a feature',
    'create a feature',
    'build a feature',
    'add a widget',
    'create a widget',
    'make a widget',
    'new widget',
    'i need a tool',
    'can you make',
    'can you create',
    'can you build',
    'generate a tool'
  ];

  const lowerMessage = message.toLowerCase();
  return toolKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Gets the preferred provider for a specific task
 * Returns the first available provider from the task's priority list
 */
export function getProviderForTask(
  taskType: TaskType,
  availableProviders: Set<AIProvider>
): AIProvider | null {
  const preferredProviders = TASK_ROUTING[taskType];

  for (const provider of preferredProviders) {
    if (availableProviders.has(provider)) {
      return provider;
    }
  }

  return null;
}

/**
 * Determines task type from context
 */
export function determineTaskType(context: {
  endpoint?: string;
  message?: string;
  hasImage?: boolean;
}): TaskType {
  if (context.endpoint === '/api/analyze') {
    return 'stock-analysis';
  }

  if (context.endpoint === '/api/search') {
    return 'web-search';
  }

  if (context.endpoint === '/api/analyze-image' || context.hasImage) {
    return 'image-analysis';
  }

  if (context.endpoint === '/api/generate-tool') {
    return 'tool-generation';
  }

  if (context.message && isToolGenerationRequest(context.message)) {
    return 'tool-generation';
  }

  // Default to chat
  return 'chat';
}

/**
 * Gets display name for a provider
 */
export function getProviderDisplayName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    'gemini': 'Gemini Pro',
    'openai': 'GPT-3.5 Turbo',
    'claude': 'Claude 3.5 Sonnet',
    'openrouter-qwen3-coder': 'Qwen 3 Coder',
    'openrouter-deepseek-r1t2': 'DeepSeek R1-T2',
    'openrouter-deepseek-chat': 'DeepSeek Chat',
    'openrouter-minimax-m2': 'Minimax M2',
    'openrouter-glm-45-air': 'GLM 4.5 Air',
    'openrouter-qwen3-235b': 'Qwen 3 235B',
    'workers-ai': 'Llama 3 (Workers AI)'
  };
  return names[provider] || provider;
}
