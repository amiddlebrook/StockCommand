import React, { useState, useEffect, useRef } from 'react';
import type { Chat, GoogleGenAI } from '@google/genai';
import { Header } from './components/Header';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Toolbox } from './components/Toolbox';
import { TextWidget } from './components/TextWidget';
import { ChatMessage as ChatMessageType, Source } from './types';
import { analyzeStockData, searchWithGrounding, analyzeImage, getGeminiClient, isGeminiConfigured } from './services/geminiService';
import { StockDivergenceChart } from './components/StockDivergenceChart';
import { GhostPatternChart } from './components/GhostPatternChart';
import { OptionsStrategyCard } from './components/OptionsStrategyCard';
import { Icon } from './components/Icon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MobileNav } from './components/MobileNav';

type AnalysisWidget = {
  id: string;
  type: 'divergence' | 'ghost' | 'options' | 'news' | 'profile' | 'comparison' | 'error';
  title: string;
  data: any;
};

const GEMINI_READY_MESSAGE = "Welcome! I've preloaded some analysis in the dashboard. Use the toolbox for more or ask me a question.";
const GEMINI_MISSING_MESSAGE = "Gemini API access isn't configured yet. Add your VITE_API_KEY to enable live analysis and chat features.";

const initialWidgets: AnalysisWidget[] = [
  {
    id: 'init-divergence-tsla',
    type: 'divergence',
    title: 'Divergence: TSLA',
    data: [
      { timeframe: '1H', bullish: 5, bearish: 2 },
      { timeframe: '4H', bullish: 8, bearish: 6 },
      { timeframe: '1D', bullish: 12, bearish: 10 },
      { timeframe: '1W', bullish: 15, bearish: 5 },
    ]
  },
  {
    id: 'init-ghost-nvda',
    type: 'ghost',
    title: 'Ghost Pattern: NVDA',
    data: {
      score: 0.87,
      patternType: 'Inverse Index Correlation',
      correlation: [
        { x: 'Day 1', y: 100 }, { x: 'Day 2', y: 102 }, { x: 'Day 3', y: 101 }, { x: 'Day 4', y: 105 },
        { x: 'Day 5', y: 103 }, { x: 'Day 6', y: 108 }, { x: 'Day 7', y: 110 }, { x: 'Day 8', y: 109 },
        { x: 'Day 9', y: 112 }, { x: 'Day 10', y: 115 },
      ]
    }
  },
  {
      id: 'init-news-market',
      type: 'profile',
      title: 'Recent Market Overview',
      data: {
          text: `**Global Markets Rally on Positive Inflation Data**\n\nMajor global indices saw significant gains this week as new inflation reports from the US and Europe came in lower than expected. The S&P 500 is up 2.5% on the week, while the STOXX 600 has climbed 1.8%. This has eased fears of further aggressive interest rate hikes from central banks.\n\n**Tech Sector Leads the Charge**\n\nThe technology sector was a primary driver of the rally, with semiconductor stocks like NVDA and AMD posting strong performance. The positive sentiment is fueled by hopes that a more stable economic environment will boost consumer and enterprise spending.`,
          sources: []
      }
  }
];

