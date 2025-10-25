
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
