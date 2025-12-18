import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { HUDNav } from './components/HUDNav';
// import { MobileNav } from './components/MobileNav';
import { CentralCommand } from './components/CentralCommand';
import { StatusWidget } from './components/StatusWidget';
import { LogicPipeline } from './components/LogicPipeline';
import { NetworkTopology } from './components/NetworkTopology';
import { MetricsAnalytics } from './components/MetricsAnalytics';
import { ConsoleWidget } from './components/ConsoleWidget';
import { FeatureDetailView, FEATURE_CONFIG } from './components/FeatureDetailView';
import { CreatorModeView } from './components/CreatorModeView';
import { CompetitionsView } from './components/CompetitionsView';
import { PortfolioView } from './components/PortfolioView';
import { EntityDetailView } from './components/EntityDetailView';
import { PortfolioReportModal } from './components/PortfolioReportModal';
import { ProfileModal } from './components/ProfileModal';
import { CommandPalette } from './components/CommandPalette';
import { Icon } from './components/Icon';
import { MarketClocksView } from './components/MarketClocksView';
import { SocialView } from './components/SocialView';
import { ChatInput } from './components/ChatInput';
import { NewsSynthesisView } from './components/NewsSynthesisView';
import { SettingsView } from './components/SettingsView';
import { BrokerConnectionModal } from './components/BrokerConnectionModal';
import { TradeExecutionPanel } from './components/TradeExecutionPanel';
import { BrokerPortfolioView } from './components/BrokerPortfolioView';

import type { ChatMessage as ChatMessageType, Source } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  analyzeImage,
  searchWithGrounding,
  sendMessage,
  generatePortfolioReport,
  type AnalysisWidget,
} from './services/geminiService';
import { DEFAULT_CHAT_MODEL } from './lib/constants/llmModels';
import { fetchStockSnapshot } from './services/stockData';
import { UNIVERSE } from './lib/agent/universe';
import { MarketClock, UserStrategy } from './lib/agent/types';
import { JobProvider, useJobContext } from './contexts/JobContext';
import { getClocksForEntity, getGlobalClocks } from './lib/clockData';
import { StorageService } from './lib/storage';

const DEFAULT_SYMBOLS: string[] = [];