const App: React.FC = () => {
  const geminiClientRef = useRef<GoogleGenAI | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const [geminiReady, setGeminiReady] = useState(() => isGeminiConfigured());

  useEffect(() => {
    const ready = isGeminiConfigured();
    setGeminiReady(ready);
  }, []);

  useEffect(() => {
    if (!geminiReady) {
      geminiClientRef.current = null;
      chatSessionRef.current = null;
      return;
    }

    const client = getGeminiClient();
    if (!client) {
      setGeminiReady(false);
      return;
    }

    geminiClientRef.current = client;

    if (ready && !geminiClientRef.current) {
      geminiClientRef.current = getGeminiClient();
    }
  }, []);

  useEffect(() => {
    if (geminiReady && !geminiClientRef.current) {
      geminiClientRef.current = getGeminiClient();
    }
  }, [geminiReady]);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'init',
      role: 'model',
      content: geminiReady ? GEMINI_READY_MESSAGE : GEMINI_MISSING_MESSAGE,
      content: geminiReady
        ? "Welcome! I've preloaded some analysis in the dashboard. Use the toolbox for more or ask me a question."
        : "Gemini API access isn't configured yet. Add your VITE_API_KEY to enable live analysis and chat features.",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [widgets, setWidgets] = useState<AnalysisWidget[]>(initialWidgets);
  const [mobileView, setMobileView] = useState<'toolbox' | 'dashboard' | 'chat'>('toolbox');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) {
        return prev;
      }

      const [first, ...rest] = prev;
      if (first.id !== 'init') {
        return prev;
      }

      const desiredContent = geminiReady ? GEMINI_READY_MESSAGE : GEMINI_MISSING_MESSAGE;
      if (first.content === desiredContent) {
        return prev;
      }

      return [{ ...first, content: desiredContent }, ...rest];
    });
  }, [geminiReady]);

  const ensureGeminiClient = () => {
    let ready = geminiReady;

    if (!ready) {
      ready = isGeminiConfigured();
      if (!ready) {
        return null;
      }
      setGeminiReady(true);
    }

    if (!geminiClientRef.current) {
      const client = getGeminiClient();
      if (!client) {
        setGeminiReady(false);
        return null;
      }
      geminiClientRef.current = client;
    }

    return geminiClientRef.current;
  };

  const ensureGeminiClient = () => {
    const existing = geminiClientRef.current;
    if (existing) {
      return existing;
    }

    const next = getGeminiClient();
    geminiClientRef.current = next;

    if (next && !geminiReady) {
      setGeminiReady(true);
    }

    return next;
  };

  useEffect(() => {
    if (!geminiReady) {
      geminiClientRef.current = null;
      chatSessionRef.current = null;
    }
  }, [geminiReady]);

  const ensureGeminiClient = () => {
    if (!geminiReady) {
      const readyNow = isGeminiConfigured();
      setGeminiReady(readyNow);
      if (!readyNow) {
        return null;
      }
    }

    if (!geminiClientRef.current) {
      geminiClientRef.current = getGeminiClient();
    }

    if (!geminiClientRef.current) {
      if (geminiReady) {
        setGeminiReady(false);
      }
      return null;
    }

    if (!geminiReady) {
      setGeminiReady(true);
    }

    return geminiClientRef.current;
  };

  useEffect(() => {
    if (!geminiReady) {
      geminiClientRef.current = null;
      chatSessionRef.current = null;
    }
  }, [geminiReady]);

  const ensureGeminiClient = () => {
    if (!geminiReady) {
      const readyNow = isGeminiConfigured();
      setGeminiReady(readyNow);
      if (!readyNow) {
        return null;
      }
    }

    if (!geminiClientRef.current) {
      geminiClientRef.current = getGeminiClient();
    }

    if (!geminiClientRef.current) {
      if (geminiReady) {
        setGeminiReady(false);
      }
      return null;
    }

    if (!geminiReady) {
      setGeminiReady(true);
    }

    return geminiClientRef.current;
  };

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleAnalysisRequest = async (featureType: string, symbol: string) => {
    setIsDashboardLoading(true);
    setMobileView('dashboard');
    let newWidget: AnalysisWidget | null = null;
    const widgetId = `${featureType}-${symbol}-${Date.now()}`;

    try {
      const client = ensureGeminiClient();
      if (!client) {
        throw new Error('Gemini API key is not configured');
      }

      const promptMap: { [key: string]: string } = {
            'Divergence Analysis': `Run a stock divergence analysis for ${symbol}.`,
            'Ghost Pattern': `Detect ghost patterns for ${symbol}.`,
            'Options Strategy': `Suggest an options strategy for ${symbol}.`,
            'Financial News': `Get the latest financial news for ${symbol}.`,
            'Company Profile': `Provide a detailed company profile for ${symbol}.`,
            'Peer Comparison': `Provide a peer comparison for ${symbol}.`,
            'Sentiment Analysis': `Provide a sentiment analysis for ${symbol} based on recent news and social media.`,
            'Technical Indicators': `Calculate key technical indicators (like RSI, MACD, Bollinger Bands) for ${symbol}.`,
            'Earnings Analysis': `Analyze the latest earnings report for ${symbol}.`,
            'Market Overview': `Provide a general market overview and how ${symbol} fits into the current landscape.`
        };

        const prompt = promptMap[featureType];
        
        if (['Divergence Analysis', 'Ghost Pattern', 'Options Strategy'].includes(featureType)) {
            const response = await analyzeStockData(prompt);
            const jsonData = JSON.parse(response.text);
            if (featureType === 'Divergence Analysis' && jsonData.divergenceData) {
                newWidget = { id: widgetId, type: 'divergence', title: `Divergence: ${symbol}`, data: jsonData.divergenceData };
            } else if (featureType === 'Ghost Pattern' && jsonData.ghostPatternData) {
                newWidget = { id: widgetId, type: 'ghost', title: `Ghost Pattern: ${symbol}`, data: jsonData.ghostPatternData };
            } else if (featureType === 'Options Strategy' && jsonData.optionsStrategy) {
                newWidget = { id: widgetId, type: 'options', title: `Options Strategy: ${symbol}`, data: jsonData.optionsStrategy };
            }
        } else {
            const response = await searchWithGrounding(prompt);
            newWidget = { id: widgetId, type: 'profile', title: `${featureType}: ${symbol}`, data: { text: response.text, sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks } };
        }

        if (newWidget) {
            setWidgets(prev => [newWidget, ...prev]);
        } else {
             throw new Error("No data returned from analysis.");
        }

    } catch (error) {
        console.error(`Error during ${featureType} analysis:`, error);
        const message =
          error instanceof Error && error.message.includes('API key')
            ? 'Gemini API access is not configured. Add your VITE_API_KEY to enable this feature.'
            : 'Failed to generate analysis. Please try again.';
        newWidget = { id: widgetId, type: 'error', title: `Error: ${featureType} for ${symbol}`, data: { text: message } };
        setWidgets(prev => [newWidget, ...prev]);
    } finally {
        setIsDashboardLoading(false);
    }
  };

  const handleSendMessage = async (message: string, image?: File) => {
    if (!message.trim() && !image) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    };

    setIsChatLoading(true);

    const modelResponseId = (Date.now() + 1).toString();
    const loadingMessage: ChatMessageType = {
      id: modelResponseId,
      role: 'model',
      content: '',
      isLoading: true,
    };
    
    // Add user message and loading placeholder to the UI
    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      let responseText = '';
      let sources: Source[] | undefined;

      if (image) {
        const prompt = message || "Analyze this image.";
        const response = await analyzeImage(prompt, image);
        responseText = response.text;
      } else {
        const client = ensureGeminiClient();
        if (!client) {
          throw new Error('Gemini API key is not configured');
        }

        if (!chatSessionRef.current) {
          const historyForAPI = messages
            .filter(m => (m.role === 'user' || m.role === 'model') && !m.isLoading)
            .map(m => ({
              role: m.role as 'user' | 'model',
              parts: [{ text: m.content }],
            }));

          chatSessionRef.current = client.chats.create({
            model: 'gemini-2.5-flash',
            history: historyForAPI,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
        }
        const stream = await chatSessionRef.current.sendMessageStream({ message: message });
        for await (const chunk of stream) {
            responseText += chunk.text;
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                sources = chunk.candidates[0].groundingMetadata.groundingChunks as Source[];
            }
            setMessages(prev => prev.map(msg => 
                msg.id === modelResponseId 
                ? { ...msg, content: responseText, isLoading: true, sources: sources } 
                : msg
            ));
        }
      }

      const newBotMessage: ChatMessageType = {
        id: modelResponseId,
        role: 'model',
        content: responseText || "Sorry, I couldn't process that request.",
        sources: sources,
        isLoading: false,
      };

      setMessages(prev => prev.map(msg => 
          msg.id === modelResponseId ? newBotMessage : msg
      ));

    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage: ChatMessageType = {
        id: modelResponseId,
        role: 'model',
        content:
          error instanceof Error && error.message.includes('API key')
            ? 'Gemini API access is not configured. Add your VITE_API_KEY to enable chat and analysis features.'
            : 'An error occurred. Please check the console.',
        isLoading: false,
      };
       setMessages(prev => prev.map(msg => 
          msg.id === modelResponseId ? errorMessage : msg
      ));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleStartRecording = async () => { /* Unchanged */ };
  const handleStopRecording = () => { /* Unchanged */ };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }

  const renderWidget = (widget: AnalysisWidget) => {
    const props = { id: widget.id, onRemove: removeWidget };
    switch (widget.type) {
        case 'divergence':
            return <StockDivergenceChart data={widget.data} {...props} />;
        case 'ghost':
            return <GhostPatternChart data={widget.data} {...props} />;
        case 'options':
            return <OptionsStrategyCard data={widget.data} {...props} />;
        case 'profile':
        case 'news':
        case 'comparison':
        case 'error':
             return <TextWidget title={widget.title} text={widget.data.text} sources={widget.data.sources} {...props} />;
        default:
            return null;
    }
  };


  return (
    <div className="flex flex-col h-screen bg-black text-gray-200 font-mono">
      <Header />
      <div className="flex-1 md:grid md:grid-cols-12">
        
        <div className={`border-r border-gray-800 overflow-y-auto md:col-span-3 xl:col-span-2 ${mobileView === 'toolbox' ? 'block' : 'hidden'} md:block`}>
            <Toolbox onAnalysisRequested={handleAnalysisRequest} isLoading={isDashboardLoading} />
        </div>

        <main className={`overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 relative md:col-span-6 xl:col-span-7 ${mobileView === 'dashboard' ? 'block' : 'hidden'} md:block`}>
            {isDashboardLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                    <LoadingSpinner className="w-10 h-10" />
                </div>
            )}
            {widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center p-4">
                   <Icon icon="chart" className="w-16 h-16 mb-4" />
                   <h3 className="text-xl font-semibold text-gray-400">DASHBOARD</h3>
                   <p className="max-w-md mt-2 text-sm">
                     Your financial analysis widgets will appear here. Select a tool from the toolbox to begin.
                   </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                    {widgets.map((widget) => (
                        <div key={widget.id}>{renderWidget(widget)}</div>
                    ))}
                </div>
            )}
        </main>

        <aside className={`flex flex-col bg-[#0D0D0D] border-l border-gray-800 max-h-full md:col-span-3 xl:col-span-3 ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
            </div>
            <ChatInput 
                onSendMessage={handleSendMessage} 
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                isRecording={isRecording}
                isLoading={isChatLoading} 
            />
        </aside>
      </div>
      <MobileNav activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
};

export default App;
