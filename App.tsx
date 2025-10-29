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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        const response = await analyzeStockData(prompt);
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

      const response = await searchWithGrounding(prompt);
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
      const errorDetails = error instanceof Error ? error.message : 'Unknown error occurred';
      const fallbackWidget = {
        id: `${widgetId}-error`,
        type: 'error' as const,
        title: `Error: ${featureType} for ${symbol}`,
        data: { text: `Failed to generate analysis: ${errorDetails}. Please check your API configuration and try again.`, sources: [] },
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
        const response = await analyzeImage(message || 'Analyze this image.', image);
        responseText = response.response ?? '';
      } else {
        const history = messages
          .filter(m => (m.role === 'user' || m.role === 'model') && !m.isLoading)
          .map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }],
          }));

        const response = await sendMessage(message, history);
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
      const errorDetails = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorMessage: ChatMessageType = {
        id: modelMessageId,
        role: 'model',
        content: `Error: ${errorDetails}. Please try again or check your API configuration.`,
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
    <div className="min-h-screen bg-black text-gray-200 flex flex-col">
      <Header />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 xl:grid-cols-[260px_minmax(0,_1fr)_340px]">
        <aside className={`border-r border-gray-900 hidden md:block md:col-span-3 xl:col-auto ${isDashboardLoading ? 'opacity-70' : ''}`}>
          <Toolbox onAnalysisRequested={handleAnalysisRequest} isLoading={isDashboardLoading} />
        </aside>

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
              {widgets.map(widget => (
                <div key={widget.id}>{renderWidget(widget)}</div>
              ))}
            </div>
          )}
        </main>

        <aside className={`flex flex-col bg-[#0D0D0D] border-l border-gray-800 max-h-full md:col-span-3 xl:col-span-3 ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
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

      <div className="md:hidden h-16" />
      <MobileNav activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
};

export default App;
