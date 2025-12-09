import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  searchWithGrounding,
  sendMessage,
  generatePortfolioReport,
  type AnalysisWidget,
} from './services/geminiService';
import { DEFAULT_CHAT_MODEL } from './lib/constants/llmModels';
import { fetchStockSnapshot } from './services/stockData';
import { PortfolioReportModal } from './components/PortfolioReportModal';
import { PortfolioReportWidget } from './components/PortfolioReportWidget';

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

const DEFAULT_SYMBOLS = ['TSLA', 'NVDA', 'AAPL'];

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
  const [widgets, setWidgets] = useState<AnalysisWidget[]>([]);
  const [mobileView, setMobileView] = useState<MobileView>('toolbox');
  const analysisModelId = DEFAULT_CHAT_MODEL.id;
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(DEFAULT_SYMBOLS[0]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isPortfolioGenerating, setIsPortfolioGenerating] = useState(false);

  // Agent State
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loadedSnapshotsRef = useRef<Set<string>>(new Set());

  const handleRunAgentScan = async (scope: 'FULL' | 'SLEEVE' | 'TICKER', target?: string) => {
    setIsAgentRunning(true);
    setAgentOutput(`Initializing ${scope} scan...`);

    try {
      const res = await (window.fetch as any)('/api/agent/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, target })
      });
      const data = await res.json();
      setAgentOutput(data.analysis || "Analysis complete. See console.");

      // Also add a widget for persistent view
      const widget: AnalysisWidget = {
        id: `agent-${Date.now()}`,
        type: 'profile',
        title: `Agent Report (${scope})`,
        data: { text: data.analysis, sources: [] }
      };
      setWidgets(prev => [widget, ...prev]);
      setMobileView('dashboard'); // Switch to dashboard to see result

    } catch (e: any) {
      setAgentOutput(`Error: ${e.message}`);
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Auto-scroll chat
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

  const ensureSnapshotForSymbol = useCallback(async (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (loadedSnapshotsRef.current.has(upper)) {
      return;
    }
    loadedSnapshotsRef.current.add(upper);

    try {
      const snapshot = await fetchStockSnapshot(upper);
      const text = `Price: $${snapshot.price.toFixed(2)} (${snapshot.changePercent.toFixed(2)}%)\n` +
        `Change: ${snapshot.change.toFixed(2)} | Volume: ${snapshot.volume.toLocaleString()}\n` +
        (snapshot.sector ? `Sector: ${snapshot.sector}\n` : '') +
        (snapshot.industry ? `Industry: ${snapshot.industry}\n` : '') +
        (snapshot.description ? `\n${snapshot.description}` : '');

      const widget: AnalysisWidget = {
        id: `snapshot-${upper}-${Date.now()}`,
        type: 'profile',
        title: `${upper} Snapshot`,
        data: { text, sources: snapshot.sources },
      };
      setWidgets(prev => [widget, ...prev]);
    } catch (error) {
      console.error('Failed to load live snapshot:', error);
    }
  }, []);

  useEffect(() => {
    symbols.forEach(symbol => {
      ensureSnapshotForSymbol(symbol);
    });
  }, [symbols, ensureSnapshotForSymbol]);

  const renderWidget = (widget: AnalysisWidget) => {
    switch (widget.type) {
      case 'divergence':
        return <StockDivergenceChart id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'ghost':
        return <GhostPatternChart id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'options':
        return <OptionsStrategyCard id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'portfolio':
        return (
          <PortfolioReportWidget
            id={widget.id}
            title={widget.title}
            data={widget.data}
            onRemove={removeWidget}
          />
        );
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
    if (!symbol) return;

    setIsDashboardLoading(true);
    setMobileView('dashboard');
    setAgentOutput(`Running ${featureType} on ${symbol}...`);
    setIsAgentRunning(true);

    try {
      const res = await (window.fetch as any)('/api/agent/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'TOOL',
          target: symbol,
          tool: featureType
        })
      });

      const data = await res.json();
      const analysisText = data.analysis || "No analysis returned.";

      setAgentOutput(analysisText);

      // Add a widget for valid response
      const widget: AnalysisWidget = {
        id: `tool-${featureType}-${Date.now()}`,
        type: 'profile',
        title: `${featureType}: ${symbol}`,
        data: { text: analysisText, sources: [] }
      };
      setWidgets(prev => [widget, ...prev]);

    } catch (e: any) {
      setAgentOutput(`Error running tool: ${e.message}`);
    } finally {
      setIsDashboardLoading(false);
      setIsAgentRunning(false);
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
        const response = await analyzeImage(message || 'Analyze this image.', image, { model: analysisModelId });
        responseText = response.response ?? '';
      } else {
        const history = messages
          .filter(m => (m.role === 'user' || m.role === 'model') && !m.isLoading)
          .map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }],
          }));

        const response = await sendMessage(message, history, {
          activeSymbol,
          watchlist: symbols,
        });
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

  const handleAddSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setSymbols(prev => (prev.includes(upper) ? prev : [...prev, upper]));
    setActiveSymbol(upper);
    ensureSnapshotForSymbol(upper);
    handleAnalysisRequest('Company Profile', upper);
  };

  const handleRemoveSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setSymbols(prev => prev.filter(s => s !== upper));
    setWidgets(prev => prev.filter(widget => !widget.title?.includes(upper)));
    if (activeSymbol === upper) {
      const remaining = symbols.filter(s => s !== upper);
      setActiveSymbol(remaining[0] ?? null);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    setActiveSymbol(symbol);
  };

  const handleGeneratePortfolioReport = async (tickers: string[], goal: string) => {
    setIsPortfolioGenerating(true);
    try {
      const report = await generatePortfolioReport(tickers, goal);
      const widget: AnalysisWidget = {
        id: `portfolio-${Date.now()}`,
        type: 'portfolio',
        title: `Portfolio Report (${tickers.join(', ')})`,
        data: report,
      };
      setWidgets(prev => [widget, ...prev]);
      setIsPortfolioModalOpen(false);
      setMobileView('dashboard');
    } catch (error) {
      console.error('Failed to generate portfolio report:', error);
    } finally {
      setIsPortfolioGenerating(false);
    }
  };

  // Load persisted agent run on mount
  useEffect(() => {
    const loadPersistedRun = async () => {
      try {
        const res = await (window.fetch as any)('/api/agent/latest');
        if (res.ok) {
          const data = await res.json();
          if (data && data.analysis) {
            setAgentOutput(data.analysis);
            // Add a widget for it
            const widget: AnalysisWidget = {
              id: `persisted-agent`,
              type: 'profile',
              title: `Last Run: ${data.scope || 'FULL'}`,
              data: { text: data.analysis, sources: [] }
            };
            setWidgets(prev => {
              if (prev.find(w => w.id === 'persisted-agent')) return prev;
              return [widget, ...prev];
            });
          }
        }
      } catch (e) {
        console.error("Failed to load persisted run", e);
      }
    };
    loadPersistedRun();
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-950 text-gray-100 flex flex-col overflow-hidden font-sans">
      <div className="flex-none z-50 shadow-md">
        <Header />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Portfolio & Actions (25%) */}
        <div className="w-[300px] xl:w-[350px] flex flex-col border-r border-slate-800 bg-slate-900/40">
          <div className="p-3 bg-slate-900 border-b border-slate-800 font-semibold text-xs text-cyan-400 tracking-wider">
            PORTFOLIO CONTEXT
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Fake Portfolio Summary */}
            <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
              <div className="flex justify-between items-end mb-2">
                <span className="text-gray-400 text-xs">Total Liquidity</span>
                <span className="text-xl font-bold font-mono text-emerald-400">$1,240,500</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[65%]" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Core: 65%</span>
                <span>Cash: 35%</span>
              </div>
            </div>

            {/* Toolbox for Quick Access */}
            <Toolbox
              symbols={symbols}
              activeSymbol={activeSymbol}
              onAddSymbol={handleAddSymbol}
              onRemoveSymbol={handleRemoveSymbol}
              onSelectSymbol={handleSelectSymbol}
              onAnalysisRequested={handleAnalysisRequest}
              onPortfolioReport={() => setIsPortfolioModalOpen(true)}
              isLoading={isDashboardLoading}
            />
          </div>
        </div>

        {/* MIDDLE COLUMN: Command Center (50%) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          <div className="p-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex justify-between items-center z-10">
            <div className="font-semibold text-xs text-emerald-400 tracking-wider flex items-center gap-2">
              <Icon icon="bot" className="w-4 h-4" />
              AGENT COMMAND CENTER
            </div>
            {isAgentRunning && <span className="text-xs text-amber-400 animate-pulse">Processing...</span>}
          </div>

          {/* Agent Controls Overlay */}
          <div className="p-4 border-b border-slate-800/50 flex gap-2 overflow-x-auto bg-slate-900/20">
            <button
              onClick={() => handleRunAgentScan('FULL')}
              disabled={isAgentRunning}
              className="whitespace-nowrap px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              RUN FULL SCAN
            </button>
            <div className="h-6 w-px bg-slate-700 mx-1" />
            <select
              id="sleeve-select"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
              onChange={(e) => {
                if (e.target.value) handleRunAgentScan('SLEEVE', e.target.value);
                e.target.value = ""; // reset
              }}
            >
              <option value="">Analyze Sleeve...</option>
              <option value="Core Tech">Core Tech</option>
              <option value="Rotatable Tech">Rotatable Tech</option>
              <option value="Specialized: Energy">Energy</option>
              <option value="Physical Precious Metals">Metals</option>
            </select>
            <input
              type="text"
              placeholder="Ticker..."
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-24 outline-none focus:border-blue-500 transition-all focus:w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.currentTarget as HTMLInputElement).value;
                  if (val) handleRunAgentScan('TICKER', val.toUpperCase());
                  (e.currentTarget as HTMLInputElement).value = "";
                }
              }}
            />
          </div>

          {/* Auto-Scroll Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 custom-markdown">
            {/* Agent Output */}
            {agentOutput && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Latest Intelligence Report</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none bg-slate-900/50 p-6 rounded-lg border border-slate-800/50 shadow-inner">
                  <TextWidget id="agent-main" title="" text={agentOutput} />
                </div>
              </div>
            )}

            {/* Regular Chat/Widgets */}
            {widgets.filter(w => !w.title.includes('Agent')).map(widget => (
              <div key={widget.id} className="animate-fadeIn">{renderWidget(widget)}</div>
            ))}

            <div ref={chatContainerRef} />
          </div>

          {/* Chat Input Area */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
            <ChatInput
              onSendMessage={handleSendMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              isRecording={isRecording}
              isLoading={isChatLoading}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Market Data & Clocks (25%) */}
        <div className="w-[300px] xl:w-[350px] flex flex-col border-l border-slate-800 bg-slate-900/40">
          <div className="p-3 bg-slate-900 border-b border-slate-800 font-semibold text-xs text-amber-400 tracking-wider">
            MARKET CLOCKS
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Mock Clocks */}
            <div className="space-y-3">
              {['Liquidity Cycle', 'Commodity Cycle', 'VIX Regime'].map(label => (
                <div key={label} className="bg-slate-800/50 p-3 rounded border border-slate-700/50 flex justify-between items-center group hover:border-amber-500/30 transition-colors cursor-default">
                  <span className="text-gray-400 text-xs font-medium group-hover:text-gray-200">{label}</span>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-gray-300">NEUTRAL</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Watchlist</div>
              <div className="space-y-1">
                {symbols.map(sym => (
                  <div key={sym} className="flex justify-between items-center p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors" onClick={() => handleAnalysisRequest('Company Profile', sym)}>
                    <span className="font-mono text-sm font-bold text-gray-300">{sym}</span>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PortfolioReportModal
        isOpen={isPortfolioModalOpen}
        symbols={symbols}
        activeSymbol={activeSymbol}
        isGenerating={isPortfolioGenerating}
        onClose={() => setIsPortfolioModalOpen(false)}
        onSubmit={handleGeneratePortfolioReport}
      />
    </div>
  );
};

export default App;
