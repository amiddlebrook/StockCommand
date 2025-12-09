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
  | 'Options';

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
  // Add more fields as needed for analysis
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