const AppContent: React.FC = () => {
  const { startJob, activeJobsCount } = useJobContext();
  console.log("AppContent Mounting");

  const [messages, setMessages] = useState<ChatMessageType[]>(() => [
    { id: 'welcome', role: 'model', content: "StockCommand V2.1 online. Monitoring active markets. Awaiting input." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [widgets, setWidgets] = useState<AnalysisWidget[]>(() => StorageService.loadWidgets());
  const [activeTab, setActiveTab] = useState<'command-center' | 'portfolio' | 'entity-detail' | 'competitions' | 'feature-detail' | 'features' | 'creator' | 'market-clocks' | 'settings'>('command-center');
  const [activeFeature, setActiveFeature] = useState<{ name: string; symbols: string[]; content: string | null } | null>(null);

  // Console Drawer State
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selected Entity State
  const [selectedEntity, setSelectedEntity] = useState<MarketClock | null>(null);
  const [researchReports, setResearchReports] = useState<Record<string, string>>(() => StorageService.loadReports());
  const [dataFreshnessHours, setDataFreshnessHours] = useState<number>(() => StorageService.loadSettings().freshnessHours);

  const analysisModelId = DEFAULT_CHAT_MODEL.id;
  const [symbols, setSymbols] = useState<string[]>(() => StorageService.loadWatchlist());
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isPortfolioGenerating, setIsPortfolioGenerating] = useState(false);
  const [scanningTarget, setScanningTarget] = useState<string | null>(null);
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);

  const [marketClocks, setMarketClocks] = useState<MarketClock[]>(() => {
    const saved = StorageService.loadClocks();
    return saved || getGlobalClocks();
  });

  const [researchHistory, setResearchHistory] = useState<Record<string, { content: string; timestamp: number; status?: string }[]>>(() => StorageService.loadResearchHistory());
  const [uncuratedTicker, setUncuratedTicker] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // VIEW MODE: TACTICAL = 2D Charts/Data, SPATIAL = 3D Agentic Universe
  type ViewMode = 'TACTICAL' | 'SPATIAL';
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = StorageService.loadSettings().viewMode;
    return (saved as ViewMode) || 'SPATIAL';
  });

  // PERSISTENCE EFFECT HOOKS
  useEffect(() => { StorageService.saveWidgets(widgets); }, [widgets]);
  useEffect(() => { StorageService.saveReports(researchReports); }, [researchReports]);
  useEffect(() => { StorageService.saveClocks(marketClocks); }, [marketClocks]);
  useEffect(() => { StorageService.saveSettings({ freshnessHours: dataFreshnessHours, viewMode }); }, [dataFreshnessHours, viewMode]);
  useEffect(() => { StorageService.saveResearchHistory(researchHistory); }, [researchHistory]);
  useEffect(() => { StorageService.saveWatchlist(symbols); }, [symbols]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const loadedSnapshotsRef = useRef<Set<string>>(new Set());

  // Logic Pipeline Analysis Steps (Mocked based on activity)
  const [pipelineSteps, setPipelineSteps] = useState([
    { id: '01', label: 'INPUT_STREAM', subtext: 'Monitoring...', status: 'complete' as const },
    { id: '02', label: 'NORMALIZE', subtext: 'Data verified', status: 'complete' as const },
    { id: '03', label: 'INFERENCE_ENGINE', subtext: 'Idle', status: 'pending' as const },
    { id: '04', label: 'OUTPUT_BUFFER', subtext: 'Ready', status: 'pending' as const },
  ]);

  // Update Pipeline when scanning
  useEffect(() => {
    if (isChatLoading) {
      setPipelineSteps([
        { id: '01', label: 'INPUT_STREAM', subtext: 'Receiving data...', status: 'complete' },
        { id: '02', label: 'NORMALIZE', subtext: 'Verifying integrity', status: 'processing' },
        { id: '03', label: 'INFERENCE_ENGINE', subtext: 'Target acquisition', status: 'pending' },
        { id: '04', label: 'OUTPUT_BUFFER', subtext: 'Pending', status: 'pending' },
      ]);
      setTimeout(() => {
        setPipelineSteps(prev => prev.map(s => s.id === '02' ? { ...s, status: 'complete' } : s));
        setPipelineSteps(prev => prev.map(s => s.id === '03' ? { ...s, status: 'processing', subtext: 'Running models...' } : s));
      }, 1500);
    } else {
      setPipelineSteps([
        { id: '01', label: 'INPUT_STREAM', subtext: 'Monitoring...', status: 'complete' },
        { id: '02', label: 'NORMALIZE', subtext: 'Data verified', status: 'complete' },
        { id: '03', label: 'INFERENCE_ENGINE', subtext: 'Analysis complete', status: 'complete' },
        { id: '04', label: 'OUTPUT_BUFFER', subtext: 'Delivered', status: 'complete' },
      ]);
    }
  }, [isChatLoading]);


  const ensureSnapshotForSymbol = useCallback(async (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (loadedSnapshotsRef.current.has(upper)) return;
    loadedSnapshotsRef.current.add(upper);
    try {
      const snapshot = await fetchStockSnapshot(upper);
      const text = `Price: $${snapshot.price.toFixed(2)} (${snapshot.changePercent.toFixed(2)}%)\n` +
        `Change: ${snapshot.change.toFixed(2)} | Volume: ${snapshot.volume.toLocaleString()}`;
      setMessages(prev => [...prev, { id: `snap-${Date.now()}`, role: 'model', content: `Stats for ${upper}: ${text}` }]);
    } catch (error) {
      console.error('Failed to load live snapshot:', error);
    }
  }, []);

  useEffect(() => {
    symbols.forEach(symbol => { ensureSnapshotForSymbol(symbol); });
  }, [symbols, ensureSnapshotForSymbol]);

  const executeAgentScan = async (scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL', target?: string, toolName?: string) => {
    setScanningTarget(target || scope);
    setAgentOutput(`Initializing ${scope} scan...`);

    let searchContext = "";
    try {
      if (target) {
        setAgentOutput(`Gathering live intelligence for ${target}...`);
        let query = `Latest financial news and analysis for ${target} market`;
        if (scope === 'TOOL') {
          // Enhanced Query for Macro Tools
          if (target.includes('LIQUIDITY')) query = "Global Liquidity Cycle current status 2024 2025 BTC HYG analysis";
          else if (target.includes('COMMODITY')) query = "Commodity Supercycle analysis 2025 Oil Copper structural deficit";
          else if (target.includes('VIX')) query = "VIX volatility regime analysis current market conditions";
          else if (target.includes('INFLATION')) query = "US Inflation Trend Breakeven Rates TIPS analysis current";
          else if (target.includes('CREDIT')) query = "Credit Impulse Global Liquidity High Yield Spreads analysis";
          else if (target.includes('DOLLAR')) query = "US Dollar DXY Index Strength analysis 2024 2025 forecast";
          else query = `${toolName || target} detailed analysis current market data`;
        }
        const searchRes = await searchWithGrounding(query);
        if (searchRes && searchRes.response) {
          searchContext = `\n\n### 🌐 Live Market Context (Google Grounding)\n${searchRes.response}\n\n`;
        }
      }
    } catch (e) {
      console.warn("Live search failed, falling back to cached agent logic", e);
    }

    const strategies = StorageService.loadStrategies();
    const res = await (window.fetch as any)('/api/agent/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope,
        target: scope === 'TOOL' ? target : target,
        tool: toolName || (scope === 'TOOL' ? target : undefined),
        context: searchContext,
        strategies: strategies.filter(s => s.active)
      })
    });
    const data = await res.json();
    const finalAnalysis = searchContext ? `${data.analysis}\n${searchContext}` : (data.analysis || "Analysis complete.");
    setAgentOutput(finalAnalysis);

    if (finalAnalysis) {
      const reportKey = scope === 'TOOL' ? (toolName || target || 'unknown') : (target || scope);
      setResearchReports(prev => ({ ...prev, [reportKey]: finalAnalysis }));
      setResearchHistory(prev => {
        const entries = prev[reportKey] || [];
        const newEntry = { content: finalAnalysis, timestamp: Date.now() };
        return { ...prev, [reportKey]: [newEntry, ...entries].slice(0, 10) };
      });
    }

    const timestamp = Date.now();
    if (data.clocks && (data.clocks as MarketClock[]).length > 0) {
      setMarketClocks((prev: MarketClock[]) => {
        if (!prev) return data.clocks;
        const newClocks = data.clocks as MarketClock[];
        const updated = [...prev];
        newClocks.forEach((nc: MarketClock) => {
          const idx = updated.findIndex((oc: MarketClock) => oc.code === nc.code);
          if (idx >= 0) updated[idx] = { ...nc, lastUpdated: timestamp };
          else updated.push({ ...nc, lastUpdated: timestamp });
        });
        return updated;
      });
    }
    setScanningTarget(null);
    return finalAnalysis;
  };

  const handleRunAgentScan = async (scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL', target?: string, toolName?: string) => {
    const scanLabel = scope === 'TOOL' ? (toolName || target) : (target || scope);
    const loadingMsgId = `scan-${Date.now()}`;
    const loadingMessage: ChatMessageType = {
      id: loadingMsgId,
      role: 'model',
      content: `🤖 **Analyzing ${scanLabel}...**\n\nGathering live market data and news.`,
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const analysisContent = await executeAgentScan(scope, target, toolName);
      const completionMessage: ChatMessageType = {
        id: loadingMsgId,
        role: 'model',
        content: `✅ **${scanLabel} Analysis Complete**\n\n${analysisContent || 'Analysis complete.'}`,
        isLoading: false
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMsgId ? completionMessage : msg));
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: loadingMsgId,
        role: 'model',
        content: `❌ **Analysis of ${scanLabel} failed.**`,
        isLoading: false
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMsgId ? errorMessage : msg));
    }
  };

  const handleSendMessage = async (message: string, image?: File) => {
    if (!message.trim() && !image) return;
    setIsConsoleOpen(true); // Auto-open on interaction
    const userMessage: ChatMessageType = { id: `user-${Date.now()}`, role: 'user', content: message };
    const modelMessageId = `model-${Date.now() + 1}`;
    const loadingMessage: ChatMessageType = { id: modelMessageId, role: 'model', content: '', isLoading: true };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsChatLoading(true);

    try {
      let responseText = '';
      let sources: Source[] | undefined;

      if (image) {
        const response = await analyzeImage(message || 'Analyze this image.', image, { model: analysisModelId });
        responseText = response.response ?? '';
      } else {
        const lowerMsg = message.toLowerCase().trim();
        if (lowerMsg.startsWith('analyze ') || lowerMsg.startsWith('scan ')) {
          const parts = message.split(' ');
          const target = parts.length > 1 ? parts[1].toUpperCase() : null;
          if (target) {
            handleRunAgentScan('TICKER', target);
            responseText = `Initiating Ticker Analysis for ${target}...`;
          } else {
            responseText = "Please specify a target to analyze.";
          }
        } else {
          // DYNAMIC TICKER DETECTION
          const tickerMatch = message.match(/\$([A-Za-z]{2,5})/);
          if (tickerMatch) {
            const detectedTicker = tickerMatch[1].toUpperCase();
            if (!symbols.includes(detectedTicker)) {
              setSymbols(prev => [...prev, detectedTicker]);
              // Auto-add to a "Watchlist" sleeve if not exists (Logic stub)
              // Trigger immediate Clock Generation for this ticker
              const newClocks = getClocksForEntity('TICKER', detectedTicker);
              setMarketClocks(prev => [...prev, ...newClocks]);
            }
          }

          const context = {
            latestReport: agentOutput,
            activeTickers: selectedSymbols,
            currentView: activeTab,
            activeTarget: scanningTarget
          };
          const history = messages.filter(m => !m.isLoading).map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content }] }));
          const response = await sendMessage(message, history, context);
          responseText = response.response ?? '';
        }
      }

      const newBotMessage: ChatMessageType = {
        id: modelMessageId,
        role: 'model',
        content: responseText || "My systems are uncertain.",
        sources,
        isLoading: false,
      };
      setMessages(prev => prev.map(msg => (msg.id === modelMessageId ? newBotMessage : msg)));
    } catch (error: any) {
      console.error(error);
      const errorMessageText = error.message || 'Error processing request.';
      setMessages(prev => prev.map(msg => (msg.id === modelMessageId ? { ...msg, content: `❌ **System Error**\n\n${errorMessageText}`, isLoading: false } : msg)));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGeneratePortfolioReport = async (tickers: string[], goal: string) => {
    setIsPortfolioGenerating(true);
    try {
      await startJob("Generating Portfolio Report", async () => {
        const report = await generatePortfolioReport(tickers, goal);
        setMessages(prev => [...prev, { id: `rep-${Date.now()}`, role: 'model', content: `📄 **Portfolio Report Generated**\n\n${report}` }]);
        setIsPortfolioModalOpen(false);
      }, 'REPORT');
    } catch (error) {
      console.error(error);
    } finally {
      setIsPortfolioGenerating(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Audio recording not supported.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.start();
      setIsRecording(true);
    } catch (e) { console.error(e); }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  // Clone Strategy Handler
  const handleCloneStrategy = useCallback((strategy: UserStrategy) => {
    StorageService.saveCloneStrategy(strategy);
    const cloneMessage: ChatMessageType = {
      id: `clone-${Date.now()}`,
      role: 'model',
      content: `✅ Strategy "${strategy.name}" cloned to your Forge. Switch to **Creator Mode** to view and edit it.`,
      isLoading: false
    };
    setMessages(prev => [...prev, cloneMessage]);
  }, []);


  // Broker State
  const [hasBrokerConnection, setHasBrokerConnection] = useState(false);

  useEffect(() => {
    // Check for broker connections on mount
    fetch('/api/brokers/connections')
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          setHasBrokerConnection(true);
        }
      })
      .catch(err => console.error("Failed to check broker connections", err));
  }, []);

  // --- REAL DATA INTEGRATION FOR PORTFOLIO VIEW ---
  const sleevesWithStats = useMemo(() => {
    // If no symbols, return empty to show empty state
    if (!symbols || symbols.length === 0) return [];

    // Group symbols by sleeve
    const sleeveMap = new Map<string, Array<{ symbol: string, name: string, allocation: number }>>();

    symbols.forEach(symbol => {
      // Find metadata in UNIVERSE if available (Knowledge Base)
      const known = UNIVERSE.find(u => u.symbol === symbol);
      const sleeveName = known ? known.sleeve : 'Unclassified';
      const role = known ? known.role : 'Custom Ticker';

      if (!sleeveMap.has(sleeveName)) {
        sleeveMap.set(sleeveName, []);
      }
      sleeveMap.get(sleeveName)!.push({
        symbol,
        name: role,
        allocation: 0 // Mock allocation for now
      });
    });

    return Array.from(sleeveMap.entries()).map(([sleeveName, items]) => ({
      sleeveName,
      items,
      stats: { green: 0, yellow: 0, red: 0 }
    }));
  }, [symbols]);
  // ------------------------------------------------

  return (
    <div className="hud-grid">
      {/* 1. LEFT RAIL (NAV) */}
      <div className={`hud-cell-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="md:hidden absolute top-4 right-4 z-50">
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-cyan-500"><Icon icon="close" className="w-6 h-6" /></button>
        </div>
        <HUDNav
          activeTab={activeTab}
          onNavigate={(tab) => { setActiveTab(tab as any); setIsMobileMenuOpen(false); }}
          activeJobsCount={activeJobsCount}
        />
      </div>

      {/* 2. HEADER (USER & SYSTEM STATUS) */}
      <div className="hud-cell-header justify-between">
        <div className="flex items-center gap-4">
          <Icon icon="command" className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <h1 className="font-bold tracking-widest text-lg hidden md:block">STOCK_COMMAND <span className="text-cyan-500 text-xs align-top">V2.1</span></h1>
          <h1 className="font-bold tracking-widest text-lg md:hidden">CMD <span className="text-cyan-500 text-xs align-top">V2.1</span></h1>

          {/* ACTIVE AGENT STATUS (Top Centerish) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-cyan-900/10 border border-cyan-500/30 rounded-full">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-mono text-cyan-400">AGENT_ACTIVE</span>
          </div>

          {/* Agent Fuel Balance Mini-Display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full">
            <Icon icon="zap" className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400">FUEL: 100%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('TACTICAL')}
              className={`px-2 py-1 text-xs font-mono rounded transition-all ${viewMode === 'TACTICAL'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              TACTICAL
            </button>
            <button
              onClick={() => setViewMode('SPATIAL')}
              className={`px-2 py-1 text-xs font-mono rounded transition-all ${viewMode === 'SPATIAL'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              SPATIAL
            </button>
          </div>

          {/* Connect Broker Button */}
          <button
            onClick={() => setIsBrokerModalOpen(true)}
            className="hidden md:block px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-green-500/20"
          >
            Connect Broker
          </button>

          <button onClick={() => setIsProfileOpen(true)} className="p-2 hover:bg-cyan-900/30 rounded text-cyan-500 transition-colors">
            <Icon icon="user" className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-cyan-500 hover:bg-cyan-900/30 rounded"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Icon icon="menu" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. MAIN VIEWPORT (STACKED CONTENT & DRAWER) */}
      <div className="hud-cell-main flex flex-col">
        {/* TOP: Dynamic Content (Full width now) */}
        <div className="flex-1 overflow-hidden relative">
          {/* 2D Mode: Traditional View for most tabs */}
          {/* View Mode Switching: TACTICAL (Charts) vs SPATIAL (Console/3D) */}
          {activeTab === 'command-center' ? (
            <CentralCommand
              activeMode="READY"
              viewMode={viewMode}
              clocks={marketClocks}
              symbols={symbols}
              onAddSymbol={(sym) => setSymbols(prev => [...prev, sym])}
            />
            </div>
        ) : activeTab === 'portfolio' ? (
        <div className="h-full overflow-y-auto">
          {hasBrokerConnection ? (
            <div className="h-full overflow-hidden"><BrokerPortfolioView onOpenBrokerModal={() => setIsBrokerModalOpen(true)} /></div>
          ) : (
            <PortfolioView sleevesWithStats={sleevesWithStats} onClockClick={() => { }} freshnessThreshold={0} totalLiquidity={0} />
          )}
        </div>
        ) : activeTab === 'trade' ? (
        <div className="h-full overflow-hidden"><TradeExecutionPanel /></div>
        ) : activeTab === 'comms' ? (
        <div className="h-full overflow-hidden"><SocialView /></div>
        ) : activeTab === 'news' ? (
        <div className="h-full overflow-hidden"><NewsSynthesisView /></div>
        ) : activeTab === 'settings' ? (
        <div className="h-full overflow-hidden"><SettingsView /></div>
        ) : activeTab === 'market-clocks' ? (
        <div className="h-full overflow-y-auto"><MarketClocksView clocks={marketClocks} onClockClick={() => { }} onPinClock={() => { }} /></div>
        ) : activeTab === 'competitions' ? (
        <div className="h-full overflow-y-auto"><CompetitionsView clocks={marketClocks} onSubmitPortfolio={() => { }} /></div>
        ) : activeTab === 'creator' ? (
        <div className="h-full overflow-y-auto"><CreatorModeView clocks={marketClocks} /></div>
        ) : activeTab === 'features' ? (
        <div className="h-full overflow-y-auto p-4">
          <h2 className="text-xl font-bold mb-4 font-mono text-cyan-400">AVAILABLE_MODULES</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(FEATURE_CONFIG).map(([name, config]) => (
              <div key={name} className="bg-slate-900/40 border border-cyan-900/30 p-4 hover:border-cyan-500 hover:bg-cyan-900/10 cursor-pointer transition-all" onClick={() => { setActiveFeature({ name, symbols: ['SPY'], content: null }); setActiveTab('feature-detail'); }}>
                <h3 className="text-cyan-400 font-bold font-mono text-sm mb-1">{name}</h3>
                <p className="text-[10px] text-slate-500">{config.description}</p>
              </div>
            ))}
          </div>
        </div>
        ) : activeTab === 'feature-detail' && activeFeature ? (
        <FeatureDetailView featureName={activeFeature.name} symbols={activeFeature.symbols} content={activeFeature.content} isLoading={false} onBack={() => setActiveTab('features')} onRerun={() => { }} />
        ) : activeTab === 'entity-detail' && selectedEntity ? (
        <EntityDetailView entity={selectedEntity} freshnessThreshold={0} onBack={() => setActiveTab('command-center')} onRunAnalysis={() => { }} researchContent={null} />
          ) : null}
      </div>

      {/* BOTTOM: Collapsible Console Drawer (Hidden on Command Center View) */}
      {activeTab !== 'command-center' && (
        <div
          className={`
                  flex-shrink-0 relative z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] border-t border-slate-800 bg-slate-950 transition-all duration-300 ease-in-out
                  ${isConsoleOpen ? 'h-[350px]' : 'h-[48px]'}
              `}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 opacity-20"></div>

          {/* Toggle Handle */}
          <div
            className={`
                absolute -top-5 left-1/2 -translate-x-1/2 w-48 h-8 rounded-t-xl flex items-center justify-center cursor-pointer z-30 transition-all
                ${isConsoleOpen
                ? 'bg-slate-900 border-t border-x border-slate-700 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'bg-cyan-900/80 border-t border-x border-cyan-500/50 shadow-[0_-4px_10px_rgba(6,182,212,0.3)] hover:bg-cyan-600'}
              `}
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white tracking-widest uppercase">{isConsoleOpen ? 'Minimize' : 'Terminal'}</span>
              <Icon icon="chevron-down" className={`w-4 h-4 text-white transition-transform duration-300 ${isConsoleOpen ? '' : 'rotate-180'}`} />
            </div>
          </div>

          {isConsoleOpen ? (
            <ConsoleWidget
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          ) : (
            /* Minimized State: Active Chat Input */
            <div className="h-full flex flex-col bg-slate-950 border-t border-slate-800">
              <div className="flex-1 px-2 pt-1">
                <ChatInput
                  onSendMessage={(msg, img) => {
                    handleSendMessage(msg, img);
                    setIsConsoleOpen(true);
                  }}
                  isLoading={isChatLoading}
                  isRecording={isRecording}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  compact={true}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {/* 5. FOOTER (TICKER) */ }
  <div className="hud-cell-footer justify-between">
    <span className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
      LIVE FEED :: MARKET OPEN
    </span>
    <span className="opacity-50">LATE_PACKET_LOSS: 0.00%</span>
  </div>

  {/* Overlays */ }
  {
    isMobileMenuOpen && (
      <div
        className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    )
  }
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNavigate={(tab) => { setActiveTab(tab as any); setIsCommandPaletteOpen(false); }} onSearch={(q) => { setActiveTab('command-center'); handleSendMessage(q); }} />
      <PortfolioReportModal isOpen={isPortfolioModalOpen} symbols={symbols} activeSymbol={null} isGenerating={isPortfolioGenerating} onClose={() => setIsPortfolioModalOpen(false)} onSubmit={handleGeneratePortfolioReport} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <BrokerConnectionModal isOpen={isBrokerModalOpen} onClose={() => setIsBrokerModalOpen(false)} />

  {/* MOBILE SIDEBAR OVERLAY */ }
  {
    isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 flex md:hidden font-sans">
        <div className="relative z-50 h-full">
          <HUDNav
            activeTab={activeTab}
            onNavigate={(tab) => {
              setActiveTab(tab as any);
              setIsMobileMenuOpen(false);
            }}
            marketStatus={marketStatus}
            activeJobsCount={activeJobs.length}
          />
        </div>
        {/* Backdrop */}
        <div
          className="flex-1 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      </div>
    )
  }

  {/* 6. MOBILE NAVIGATION - REMOVED per user request */ }
  {/* <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} /> */ }
    </div >
  );
};

const App: React.FC = () => {
  return (
    <JobProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </JobProvider>
  );
};

export default App;
