
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  divergenceData?: DivergenceData[];
  ghostPatternData?: GhostPatternData;
  optionsStrategy?: OptionsStrategy;
  sources?: Source[];
  isLoading?: boolean;
}

export interface DivergenceData {
  timeframe: string;
  bullish: number;
  bearish: number;
}

export interface GhostPatternData {
  score: number;
  patternType: string;
  correlation: { x: string; y: number }[];
}

export interface OptionsStrategy {
  strategyName: string;
  symbol: string;
  probabilityOfProfit: number;
  expectedMove: string;
  breakevenPoints: string[];
}

export interface Source {
  web: {
    uri: string;
    title: string;
  };
}

export interface PortfolioAllocation {
  symbol: string;
  weight: number;
  thesis: string;
}

export interface PortfolioHoldingSnapshot {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  sector?: string;
  industry?: string;
}

export interface PortfolioReportData {
  summary: string;
  allocations: PortfolioAllocation[];
  riskNotes: string[];
  playbook: string[];
  holdings: PortfolioHoldingSnapshot[];
  generatedAt: string;
  modelUsed?: string;
}

// Cloudflare Worker environment types
export interface Env {
  // AI binding
  AI: Ai;

  // Assets binding for static files
  ASSETS: Fetcher;

  // External API keys (secrets)
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  OPENROUTER_QWEN3_CODER_API_KEY?: string;
  OPENROUTER_DEEPSEEK_R1T2_API_KEY?: string;
  OPENROUTER_DEEPSEEK_CHAT_API_KEY?: string;
  OPENROUTER_MINIMAX_M2_API_KEY?: string;
  OPENROUTER_GLM_45_AIR_API_KEY?: string;
  OPENROUTER_QWEN3_235B_API_KEY?: string;

  // New OpenRouter models (free tier)
  OPENROUTER_OLMO_THINK_API_KEY?: string;
  OPENROUTER_NEMOTRON_NANO_API_KEY?: string;
  OPENROUTER_DEEPSEEK_NEX_API_KEY?: string;
  OPENROUTER_KATCODER_PRO_API_KEY?: string;
  OPENROUTER_GPT_OSS_API_KEY?: string;

  // Stock API keys
  ALPHA_VANTAGE_API_KEY?: string;
  FINNHUB_API_KEY?: string;
  IEXCLOUD_API_KEY?: string;

  // Environment variables
  APP_NAME: string;
  APP_VERSION: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  CACHE_TTL: string;
  DEFAULT_STOCK_PROVIDER: string;
  STOCK_API_TIMEOUT: string;

  // KV Namespaces
  STOCK_CACHE_KV: KVNamespace;
  USER_SESSIONS_KV: KVNamespace;

  // D1 Database
  DB: D1Database;

  // R2 Storage
  STORAGE: R2Bucket;

  // Queue
  STOCK_DATA_QUEUE: Queue<unknown>;

  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset;
}
