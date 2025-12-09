import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { PortfolioView } from './components/PortfolioView';
import { UNIVERSE } from './lib/agent/universe';
import { ProfileModal } from './components/ProfileModal';
import { MarketClock } from './lib/agent/types';

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
  const [activeTab, setActiveTab] = useState<'command-center' | 'portfolio'>('command-center');
  const analysisModelId = DEFAULT_CHAT_MODEL.id;
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(DEFAULT_SYMBOLS[0]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isPortfolioGenerating, setIsPortfolioGenerating] = useState(false);

  // Agent State
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [marketClocks, setMarketClocks] = useState<MarketClock[] | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Uncurated Ticker State
  const [uncuratedTicker, setUncuratedTicker] = useState<string | null>(null);

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sleeve State
  const [expandedSleeves, setExpandedSleeves] = useState<Record<string, boolean>>({ 'Core Tech': true });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loadedSnapshotsRef = useRef<Set<string>>(new Set());

  const toggleSleeve = (sleeve: string) => {
    setExpandedSleeves(prev => ({ ...prev, [sleeve]: !prev[sleeve] }));
  };

  // Group Universe by Sleeve
  const sleeves = UNIVERSE.reduce((acc, ticker) => {
    if (!acc[ticker.sleeve]) acc[ticker.sleeve] = [];
    acc[ticker.sleeve].push(ticker);
    return acc;
  }, {} as Record<string, typeof UNIVERSE>);

  // Mock Ticker Status (Deterministic based on symbol char code)
  const getMockTickerStatus = (symbol: string): 'green' | 'yellow' | 'red' => {
    const sum = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = sum % 3;
    return mod === 0 ? 'green' : mod === 1 ? 'yellow' : 'red';
  };

  // Group Universe by Sleeve and Calculate Stats
  const sleevesWithStats = Object.entries(sleeves).map(([sleeveName, items]) => {
    const stats = items.reduce((acc, ticker) => {
      const status = getMockTickerStatus(ticker.symbol);
      acc[status]++;
      return acc;
    }, { green: 0, yellow: 0, red: 0 });
    return { sleeveName, items, stats };
  });

  const handleActionAddUncurated = (symbol: string) => {
    handleAddSymbol(symbol);
    setUncuratedTicker(null); // Dismiss warning after adding
  };

  const handleActionOverride = () => {
    setUncuratedTicker(null); // Just dismiss
  };

  const checkCurated = (symbol: string) => {
    const isCurated = UNIVERSE.some(t => t.symbol === symbol);
    if (!isCurated) {
      setUncuratedTicker(symbol);
    } else {
      setUncuratedTicker(null);
    }
  };

  const handleRunAgentScan = async (scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL', target?: string, toolName?: string) => {
    setIsAgentRunning(true);
    if (scope === 'TICKER' && target) {
      checkCurated(target);
    } else {
      setUncuratedTicker(null);
    }

    // For TOOL scope, the target is usually the tool code (e.g. CLOCK_X) or a symbol if it's a specific analysis tool
    setAgentOutput(`Initializing ${scope} scan...`);

    try {
      const res = await (window.fetch as any)('/api/agent/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          target: scope === 'TOOL' ? target : target,
          tool: toolName || (scope === 'TOOL' ? target : undefined)
        })
      });
      const data = await res.json();
      setAgentOutput(data.analysis || "Analysis complete. See console.");

      // Also add a widget for persistent view
      const widget: AnalysisWidget = {
        id: `agent-${Date.now()}`,
        type: 'profile',
        title: `Agent Report (${scope === 'TOOL' ? toolName || target : scope})`,
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
    checkCurated(symbol);

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
        // 1. Intercept Commands
        const lowerMsg = message.toLowerCase().trim();
        if (lowerMsg.startsWith('analyze ') || lowerMsg.startsWith('scan ')) {
          const parts = message.split(' ');
          const target = parts.length > 1 ? parts[1].toUpperCase() : null;
          if (target) {
            // Determine if target is a known Sleeve, otherwise assume Ticker
            const sleeves = ['CORE TECH', 'ROTATABLE TECH', 'ENERGY', 'METALS', 'CASH', 'OPTIONS'];
            // Simple heuristic
            if (sleeves.some(s => target.includes(s) || s.includes(target))) {
              handleRunAgentScan('SLEEVE', target); // You might need better mapping here
              responseText = `initiating Sleeve Scan for ${target}... check the Command Center.`;
            } else {
              handleRunAgentScan('TICKER', target);
              responseText = `Initiating Ticker Analysis for ${target}... check the Command Center.`;
            }
          } else {
            responseText = "Please specify a target to analyze (e.g., 'Analyze NVDA').";
          }
        } else {
          // 2. Normal Chat with Context
          const history = messages
            .filter(m => (m.role === 'user' || m.role === 'model') && !m.isLoading)
            .map(m => ({
              role: m.role as 'user' | 'model',
              parts: [{ text: m.content }],
            }));

          // Pass the latest agent report as context
          const context = agentOutput ? { latestReport: agentOutput } : undefined;

          const response = await sendMessage(message, history, context);
          responseText = response.response ?? '';
        }
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
            if (data.clocks) {
              setMarketClocks(data.clocks);
            }
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
    <div className="h-screen w-screen bg-slate-950 text-gray-100 flex overflow-hidden font-sans">

      {activeTab === 'command-center' ? (
        <>
          {/* LEFT COLUMN: Portfolio & Actions (25%) */}
          <div className="w-[300px] xl:w-[350px] flex flex-col border-r border-slate-800 bg-slate-900/40">
            {/* NEW COLUMN HEADER: Logo & Title */}
            <div className="h-[60px] px-4 flex items-center gap-3 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <div className="p-1.5 bg-gradient-to-br from-cyan-600 to-purple-700 rounded-lg shadow-lg">
                <Icon icon="bot" className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none">
                  StockCommand
                </h1>
              </div>
            </div>

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
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative border-r border-slate-800">
            {/* NEW COLUMN HEADER: Navigation & Status */}
            <div className="h-[60px] px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-20">
              {/* Navigation Tabs */}
              <div className="flex items-center bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
                <button
                  onClick={() => setActiveTab('command-center')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${activeTab === 'command-center'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                    }`}
                >
                  Command Center
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${activeTab === 'portfolio'
                    ? 'bg-slate-800 text-purple-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                    }`}
                >
                  Portfolio
                </button>
              </div>

              <div className="font-semibold text-xs text-emerald-400 tracking-wider flex items-center gap-2">
                <Icon icon="bot" className="w-4 h-4" />
                AGENT COMMAND CENTER
              </div>
            </div>

            {/* Processing Indicator (previously in header) - moved to overlay or kept in secondary bar */}
            {isAgentRunning && (
              <div className="absolute top-[60px] left-0 right-0 h-[2px] bg-amber-500/50 overflow-hidden z-30">
                <div className="absolute inset-0 bg-amber-400 animate-progress origin-left"></div>
              </div>
            )}

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

            {/* Chat Input Area (moved to top) */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur">
              <ChatInput
                onSendMessage={handleSendMessage}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                isRecording={isRecording}
                isLoading={isChatLoading}
              />
            </div>

            {/* Auto-Scroll Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 custom-markdown">

              {/* UNCURATED WARNING */}
              {uncuratedTicker && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-scaleIn relative overflow-hidden mb-6">
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Icon icon="alert" className="w-16 h-16 text-red-500" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Icon icon="alert" className="w-4 h-4" />
                      Uncurated Ticker Detected: {uncuratedTicker}
                    </h3>
                    <p className="text-gray-300 text-xs mb-3 max-w-lg">
                      This asset is <strong>outside the scope</strong> of the Core Portfolio Strategy (2026-2031).
                      The AI Agent can analyze it, but it lacks the customized role-based context defined in the main framework.
                      Results may be generic.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleActionOverride}
                        className="px-3 py-1 bg-red-800/40 hover:bg-red-700/50 text-red-200 text-xs rounded border border-red-700/50 transition-colors"
                      >
                        Override & View Analysis
                      </button>
                      <button
                        onClick={() => handleActionAddUncurated(uncuratedTicker)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded border border-slate-600 transition-colors"
                      >
                        Add to Custom Portfolio
                      </button>
                      <button
                        onClick={() => setUncuratedTicker(null)}
                        className="px-3 py-1 hover:bg-slate-700 text-gray-400 text-xs rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Combined Feed: Messages & Agent Reports */}
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="animate-fadeIn">
                    {/* Distinguish Agent Reports vs Regular Chat */}
                    {msg.role === 'agent' ? (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Latest Intelligence Report</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none bg-slate-900/50 p-6 rounded-lg border border-slate-800/50 shadow-inner">
                          <TextWidget id={`report-${msg.id}`} title="" text={msg.content} />
                        </div>
                      </div>
                    ) : (
                      <ChatMessage message={{ ...msg, role: msg.role === 'model' ? 'model' : 'user' }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Regular Widgets */}
              {widgets.filter(w => !w.title.includes('Agent')).map(widget => (
                <div key={widget.id} className="animate-fadeIn">{renderWidget(widget)}</div>
              ))}
            </div>

            <div ref={chatContainerRef} />
          </div>

          {/* RIGHT COLUMN: Market Data & Clocks (25%) */}
          <div className="w-[300px] xl:w-[350px] flex flex-col bg-slate-900/40">
            {/* NEW COLUMN HEADER: Profile & Tools */}
            <div className="h-[60px] px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-xs text-gray-400 font-medium">LIVE</span>
              </div>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg hover:shadow-cyan-500/20 transition-all transform hover:scale-105"
              >
                AM
              </button>
            </div>

            <div className="p-3 bg-slate-900 border-b border-slate-800 font-semibold text-xs text-amber-400 tracking-wider">
              MARKET CLOCKS
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
              {/* Clocks */}
              {/* Clocks */}
              <div className="space-y-3">
                {marketClocks ? (
                  marketClocks.map(clock => (
                    <div
                      key={clock.code}
                      className="bg-slate-800/50 p-3 rounded border border-slate-700/50 flex justify-between items-center group hover:border-amber-500/30 transition-colors cursor-pointer hover:bg-slate-800"
                      onClick={() => handleRunAgentScan('TOOL', clock.code)}
                      title={clock.reason}
                    >
                      <span className="text-gray-400 text-xs font-medium group-hover:text-cyan-400 transition-colors">{clock.label}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${clock.status === 'green' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                          clock.status === 'yellow' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                            'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                          }`} />
                      </div>
                    </div>
                  ))
                ) : (
                  // Skeleton / Default Placeholder State
                  [
                    { label: 'Liquidity Cycle', status: 'gray', code: 'CLOCK_LIQUIDITY_CYCLE' },
                    { label: 'Commodity Cycle', status: 'gray', code: 'CLOCK_COMMODITY_CYCLE' },
                    { label: 'VIX Regime', status: 'gray', code: 'CLOCK_VIX_REGIME' },
                    { label: 'Inflation Trend', status: 'gray', code: 'CLOCK_INFLATION_TREND' },
                    { label: 'Credit Impulse', status: 'gray', code: 'CLOCK_CREDIT_IMPULSE' },
                    { label: 'Dollar Strength', status: 'gray', code: 'CLOCK_DOLLAR_STRENGTH' }
                  ].map(clock => (
                    <div
                      key={clock.label}
                      className="bg-slate-800/50 p-3 rounded border border-slate-700/50 flex justify-between items-center opacity-50 cursor-not-allowed"
                    >
                      <span className="text-gray-500 text-xs font-medium">{clock.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sleeves Accordion */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Portfolio Sleeves</div>
              <div className="space-y-2">
                {sleevesWithStats.map(({ sleeveName, items, stats }) => (
                  <div key={sleeveName} className="border border-slate-800 rounded bg-slate-900/30 overflow-hidden">
                    <div
                      className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                      onClick={() => toggleSleeve(sleeveName)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300">{sleeveName}</span>
                        {/* Sleeve Checksum / Light Summary */}
                        <div className="flex gap-1 ml-2">
                          {stats.green > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                              <span className="text-[9px] font-mono text-emerald-400">{stats.green}</span>
                            </div>
                          )}
                          {stats.yellow > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                              <span className="text-[9px] font-mono text-amber-400">{stats.yellow}</span>
                            </div>
                          )}
                          {stats.red > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                              <span className="text-[9px] font-mono text-red-400">{stats.red}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Icon icon="chevron-down" className={`w-3 h-3 text-gray-500 transition-transform ${expandedSleeves[sleeveName] ? 'rotate-180' : ''}`} />
                    </div>
                    {expandedSleeves[sleeveName] && (
                      <div className="bg-slate-950/50 border-t border-slate-800/50">
                        {items.map(ticker => {
                          const status = getMockTickerStatus(ticker.symbol);
                          return (
                            <div
                              key={ticker.symbol}
                              className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-800/30 cursor-pointer group border-l-2 border-transparent hover:border-blue-500 transition-all"
                              onClick={() => handleAnalysisRequest('Company Profile', ticker.symbol)}
                            >
                              <span className="text-xs text-gray-400 font-mono group-hover:text-cyan-400 transition-colors">{ticker.symbol}</span>
                              {/* Ticker Status Clock Icon */}
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${status === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                status === 'yellow' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                  'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status === 'green' ? 'bg-emerald-500' :
                                  status === 'yellow' ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`} />
                                <Icon icon="clock" className="w-3 h-3" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </>
      ) : (
        <div className="flex-1 flex flex-col h-screen">
          {/* Portfolio View also needs the unified header logic or sticking with its own header? 
                     User said "Move header stuff into columns". 
                     If we switch tabs, we probably want the SAME header structure or at least the tabs visible.
                     Let's add the top bar to PortfolioView as well, or wrap the whole App content in a structure where columns persist?
                     But PortfolioView takes up the whole space.
                     
                     Solution: PortfolioView needs the Tab Navigation Bar.
                 */}
          {/* Reuse the Middle Column Header logic for consistency/navigation */}
          <div className="h-[60px] px-6 md:px-8 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm flex-none z-20">
            {/* Logo for Portfolio View (since Left Column is gone) */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-cyan-600 to-purple-700 rounded-lg shadow-lg">
                <Icon icon="bot" className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none">
                StockCommand
              </h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
              <button
                onClick={() => setActiveTab('command-center')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${activeTab === 'command-center'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm' // Inactive logic
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
              >
                Command Center
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${activeTab === 'portfolio'
                  ? 'bg-slate-800 text-purple-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
              >
                Portfolio
              </button>
            </div>

            {/* Profile Button */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-xs text-gray-400 font-medium">LIVE</span>
              </div>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg hover:shadow-cyan-500/20 transition-all transform hover:scale-105"
              >
                AM
              </button>
            </div>
          </div>

          <PortfolioView sleevesWithStats={sleevesWithStats} />
        </div>
      )}



      <PortfolioReportModal
        isOpen={isPortfolioModalOpen}
        symbols={symbols}
        activeSymbol={activeSymbol}
        isGenerating={isPortfolioGenerating}
        onClose={() => setIsPortfolioModalOpen(false)}
        onSubmit={handleGeneratePortfolioReport}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div >
  );
};

export default App;
