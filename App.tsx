import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HUDNav } from './components/HUDNav';
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
import { LoadingSpinner } from './components/LoadingSpinner';
import { Icon } from './components/Icon';

import type { ChatMessage as ChatMessageType, Source } from './types';
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

  const [messages, setMessages] = useState<ChatMessageType[]>(() => [
    { id: 'welcome', role: 'model', content: "Tactical OS v2.0 initialized. Systems nominal. Awaiting directives." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [widgets, setWidgets] = useState<AnalysisWidget[]>(() => StorageService.loadWidgets());
  const [activeTab, setActiveTab] = useState<'command-center' | 'portfolio' | 'entity-detail' | 'competitions' | 'feature-detail' | 'features' | 'creator' | 'market-clocks'>('command-center');
  const [activeFeature, setActiveFeature] = useState<{ name: string; symbols: string[]; content: string | null } | null>(null);

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
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isPortfolioGenerating, setIsPortfolioGenerating] = useState(false);
  const [scanningTarget, setScanningTarget] = useState<string | null>(null);
  const [agentOutput, setAgentOutput] = useState<string | null>(null);

  const [marketClocks, setMarketClocks] = useState<MarketClock[]>(() => {
    const saved = StorageService.loadClocks();
    return saved || getGlobalClocks();
  });

  const [researchHistory, setResearchHistory] = useState<Record<string, { content: string; timestamp: number; status?: string }[]>>(() => StorageService.loadResearchHistory());
  const [uncuratedTicker, setUncuratedTicker] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // PERSISTENCE EFFECT HOOKS
  useEffect(() => { StorageService.saveWidgets(widgets); }, [widgets]);
  useEffect(() => { StorageService.saveReports(researchReports); }, [researchReports]);
  useEffect(() => { StorageService.saveClocks(marketClocks); }, [marketClocks]);
  useEffect(() => { StorageService.saveSettings({ freshnessHours: dataFreshnessHours }); }, [dataFreshnessHours]);
  useEffect(() => { StorageService.saveResearchHistory(researchHistory); }, [researchHistory]);

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
          const context = { latestReport: agentOutput, activeTickers: selectedSymbols };
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
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => (msg.id === modelMessageId ? { ...msg, content: 'Error processing request.', isLoading: false } : msg)));
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

  const sleevesWithStats = [];

  return (
    <div className="flex h-screen bg-slate-950 text-gray-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      <HUDNav
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab as any)}
        activeJobsCount={activeJobsCount}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* BACKGROUND EFFECT */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* LEFT HUD PANEL (Fixed) */}
        <div className="w-80 flex flex-col gap-4 p-4 z-10 hidden xl:flex pointer-events-none border-r border-slate-800/50 bg-slate-950/20 backdrop-blur-sm">
          <div className="pointer-events-auto h-auto"><StatusWidget /></div>
          <div className="pointer-events-auto flex-1 h-full"><LogicPipeline steps={pipelineSteps} /></div>
        </div>

        {/* CENTER VIEWPORT (Dynamic) */}
        <div className="flex-1 flex flex-col relative z-20 overflow-hidden">

          {/* Top Bar / Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-cyan-500 tracking-widest font-mono">
                STOCK_COMMAND <span className="text-slate-600">v2.1</span>
              </h1>
              {scanningTarget && <span className="text-xs text-orange-400 animate-pulse">SCANNING: {scanningTarget}</span>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsCommandPaletteOpen(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Icon icon="search" className="w-4 h-4" /></button>
              <button onClick={() => setIsProfileOpen(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Icon icon="user" className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative p-4 flex flex-col">
            {activeTab === 'command-center' ? (
              <>
                <div className="flex-none h-64 mb-4 flex items-center justify-center shrink-0">
                  <CentralCommand activeMode={scanningTarget ? 'SCANNING' : 'READY'} status={scanningTarget ? 'warning' : 'optimal'} />
                </div>
                <div className="flex-1 min-h-0">
                  <ConsoleWidget
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                    isRecording={isRecording}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                  />
                </div>
              </>
            ) : activeTab === 'portfolio' ? (
              <div className="h-full overflow-y-auto"><PortfolioView sleevesWithStats={sleevesWithStats} onClockClick={() => { }} freshnessThreshold={0} /></div>
            ) : activeTab === 'market-clocks' ? (
              <div className="h-full overflow-y-auto"><NetworkTopology nodes={marketClocks} /></div>
            ) : activeTab === 'competitions' ? (
              <div className="h-full overflow-y-auto"><CompetitionsView clocks={marketClocks} onSubmitPortfolio={() => { }} /></div>
            ) : activeTab === 'creator' ? (
              <div className="h-full overflow-y-auto"><CreatorModeView /></div>
            ) : activeTab === 'features' ? (
              <div className="h-full overflow-y-auto p-4">
                <h2 className="text-xl font-bold mb-4">Features</h2>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(FEATURE_CONFIG).map(([name, config]) => (
                    <div key={name} className="hud-panel p-4 rounded hover:bg-slate-900 cursor-pointer" onClick={() => { setActiveFeature({ name, symbols: ['SPY'], content: null }); setActiveTab('feature-detail'); }}>
                      <h3 className="text-cyan-400 font-bold">{name}</h3>
                      <p className="text-xs text-slate-400">{config.description}</p>
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
        </div>

        {/* RIGHT HUD PANEL (Fixed) */}
        <div className="w-80 flex flex-col gap-4 p-4 z-10 hidden lg:flex pointer-events-none border-l border-slate-800/50 bg-slate-950/20 backdrop-blur-sm">
          <div className="pointer-events-auto h-2/3"><NetworkTopology nodes={marketClocks} /></div>
          <div className="pointer-events-auto flex-1"><MetricsAnalytics /></div>
        </div>

        {/* Command Palette */}
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNavigate={(tab) => { setActiveTab(tab as any); setIsCommandPaletteOpen(false); }} onSearch={(q) => { setActiveTab('command-center'); handleSendMessage(q); }} />
        <PortfolioReportModal isOpen={isPortfolioModalOpen} symbols={symbols} activeSymbol={null} isGenerating={isPortfolioGenerating} onClose={() => setIsPortfolioModalOpen(false)} onSubmit={handleGeneratePortfolioReport} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <JobProvider>
      <AppContent />
    </JobProvider>
  );
};

export default App;
