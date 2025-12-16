export type SleeveName =
  | 'Core Tech'
  | 'Rotatable Tech'
  | 'Specialized: Energy'
  | 'Specialized: AI Infra'
  | 'Specialized: Insurance'
  | 'Specialized: Defense'
  | 'Specialized: Utilities/Water'
  | 'Specialized: Royalties'
  | 'Specialized: Health Services'
  | 'Specialized: Biotech'
  | 'Specialized: Digital Rails'
  | 'Specialized: Art'
  | 'Physical Precious Metals'
  | 'USD Cash'
  | 'Options'
  | 'Macro';

export interface MarketClock {
  label: string;
  status: 'green' | 'yellow' | 'red' | 'gray';
  code: string;
  reason?: string;
  lastUpdated?: number;
}

export interface Ticker {
  symbol: string;
  name?: string;
  sleeve: SleeveName;
  role: string;
  weight?: number; // Target weight or current weight
}

export interface MarketData {
  price: number;
  changePercent: number;
  volume: number;
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  dailyClose?: number[]; // For chart pattern analysis
  technicalSignal?: string; // "Buy", "Sell", "Neutral" (simple heuristic)
}

export interface AgentAction {
  type: 'BUY' | 'SELL' | 'HOLD' | 'TRIM' | 'ALERT' | 'REPORT';
  ticker?: string;
  sleeve?: SleeveName;
  reason: string;
  quantity?: number;
  confidence: number;
}

export interface RotationRule {
  id: string;
  description: string;
  condition: (data: Record<string, MarketData>, context: any) => boolean;
  action: AgentAction;
}

export interface PortfolioState {
  cashBalance: number;
  holdings: Record<string, { quantity: number; costBasis: number }>;
  lastUpdated: string;
}

// System 2: Strategy Forge Types
export type TriggerMetric = 'PRICE' | 'RSI' | 'VIX' | 'CHANGE_PCT' | 'DEFCON' | 'MA_50' | 'MA_200';
export type TriggerOperator = '>' | '<' | '=' | 'CROSSES_ABOVE' | 'CROSSES_BELOW';
export type ActionType = 'ALERT' | 'BUY' | 'SELL' | 'REBALANCE' | 'SCAN';

export interface StrategyTrigger {
  id: string;
  metric: TriggerMetric;
  operator: TriggerOperator;
  value: number;
  symbol?: string; // If specific ticker
}

export interface StrategyAction {
  id: string;
  type: ActionType;
  target: string; // Ticker, Sleeve, or "ALL"
  param?: string; // e.g., "5%" or "High Priority"
}

export interface UserStrategy {
  id: string;
  name: string;
  description?: string;
  triggers: StrategyTrigger[];
  actions: StrategyAction[];
  active: boolean;
  lastExecuted?: number;
  createdAt: number;
}
