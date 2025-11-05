import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Toolbox } from './components/Toolbox';
import { TextWidget } from './components/TextWidget';
import { StockDivergenceChart } from './components/StockDivergenceChart';
import { GhostPatternChart } from './components/GhostPatternChart';
import { OptionsStrategyCard } from './components/OptionsStrategyCard';
import { Icon } from './components/Icon';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MobileNav } from './components/MobileNav';
import { ModelSelector } from './components/ModelSelector';
import type { ChatMessage as ChatMessageType, Source } from './types';
import {
  analyzeImage,
  analyzeStockData,
  createOfflineWidget,
  isApiAvailable,
  searchWithGrounding,
  sendMessage,
  getOfflineDashboardSeed,
  type AnalysisWidget,
} from './services/geminiService';
import { DEFAULT_CHAT_MODEL } from './lib/constants/llmModels';

type MobileView = 'toolbox' | 'dashboard' | 'chat';

type FeaturePromptMap = { [feature: string]: string };

const WELCOME_MESSAGE =
  "Welcome! I've preloaded some analysis in the dashboard. Use the toolbox for more or ask me a question.";

const FEATURE_PROMPTS: FeaturePromptMap = {
  'Divergence Analysis': 'Run a stock divergence analysis for SYMBOL.',
  'Ghost Pattern': 'Detect ghost patterns for SYMBOL.',
  'Options Strategy': 'Suggest an options strategy for SYMBOL.',
  'Financial News': 'Get the latest financial news for SYMBOL.',
  'Company Profile': 'Provide a detailed company profile for SYMBOL.',
  'Peer Comparison': 'Provide a peer comparison for SYMBOL.',
  'Sentiment Analysis': 'Provide a sentiment analysis for SYMBOL based on recent news and social media.',
  'Technical Indicators': 'Calculate key technical indicators (like RSI, MACD, Bollinger Bands) for SYMBOL.',
  'Earnings Analysis': 'Analyze the latest earnings report for SYMBOL.',
  'Market Overview': 'Provide a general market overview and how SYMBOL fits into the current landscape.',
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: WELCOME_MESSAGE,
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [widgets, setWidgets] = useState<AnalysisWidget[]>(() => getOfflineDashboardSeed());
  const [mobileView, setMobileView] = useState<MobileView>('toolbox');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (isCancelled) {
          return;
        }

        const maybeModels = Array.isArray(data?.models)
          ? (data.models as LlmModelOption[])
          : undefined;

        if (maybeModels) {
          setModelOptions(maybeModels);
        }

        if (typeof data?.defaultModel === 'string') {
          const defaultModel = data.defaultModel as string;
          setSelectedModel(current => {
            if (current === defaultModel) {
              return current;
            }
            const isCurrentAvailable = maybeModels?.some(option => option.id === current);
            return isCurrentAvailable ? current : defaultModel;
          });
        }
      } catch (error) {
        console.error('Failed to load configured models:', error);
      }
    };

    fetchModels();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chatContainerRef.current) {
      return;
    }
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const renderWidget = (widget: AnalysisWidget) => {
    switch (widget.type) {
      case 'divergence':
        return <StockDivergenceChart id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'ghost':
        return <GhostPatternChart id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'options':
        return <OptionsStrategyCard id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'profile':
      case 'news':
      case 'comparison':
      case 'error':
      default:
        return (
          <TextWidget
            id={widget.id}
            title={widget.title}
            text={widget.data?.text ?? ''}
            sources={widget.data?.sources}
            onRemove={removeWidget}
          />
        );
    }
  };

  const handleAnalysisRequest = async (featureType: string, rawSymbol: string) => {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) {
      return;
    }

    setIsDashboardLoading(true);
    setMobileView('dashboard');

    const promptTemplate = FEATURE_PROMPTS[featureType] ?? `Provide a ${featureType} for SYMBOL.`;
    const prompt = promptTemplate.replace(/SYMBOL/g, symbol);
    const widgetId = `${featureType}-${symbol}-${Date.now()}`;

    try {
      if (['Divergence Analysis', 'Ghost Pattern', 'Options Strategy'].includes(featureType)) {
        const response = await analyzeStockData(prompt, { model: selectedModel });
        const responseText = response.response ?? '';

        let jsonData: any;
        try {
          jsonData = responseText ? JSON.parse(responseText) : undefined;
        } catch (error) {
          console.error('Failed to parse analysis response:', error);
        }

        if (featureType === 'Divergence Analysis' && jsonData?.divergenceData) {
          const widget: AnalysisWidget = {
            id: widgetId,
            type: 'divergence',
            title: `Divergence: ${symbol}`,
            data: jsonData.divergenceData,
          };
          setWidgets(prev => [widget, ...prev]);
          return;
        }

        if (featureType === 'Ghost Pattern' && jsonData?.ghostPatternData) {
          const widget: AnalysisWidget = {
            id: widgetId,
            type: 'ghost',
            title: `Ghost Pattern: ${symbol}`,
            data: jsonData.ghostPatternData,
          };
          setWidgets(prev => [widget, ...prev]);
          return;
        }

        if (featureType === 'Options Strategy' && jsonData?.optionsStrategy) {
          const widget: AnalysisWidget = {
            id: widgetId,
            type: 'options',
            title: `Options Strategy: ${symbol}`,
            data: jsonData.optionsStrategy,
          };
          setWidgets(prev => [widget, ...prev]);
          return;
        }

        if (jsonData?.analysisSummary) {
          const widget: AnalysisWidget = {
            id: widgetId,
            type: 'profile',
            title: `${featureType}: ${symbol}`,
            data: { text: jsonData.analysisSummary, sources: [] },
          };
          setWidgets(prev => [widget, ...prev]);
          return;
        }

        throw new Error('No data returned from analysis.');
      }

      const response = await searchWithGrounding(prompt, { model: selectedModel });
      const text = response.response ?? '';
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as Source[] | undefined;

      const widget: AnalysisWidget = {
        id: widgetId,
        type: 'profile',
        title: `${featureType}: ${symbol}`,
        data: { text: text || 'No information available at the moment.', sources },
      };
      setWidgets(prev => [widget, ...prev]);
    } catch (error) {
      console.error(`Error during ${featureType} analysis:`, error);
      const fallbackWidget = {
        id: `${widgetId}-error`,
        type: 'error' as const,
        title: `Error: ${featureType} for ${symbol}`,
        data: { text: 'Failed to generate analysis. Please try again.', sources: [] },
      };
      setWidgets(prev => [fallbackWidget, ...prev]);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const handleSendMessage = async (message: string, image?: File) => {
    if (!message.trim() && !image) {
      return;
    }

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    };

    const modelMessageId = `model-${Date.now() + 1}`;
    const loadingMessage: ChatMessageType = {
      id: modelMessageId,
      role: 'model',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsChatLoading(true);

    try {
      let responseText = '';
      let sources: Source[] | undefined;

      if (image) {
        const response = await analyzeImage(message || 'Analyze this image.', image, { model: selectedModel });
        responseText = response.response ?? '';
      } else {
        const history = messages
          .filter(m => (m.role === 'user' || m.role === 'model') && !m.isLoading)
          .map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }],
          }));

        const response = await sendMessage(message, history, { model: selectedModel });
        responseText = response.response ?? '';
      }

      const newBotMessage: ChatMessageType = {
        id: modelMessageId,
        role: 'model',
        content: responseText || "Sorry, I couldn't process that request.",
        sources,
        isLoading: false,
      };

      setMessages(prev => prev.map(msg => (msg.id === modelMessageId ? newBotMessage : msg)));
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage: ChatMessageType = {
        id: modelMessageId,
        role: 'model',
        content: 'An error occurred. Please try again.',
        isLoading: false,
      };
      setMessages(prev => prev.map(msg => (msg.id === modelMessageId ? errorMessage : msg)));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.info('Recorded audio blob', audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 flex flex-col">
      <Header />

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 lg:grid-cols-[280px_minmax(0,_1fr)_380px] overflow-hidden">

        {/* Toolbox Sidebar */}
        <aside className={`border-r border-slate-800/50 backdrop-blur-sm bg-slate-900/30 md:col-span-3 lg:col-auto ${mobileView === 'toolbox' ? 'block' : 'hidden'} md:block ${isDashboardLoading ? 'opacity-70' : ''}`}>
          <Toolbox onAnalysisRequested={handleAnalysisRequest} isLoading={isDashboardLoading} />
        </aside>

        {/* Dashboard Main Area */}
        <main className={`overflow-y-auto p-4 md:p-8 space-y-6 relative md:col-span-6 lg:col-auto ${mobileView === 'dashboard' ? 'block' : 'hidden'} md:block`}>
          {isDashboardLoading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-4">
                <LoadingSpinner className="w-12 h-12" />
                <p className="text-sm text-cyan-400 animate-pulse">Analyzing...</p>
              </div>
            </div>
          )}

          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                <Icon icon="chart" className="w-20 h-20 text-cyan-400 relative" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200 mb-3 tracking-tight">Analytics Dashboard</h3>
              <p className="max-w-md text-gray-400 text-sm leading-relaxed">
                Your financial analysis widgets will appear here. Select a tool from the toolbox to begin your analysis.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse delay-75" />
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse delay-150" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {widgets.map(widget => (
                <div key={widget.id} className="animate-fadeIn">{renderWidget(widget)}</div>
              ))}
            </div>
          )}
        </main>

        {/* Chat Sidebar */}
        <aside className={`flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm border-l border-slate-800/50 max-h-full md:col-span-3 lg:col-auto ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
          <div className="border-b border-slate-800/50 px-4 py-3 bg-slate-900/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-300 tracking-wider flex items-center gap-2">
                <Icon icon="bot" className="w-4 h-4 text-cyan-400" />
                AI ASSISTANT
              </h2>
              <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />
            </div>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
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

      {/* Mobile Navigation Spacer */}
      <div className="md:hidden h-16" />
      <MobileNav activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
};

export default App;
