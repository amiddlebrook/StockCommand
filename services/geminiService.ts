import type { DivergenceData, GhostPatternData, OptionsStrategy, Source } from '../types';

export type OfflineWidgetType = 'divergence' | 'ghost' | 'options' | 'profile';

// Resolve the Gemini API key from different environments (Vite, Node, window)
const resolveApiKey = (): string | undefined => {
  const maybeImportMeta = typeof import.meta !== 'undefined' ? (import.meta as ImportMeta) : undefined;
  const fromVite = maybeImportMeta?.env?.VITE_API_KEY;
  if (typeof fromVite === 'string' && fromVite.length > 0) {
    return fromVite;
  }

  if (typeof process !== 'undefined') {
    const fromProcess = process.env?.VITE_API_KEY ?? process.env?.API_KEY;
    if (typeof fromProcess === 'string' && fromProcess.length > 0) {
      return fromProcess;
    }
  }

  const globalKey = (globalThis as { API_KEY?: unknown }).API_KEY;
  if (typeof globalKey === 'string' && globalKey.length > 0) {
    return globalKey;
  }

  return undefined;
};

let cachedClient: GoogleGenAI | null = null;
let missingKeyWarned = false;

const loadClient = (): GoogleGenAI | null => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    if (!missingKeyWarned) {
      console.warn("Gemini API key not found. Set VITE_API_KEY for client builds or API_KEY for server builds.");
      missingKeyWarned = true;
    }

    return null;
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
};

export const getGeminiClient = (): GoogleGenAI | null => loadClient();

export function isGeminiConfigured(): boolean {
  const apiKey = resolveApiKey();
  return typeof apiKey === 'string' && apiKey.length > 0;
}

const ensureClient = (): GoogleGenAI => {
  const client = loadClient();
  if (!client) {
    throw new Error("Gemini API key is not configured");
  }

  return client;
};

export const ai: GoogleGenAI = new Proxy({} as GoogleGenAI, {
  get(_target, prop, receiver) {
    const client = ensureClient();
    const value = Reflect.get(client as Record<PropertyKey, unknown>, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
  has(_target, prop) {
    const client = ensureClient();
    return prop in client;
  },
});

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeStockData = async (prompt: string): Promise<GenerateContentResponse> => {
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        analysisSummary: { type: Type.STRING },
        divergenceData: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timeframe: { type: Type.STRING },
              bullish: { type: Type.NUMBER },
              bearish: { type: Type.NUMBER },
            },
          },
        },
        ghostPatternData: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            patternType: { type: Type.STRING },
            correlation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.STRING },
                  y: { type: Type.NUMBER },
                },
              },
            },
          },
        },
        optionsStrategy: {
          type: Type.OBJECT,
          properties: {
            strategyName: { type: Type.STRING },
            symbol: { type: Type.STRING },
            probabilityOfProfit: { type: Type.NUMBER },
            expectedMove: { type: Type.STRING },
            breakevenPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
          },
        },
      },
    };

  const fullPrompt = `
    You are a world-class financial analyst AI with access to up-to-the-minute market data. Based on the following user request, provide a detailed analysis using the most recent financial information available.
    User request: "${prompt}"
    
    Return your response in the specified JSON format. If a particular analysis (divergence, ghost pattern, options) is not requested, return null for that field.
    For divergenceData, provide data for at least 4 recent timeframes (e.g., 1H, 4H, 1D, 1W).
    For ghostPatternData, provide a correlation series with at least 10 recent data points.
  `;

  try {
    const client = ensureClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-pro",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response;
  } catch (error) {
    console.error("Error in complex analysis:", error);
    throw error;
  }

