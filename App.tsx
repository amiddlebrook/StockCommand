import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { ChatMessage as ChatMessageType } from './types';
import {
  GEMINI_MISSING_MESSAGE as GEMINI_MISSING_COPY,
  GEMINI_READY_MESSAGE as GEMINI_READY_COPY,
  createOfflineWidget,
  getOfflineChatResponse,
  getOfflineDashboardSeed,
  getOfflineImageResponse,
  isGeminiConfigured,
  type OfflineWidget,
} from './services/geminiService';
import type { DivergenceData, GhostPatternData, OptionsStrategy, Source } from './types';

type MobileView = 'toolbox' | 'dashboard' | 'chat';

const OFFLINE_DEMO_NOTICE =
  'Gemini credentials are optional for this deployment. The experience below uses curated demo data until an API key is wired up.';

const App: React.FC = () => {
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(() => isGeminiConfigured());
  const [widgets, setWidgets] = useState<OfflineWidget[]>(() => getOfflineDashboardSeed());
  const [messages, setMessages] = useState<ChatMessageType[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: isGeminiConfigured()
        ? `${GEMINI_READY_COPY} This hosted preview still serves curated insights until the Gemini client is enabled.`
        : GEMINI_MISSING_COPY,
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('toolbox');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGeminiConfigured(isGeminiConfigured());
  }, []);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const handleAnalysisRequested = (featureType: string, symbol: string) => {
    setIsDashboardLoading(true);
    setTimeout(() => {
      const widget = createOfflineWidget(featureType, symbol || 'DEMO');
      setWidgets(prev => [widget, ...prev]);
      setIsDashboardLoading(false);
      setMobileView('dashboard');
    }, 400);
  };

  const handleSendMessage = (message: string, image?: File) => {
    if (!message.trim() && !image) return;

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
    setMobileView('chat');

    setTimeout(() => {
      setMessages(prev => {
        const nonLoadingModelMessages = prev.filter(msg => msg.role === 'model' && !msg.isLoading);
        const responseText = image
          ? getOfflineImageResponse()
          : getOfflineChatResponse(nonLoadingModelMessages.length);

        return prev.map(msg =>
          msg.id === modelMessageId
            ? {
                id: modelMessageId,
                role: 'model',
                content: responseText,
                isLoading: false,
              }
            : msg,
        );
      });
      setIsChatLoading(false);
    }, 400);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const renderWidget = (widget: OfflineWidget) => {
    switch (widget.type) {
      case 'divergence':
        return (
          <StockDivergenceChart
            key={widget.id}
            id={widget.id}
            data={widget.data as DivergenceData[]}
            onRemove={handleRemoveWidget}
          />
        );
      case 'ghost':
        return (
          <GhostPatternChart
            key={widget.id}
            id={widget.id}
            data={widget.data as GhostPatternData}
            onRemove={handleRemoveWidget}
          />
        );
      case 'options':
        return (
          <OptionsStrategyCard
            key={widget.id}
            id={widget.id}
            data={widget.data as OptionsStrategy}
            onRemove={handleRemoveWidget}
          />
        );
      case 'profile':
      default:
        return (
          <TextWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            text={(widget.data as { text: string; sources?: Source[] }).text}
            sources={(widget.data as { text: string; sources?: Source[] }).sources}
            onRemove={handleRemoveWidget}
          />
        );
    }
  };

  const dashboardNotice = useMemo(() => {
    if (!widgets.length) {
      return (
        <div className="border border-dashed border-gray-700 p-6 text-center text-gray-500">
          <p className="text-sm">Use the toolbox to add demo widgets while Gemini is offline.</p>
        </div>
      );
    }

    return null;
  }, [widgets.length]);

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col">
      <Header />

      <div className="bg-yellow-950/40 border-b border-yellow-800/40 px-4 py-3 text-sm text-yellow-200 flex items-start gap-3">
        <Icon icon="info" className="w-5 h-5 mt-0.5 text-yellow-300" />
        <div>
          <p className="font-semibold tracking-wide uppercase text-xs text-yellow-400">Offline demo mode</p>
          <p>{OFFLINE_DEMO_NOTICE}</p>
          {geminiConfigured && (
            <p className="mt-1 text-yellow-300/80">
              Gemini credentials detected, but remote calls remain disabled for this deployment. Sample insights are shown below.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 xl:grid-cols-[260px_minmax(0,_1fr)_340px]">
        <aside className={`border-r border-gray-900 hidden md:block md:col-span-3 xl:col-auto ${isDashboardLoading ? 'opacity-70' : ''}`}>
          <Toolbox onAnalysisRequested={handleAnalysisRequested} isLoading={isDashboardLoading} />
        </aside>

        <main className={`overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 relative md:col-span-6 xl:col-span-7 ${mobileView === 'dashboard' ? 'block' : 'hidden'} md:block`}>
          {isDashboardLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
              <LoadingSpinner />
              <p className="text-sm text-gray-400 uppercase tracking-widest">Preparing offline insight…</p>
            </div>
          )}

          {dashboardNotice}

          <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
            {widgets.map(widget => (
              <div key={widget.id} className="min-h-[220px]">
                {renderWidget(widget)}
              </div>
            ))}
          </div>
        </main>

        <section className={`border-l border-gray-900 flex flex-col bg-black md:col-span-3 xl:col-auto ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
            <ChatInput
              onSendMessage={handleSendMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              isRecording={isRecording}
              isLoading={isChatLoading}
            />
          </div>
        </section>
      </div>

      <div className="md:hidden h-16" />
      <MobileNav activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
};

export default App;
