
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { DivergenceData, GhostPatternData, OptionsStrategy } from '../types';

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

export const isGeminiConfigured = (): boolean => loadClient() !== null;

const ensureClient = (): GoogleGenAI => {
  const client = loadClient();
  if (!client) {
    throw new Error("Gemini API key is not configured");
  }

  return client;
};

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
};

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