export const searchWithGrounding = async (prompt: string): Promise<GenerateContentResponse> => {
    try {
        const client = ensureClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Answer the following financial question based on the latest information from the web: "${prompt}"`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        return response;
    } catch (error) {
        console.error("Error in search grounding:", error);
        throw error;
    }
  }

  return undefined;
};

export const analyzeImage = async (prompt: string, image: File): Promise<GenerateContentResponse> => {
    try {
        const imagePart = await fileToGenerativePart(image);
        const client = ensureClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
        });
        return response;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};

const OFFLINE_NEWS_COPY = `**Offline Market Snapshot**\n\n` +
  `While live Gemini analysis is unavailable, here's a curated look at recent macro themes:\n\n` +
  `• Inflation pressures eased across major economies last quarter, supporting risk-on sentiment.\n` +
  `• Cloud, semiconductor, and AI infrastructure names continue to lead gains.\n` +
  `• Energy equities lag as crude prices consolidate following a multi-month rally.\n\n` +
  `Connect Gemini to replace this card with live research powered by the latest filings, transcripts, and news.\n`;

const offlineProfileCopy = (symbol: string) =>
  `**${symbol} (Offline Overview)**\n\n` +
  `You're viewing demo insights. Add a VITE_API_KEY to unlock live fundamentals, earnings recaps, and valuation snapshots.\n\n` +
  `In the meantime, focus on liquidity, recent price structure, and catalyst calendars when researching ${symbol}.`;

const SENTIMENT_COPY = (symbol: string) =>
  `**Offline Sentiment Preview**\n\n${symbol} has shown resilient price action recently. Plug Gemini in to see real-time news sentiment scores, social momentum, and cross-asset signals.`;

const TECHNICAL_COPY = (symbol: string) =>
  `**Offline Technical Snapshot**\n\nRSI is hovering near 52, MACD is crossing upward, and Bollinger Bands are tightening in this demo. Configure Gemini to calculate live indicators for ${symbol}.`;

const EARNINGS_COPY = (symbol: string) =>
  `**Offline Earnings Brief**\n\n${symbol} recently reported double-digit revenue growth with expanding margins in this preview. Add Gemini to pull actual results, surprises, and transcript highlights automatically.`;

export const OFFLINE_CHAT_RESPONSES: readonly string[] = [
  "I'm running in offline preview mode right now. Connect Gemini to chat with the live analyst copilot.",
  "Tip: Add VITE_API_KEY to your worker or .env file. Once Gemini is live you can ask about tickers, macro themes, or upload charts.",
  "You still have access to the toolbox demo widgets—try the Divergence or Options tiles while Gemini is offline.",
];

export const getOfflineChatResponse = (messageIndex: number): string => {
  const normalizedIndex = messageIndex % OFFLINE_CHAT_RESPONSES.length;
  return OFFLINE_CHAT_RESPONSES[normalizedIndex];
};

export const getOfflineImageResponse = (): string =>
  "Image understanding is paused in offline mode. Connect Gemini to unlock chart and document analysis.";

export const createOfflineWidget = (featureType: string, symbol: string): OfflineWidget => {
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
    case 'Financial News':
    case 'Market Overview':
      return {
        id: `offline-news-${idSuffix}`,
        type: 'profile',
        title: `${featureType}: ${symbol}`,
        data: { text: OFFLINE_NEWS_COPY, sources: [] },
      };
    case 'Company Profile':
    case 'Peer Comparison':
      return {
        id: `offline-profile-${idSuffix}`,
        type: 'profile',
        title: `${featureType}: ${symbol}`,
        data: { text: offlineProfileCopy(symbol), sources: [] },
      };
    case 'Sentiment Analysis':
      return {
        id: `offline-sentiment-${idSuffix}`,
        type: 'profile',
        title: `Sentiment Analysis: ${symbol}`,
        data: { text: SENTIMENT_COPY(symbol), sources: [] },
      };
    case 'Technical Indicators':
      return {
        id: `offline-technical-${idSuffix}`,
        type: 'profile',
        title: `Technical Indicators: ${symbol}`,
        data: { text: TECHNICAL_COPY(symbol), sources: [] },
      };
    case 'Earnings Analysis':
      return {
        id: `offline-earnings-${idSuffix}`,
        type: 'profile',
        title: `Earnings Analysis: ${symbol}`,
        data: { text: EARNINGS_COPY(symbol), sources: [] },
      };
    default:
      return {
        id: `offline-generic-${idSuffix}`,
        type: 'profile',
        title: `Offline Preview: ${featureType}`,
        data: { text: `This tool is in offline mode. Configure Gemini to unlock live analysis for ${symbol}.`, sources: [] },
      };
  }
};

export const getOfflineDashboardSeed = (): OfflineWidget[] => [
  {
    id: 'seed-divergence-tsla',
    type: 'divergence',
    title: 'Divergence: TSLA',
    data: DIVERGENCE_DEMO.map(point => ({ ...point, timeframe: point.timeframe })),
  },
  {
    id: 'seed-ghost-nvda',
    type: 'ghost',
    title: 'Ghost Pattern: NVDA',
    data: { ...GHOST_DEMO },
  },
  {
    id: 'seed-news-market',
    type: 'profile',
    title: 'Recent Market Overview',
    data: { text: OFFLINE_NEWS_COPY, sources: [] },
  },
  {
    id: 'seed-options-aapl',
    type: 'options',
    title: 'Options Strategy: AAPL',
    data: { ...OPTIONS_DEMO, symbol: 'AAPL' },
  },
];
