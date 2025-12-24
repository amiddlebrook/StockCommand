/**
 * StockCommand Artifact Types
 * Production-grade types for two-plane architecture
 */

// =============================================================================
// CLOCK ARTIFACTS (18+ global market indicators)
// =============================================================================

export type ClockStatus = 'green' | 'yellow' | 'red';

export interface ClockArtifact {
  code: string;           // e.g., CLOCK_LIQUIDITY, CLOCK_GEX
  status: ClockStatus;
  reason: string;         // 1-2 sentence explanation
  confidence: number;     // 0.0-1.0
  sources: string[];      // URLs used
  tsBucket: number;       // Epoch ms of bucket
  createdAt: number;
}

export const CLOCK_DEFINITIONS: Record<string, { label: string; query: string; category: string }> = {
  // FINANCIAL / SYSTEMIC
  CLOCK_LIQUIDITY: { label: 'Global Liquidity', query: 'Federal Reserve balance sheet M2 global liquidity current', category: 'FINANCIAL' },
  CLOCK_REAL_YIELDS: { label: 'US 10Y Real Yields', query: 'US 10 year real yields TIPS breakeven current', category: 'FINANCIAL' },
  CLOCK_CREDIT_SPREADS: { label: 'Credit Spreads', query: 'High yield credit spreads HYG investment grade current', category: 'FINANCIAL' },
  CLOCK_DXY: { label: 'Dollar Index', query: 'DXY US dollar index strength current trend', category: 'FINANCIAL' },
  CLOCK_MOVE: { label: 'Bond Volatility', query: 'MOVE index bond volatility treasury current', category: 'FINANCIAL' },
  
  // MARKET STRUCTURE
  CLOCK_GEX: { label: 'Gamma Exposure', query: 'SPX gamma exposure GEX dealer positioning current', category: 'MARKETS' },
  CLOCK_DPI: { label: 'Dark Pool Index', query: 'Dark pool activity DIX GEX stock market current', category: 'MARKETS' },
  CLOCK_COMMODITIES: { label: 'Commodities', query: 'Commodity index CRB DBC oil copper current', category: 'MARKETS' },
  CLOCK_BTC: { label: 'Bitcoin Flows', query: 'Bitcoin whale accumulation exchange flows current', category: 'MARKETS' },
  
  // SENTIMENT
  CLOCK_VIX: { label: 'VIX Term Structure', query: 'VIX futures term structure contango backwardation current', category: 'SENTIMENT' },
  CLOCK_PUTCALL: { label: 'Put/Call Ratio', query: 'Equity put call ratio CBOE sentiment current', category: 'SENTIMENT' },
  CLOCK_INSIDER: { label: 'Insider Activity', query: 'Insider buying selling SEC filings current', category: 'SENTIMENT' },
  
  // SECTOR
  CLOCK_SEC_TECH: { label: 'Tech Relative', query: 'XLK technology sector relative strength SPY current', category: 'SECTOR' },
  CLOCK_SEC_ENERGY: { label: 'Energy Relative', query: 'XLE energy sector relative strength current', category: 'SECTOR' },
  CLOCK_SEC_HEALTH: { label: 'Healthcare Relative', query: 'XLV healthcare sector rotation current', category: 'SECTOR' },
  CLOCK_SEC_FIN: { label: 'Financials Relative', query: 'XLF financials sector banks current', category: 'SECTOR' },
  
  // NEWS
  CLOCK_NEWS: { label: 'News Wire', query: 'Stock market breaking news today major movers', category: 'NEWS' },
  CLOCK_EARNINGS: { label: 'Earnings Calendar', query: 'Earnings reports today this week major companies', category: 'NEWS' },
};

// =============================================================================
// TICKER ARTIFACTS (dynamic, user-driven)
// =============================================================================

export interface TickerArtifact {
  ticker: string;
  kind: 'brief' | 'news' | 'quote';
  bullets?: string[];     // For brief
  riskNotes?: string[];   // For brief
  items?: NewsItem[];     // For news
  price?: number;         // For quote
  change?: number;
  changePercent?: number;
  sources: string[];
  tsBucket: number;
  createdAt: number;
}

export interface NewsItem {
  type: 'news' | 'filing' | 'price_move' | 'macro' | 'rumor';
  headline: string;
  details: string;
  sourceUrl: string;
  confidence: number;
}

// =============================================================================
// REFRESH JOBS
// =============================================================================

export type JobStatus = 'idle' | 'queued' | 'running' | 'fresh' | 'error';

export interface RefreshJob {
  id: string;
  entityType: 'clock' | 'ticker' | 'sector';
  entityId: string;
  status: JobStatus;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
  llmCalls: number;
  costEstimate: number;
}

// =============================================================================
// BUCKET CONFIGURATION (Speed-critical)
// =============================================================================

export const BUCKET_CONFIG = {
  clock: { bucketMs: 5 * 60 * 1000, ttlMs: 10 * 60 * 1000 },      // 5min bucket, 10min TTL
  ticker_brief: { bucketMs: 5 * 60 * 1000, ttlMs: 10 * 60 * 1000 },
  ticker_news: { bucketMs: 15 * 60 * 1000, ttlMs: 30 * 60 * 1000 },
  ticker_quote: { bucketMs: 60 * 1000, ttlMs: 2 * 60 * 1000 },     // 1min bucket, 2min TTL
  sector: { bucketMs: 15 * 60 * 1000, ttlMs: 30 * 60 * 1000 },
} as const;

export type BucketType = keyof typeof BUCKET_CONFIG;

// =============================================================================
// CACHE KEYS (Optimized for KV speed)
// =============================================================================

export function clockKey(code: string, bucket: number): string {
  return `clk:${code}:${bucket}`;
}

export function tickerKey(symbol: string, kind: 'brief' | 'news' | 'quote', bucket: number): string {
  return `tkr:${symbol}:${kind}:${bucket}`;
}

export function sectorKey(etf: string, bucket: number): string {
  return `sec:${etf}:${bucket}`;
}

export function getBucket(type: BucketType): number {
  const now = Date.now();
  const { bucketMs } = BUCKET_CONFIG[type];
  return Math.floor(now / bucketMs) * bucketMs;
}

export function isStale(createdAt: number, type: BucketType): boolean {
  const { ttlMs } = BUCKET_CONFIG[type];
  return Date.now() - createdAt > ttlMs;
}
