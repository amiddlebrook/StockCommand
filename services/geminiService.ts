import type {
  DivergenceData,
  GhostPatternData,
  OptionsStrategy,
  PortfolioAllocation,
  PortfolioReportData,
} from '../types';

type WidgetKind = 'divergence' | 'ghost' | 'options' | 'profile' | 'news' | 'comparison' | 'error' | 'portfolio';

export type AnalysisWidget = {
  id: string;
  type: WidgetKind;
  title: string;
  data: any;
};


const DIVERGENCE_DEMO: DivergenceData[] = [
  { timeframe: '1H', bullish: 5, bearish: 2 },
  { timeframe: '4H', bullish: 8, bearish: 6 },
  { timeframe: '1D', bullish: 12, bearish: 10 },
  { timeframe: '1W', bullish: 15, bearish: 5 },
];

const GHOST_DEMO: GhostPatternData = {
  score: 0.87,
  patternType: 'Inverse Index Correlation',
  correlation: [
    { x: 'Day 1', y: 100 },
    { x: 'Day 2', y: 102 },
    { x: 'Day 3', y: 101 },
    { x: 'Day 4', y: 105 },
    { x: 'Day 5', y: 103 },
    { x: 'Day 6', y: 108 },
    { x: 'Day 7', y: 110 },
    { x: 'Day 8', y: 109 },
    { x: 'Day 9', y: 112 },
    { x: 'Day 10', y: 115 },
  ],
};

const OPTIONS_DEMO: OptionsStrategy = {
  strategyName: 'Bull Call Spread',
  symbol: 'TSLA',
  probabilityOfProfit: 0.64,
  expectedMove: '+4.20%',
  breakevenPoints: ['$250.00', '$265.00'],
};

export const isApiAvailable = (): boolean => {
  // In a proxy-based setup, the frontend assumes the API is always available.
  // The worker will handle API key management.
  return true;
};

type RequestOptions = {
  model?: string;
};

const getModelPayload = (options?: RequestOptions) => {
  if (options?.model && typeof options.model === 'string') {
    return { model: options.model };
  }
  return {};
};

export const analyzeStockData = async (prompt: string, options?: RequestOptions): Promise<any> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...getModelPayload(options) }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze stock data.');
  }

  return response.json();
};

export const searchWithGrounding = async (prompt: string, options?: RequestOptions): Promise<any> => {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...getModelPayload(options) }),
  });

  if (!response.ok) {
    throw new Error('Failed to search with grounding.');
  }

  return response.json();
};

export const analyzeImage = async (prompt: string, image: File, options?: RequestOptions): Promise<any> => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('image', image);
  if (options?.model) {
    formData.append('model', options.model);
  }

  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image.');
  }

  return response.json();
};

export const sendMessage = async (message: string, history: any[], context?: Record<string, any>): Promise<any> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as any;
    throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

export const generatePortfolioReport = async (tickers: string[], goal: string): Promise<PortfolioReportData> => {
  const response = await fetch('/api/portfolio/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers, goal }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate portfolio report.');
  }

  return response.json();
};

export const createOfflineWidget = (featureType: string, symbol: string): AnalysisWidget => {
  const idSuffix = `${symbol}-${Date.now()}`;

  switch (featureType) {
    case 'Divergence Analysis':
      return {
        id: `offline-divergence-${idSuffix}`,
        type: 'divergence',
        title: `Divergence: ${symbol}`,
        data: DIVERGENCE_DEMO.map(point => ({ ...point })),
      };
    case 'Ghost Pattern':
      return {
        id: `offline-ghost-${idSuffix}`,
        type: 'ghost',
        title: `Ghost Pattern: ${symbol}`,
        data: { ...GHOST_DEMO },
      };
    case 'Options Strategy':
      return {
        id: `offline-options-${idSuffix}`,
        type: 'options',
        title: `Options Strategy: ${symbol}`,
        data: { ...OPTIONS_DEMO, symbol },
      };
    default:
      return {
        id: `offline-generic-${idSuffix}`,
        type: 'profile',
        title: `Offline Preview: ${featureType}`,
        data: { text: `This tool is in offline mode.`, sources: [] },
      };
  }
};

