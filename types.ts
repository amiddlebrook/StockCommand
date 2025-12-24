
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

  // OpenRouter API key (primary key for all LLM calls)
  OPENROUTER_API_KEY?: string;

  // Legacy OpenRouter keys (deprecated, kept for migration)
  OPENROUTER_DEEPSEEK_NEX_API_KEY?: string;

  // Environment variables
  APP_NAME: string;
  APP_VERSION: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  CACHE_TTL: string;

  // KV Namespaces
  STOCK_CACHE_KV: KVNamespace;
  USER_SESSIONS_KV: KVNamespace;

  // D1 Database
  DB: D1Database;

  // R2 Storage
  STORAGE: R2Bucket;

  // Vectorize for RAG embeddings
  VECTORIZE: VectorizeIndex;

  // Durable Objects for agent swarm coordination
  AGENT_SWARM: DurableObjectNamespace;

  // Durable Object for entity locking (two-plane architecture)
  ENTITY_LOCK: DurableObjectNamespace;

  // Queue
  STOCK_DATA_QUEUE: Queue<unknown>;

  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset;

  // Two-Plane Architecture Model Configuration
  OPENROUTER_MODEL_ROUTER?: string;
  OPENROUTER_MODEL_RENDER?: string;
  OPENROUTER_MODEL_EXTRACT?: string;
  OPENROUTER_API_BASE?: string;
}

