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
import { CompetitionsView } from './components/CompetitionsView';
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
import { GlassButton } from './components/ui/GlassButton';
import { JobProvider, useJobContext } from './contexts/JobContext';
import { getClocksForEntity, getGlobalClocks } from './lib/clockData';
import { EntityDetailView } from './components/EntityDetailView';

import { StorageService } from './lib/storage';

type MobileView = 'toolbox' | 'dashboard' | 'chat';

const DEFAULT_SYMBOLS: string[] = []; // Start empty, user adds tickers

const AppContent: React.FC = () => {
  const { startJob, confirmAction, activeJobsCount } = useJobContext();

  const [messages, setMessages] = useState<ChatMessageType[]>(() => [
    { id: 'welcome', role: 'model', content: "Commander, dashboard active. Systems are monitoring. Awaiting your orders." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [widgets, setWidgets] = useState<AnalysisWidget[]>(() => StorageService.loadWidgets());
  const [mobileView, setMobileView] = useState<MobileView>('toolbox');
  const [activeTab, setActiveTab] = useState<'command-center' | 'portfolio' | 'entity-detail' | 'competitions'>('command-center');

  // Sidebar State
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Selected Entity State
  const [selectedEntity, setSelectedEntity] = useState<MarketClock | null>(null);

  // Persistent Research Reports
  const [researchReports, setResearchReports] = useState<Record<string, string>>(() => StorageService.loadReports());

  // User Settings
  const [dataFreshnessHours, setDataFreshnessHours] = useState<number>(() => StorageService.loadSettings().freshnessHours);

  const analysisModelId = DEFAULT_CHAT_MODEL.id;
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);

  // ... (rest of the file)

  const isStale = (timestamp?: number) => {
    if (!timestamp) return true;
    return (Date.now() - timestamp) > (dataFreshnessHours * 60 * 60 * 1000);
  };

  // ...


  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]); // Multi-select support
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isPortfolioGenerating, setIsPortfolioGenerating] = useState(false);
  const [scanningTarget, setScanningTarget] = useState<string | null>(null);

  // Agent State
  const [agentOutput, setAgentOutput] = useState<string | null>(null);
  const [marketClocks, setMarketClocks] = useState<MarketClock[]>(() => {
    const saved = StorageService.loadClocks();
    return saved || getGlobalClocks();
  });

  // Research History for tracking changes over time
  const [researchHistory, setResearchHistory] = useState<Record<string, { content: string; timestamp: number; status?: string }[]>>(() => StorageService.loadResearchHistory());

  const [uncuratedTicker, setUncuratedTicker] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [expandedSleeves, setExpandedSleeves] = useState<Record<string, boolean>>({ 'Core Tech': true });

  // PERSISTENCE EFFECT HOOKS
  useEffect(() => { StorageService.saveWidgets(widgets); }, [widgets]);
  useEffect(() => { StorageService.saveReports(researchReports); }, [researchReports]);
  useEffect(() => { StorageService.saveClocks(marketClocks); }, [marketClocks]);
  useEffect(() => { StorageService.saveSettings({ freshnessHours: dataFreshnessHours }); }, [dataFreshnessHours]);
  useEffect(() => { StorageService.saveResearchHistory(researchHistory); }, [researchHistory]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loadedSnapshotsRef = useRef<Set<string>>(new Set());

  const toggleSleeve = (sleeve: string) => {
    setExpandedSleeves(prev => ({ ...prev, [sleeve]: !prev[sleeve] }));
  };

  const sleeves = UNIVERSE.reduce((acc, ticker) => {
    if (!acc[ticker.sleeve]) acc[ticker.sleeve] = [];
    acc[ticker.sleeve].push(ticker);
    return acc;
  }, {} as Record<string, typeof UNIVERSE>);

  const getMockTickerStatus = (symbol: string): 'green' | 'yellow' | 'red' => {
    const sum = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = sum % 3;
    return mod === 0 ? 'green' : mod === 1 ? 'yellow' : 'red';
  };

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
    setUncuratedTicker(null);
  };

  const handleActionOverride = () => {
    setUncuratedTicker(null);
  };

  const checkCurated = (symbol: string) => {
    const isCurated = UNIVERSE.some(t => t.symbol === symbol);
    if (!isCurated) {
      setUncuratedTicker(symbol);
    } else {
      setUncuratedTicker(null);
    }
  };



  // Auto-scroll chat
  useEffect(() => {
    if (!chatContainerRef.current) return;
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
    if (loadedSnapshotsRef.current.has(upper)) return;
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
    symbols.forEach(symbol => { ensureSnapshotForSymbol(symbol); });
  }, [symbols, ensureSnapshotForSymbol]);

  const renderWidget = (widget: AnalysisWidget) => {
    switch (widget.type) {
      case 'divergence': return <StockDivergenceChart id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'ghost': return <GhostPatternChart id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'options': return <OptionsStrategyCard id={widget.id} data={widget.data} onRemove={removeWidget} />;
      case 'portfolio': return <PortfolioReportWidget id={widget.id} title={widget.title} data={widget.data} onRemove={removeWidget} />;
      default: return <TextWidget id={widget.id} title={widget.title} text={widget.data?.text ?? ''} sources={widget.data?.sources} onRemove={removeWidget} />;
    }
  };

  // Handle analysis request for selected symbols (multi-select support)
  const handleAnalysisRequest = async (featureType: string, symbols: string[]) => {
    if (symbols.length === 0) return;

    // Run analysis on each selected symbol
    for (const rawSymbol of symbols) {
      const symbol = rawSymbol.trim().toUpperCase();
      if (!symbol) continue;
      checkCurated(symbol);

      // Navigate to entity detail page for first symbol
      if (symbol === symbols[0]) {
        handleSelectSymbol(symbol);
      }

      // Run the agent scan
      handleRunAgentScan('TOOL', symbol, featureType);
    }
  };

  const handleSendMessage = async (message: string, image?: File) => {
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
            const sleeves = ['CORE TECH', 'ROTATABLE TECH', 'ENERGY', 'METALS', 'CASH', 'OPTIONS'];
            if (sleeves.some(s => target.includes(s) || s.includes(target))) {
              handleRunAgentScan('SLEEVE', target);
              responseText = `Initiating Sleeve Scan for ${target}... check the Job Status.`;
            } else {
              handleRunAgentScan('TICKER', target);
              responseText = `Initiating Ticker Analysis for ${target}... check the Job Status.`;
            }
          } else {
            responseText = "Please specify a target to analyze.";
          }
        } else {
          const history = messages
            .filter(m => (m.role === 'user' || m.role === 'model') && !m.isLoading)
            .map(m => ({
              role: m.role as 'user' | 'model',
              parts: [{ text: m.content }],
            }));
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
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Audio recording not supported.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const handleAddSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setSymbols(prev => (prev.includes(upper) ? prev : [...prev, upper]));
    // Auto-select newly added symbol
    setSelectedSymbols(prev => prev.includes(upper) ? prev : [...prev, upper]);
    ensureSnapshotForSymbol(upper);
  };

  const handleRemoveSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setSymbols(prev => prev.filter(s => s !== upper));
    setSelectedSymbols(prev => prev.filter(s => s !== upper));
    setWidgets(prev => prev.filter(widget => !widget.title?.includes(upper)));
  };

  // HANDLER: Toggle Symbol Selection (multi-select)
  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)  // Deselect
        : [...prev, symbol]               // Select
    );
  };

  // HANDLER: Symbol Selection (with Routing) - navigates to entity page
  const handleSelectSymbol = (symbol: string) => {
    // UPDATE URL (Native Routing)
    const url = new URL(window.location.href);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('tab', 'entity-detail');
    window.history.pushState({}, '', url.toString());

    // Look for persisted data from ticker's VOL clock
    const tickerVolClock = marketClocks.find(c => c.code === `${symbol}_VOL`);
    const entity: MarketClock = tickerVolClock ? {
      code: symbol,
      label: symbol,
      status: tickerVolClock.status,
      lastUpdated: tickerVolClock.lastUpdated,
      reason: tickerVolClock.reason
    } : {
      code: symbol,
      label: symbol,
      status: 'gray', // No persisted data - stale
      lastUpdated: 0,
      reason: 'Manually selected'
    };
    setSelectedEntity(entity);
    setActiveTab('entity-detail');

    // removed toast to reduce annoyance as per user request
  };

  // EFFECT: Handle Browser Navigation (PopState) & Initial Load
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const symbol = params.get('symbol');
      const tab = params.get('tab') as any;

      if (symbol) {
        // Restore symbol state, preferring persisted data from ticker clocks
        // (selectedSymbols is not restored from URL, only selectedEntity for viewing)

        // Look for the ticker's VOL clock to get persisted timestamp/status
        const tickerVolClock = marketClocks.find(c => c.code === `${symbol}_VOL`);
        if (tickerVolClock) {
          // Use persisted data from the VOL clock
          setSelectedEntity({
            code: symbol,
            label: symbol,
            status: tickerVolClock.status,
            lastUpdated: tickerVolClock.lastUpdated,
            reason: tickerVolClock.reason
          });
        } else {
          // No persisted data - create fresh entity
          setSelectedEntity({
            code: symbol,
            label: symbol,
            status: 'gray',
            lastUpdated: 0,
            reason: 'Restored from URL'
          });
        }
        setActiveTab('entity-detail');
      } else if (tab) {
        setActiveTab(tab);
      } else {
        // Default to dashboard if no params
        setActiveTab('command-center');
      }
    };

    // Listen for back/forward buttons
    window.addEventListener('popstate', handlePopState);

    // Run once on mount
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, [marketClocks]); // Depend on marketClocks to ensure we find the entity if loaded

  const handleGeneratePortfolioReport = async (tickers: string[], goal: string) => {
    setIsPortfolioGenerating(true);
    try {
      await startJob("Generating Portfolio Report", async () => {
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
      }, 'REPORT');
    } catch (error) {
      console.error('Failed to generate portfolio report:', error);
    } finally {
      setIsPortfolioGenerating(false);
    }
  };

  const executeAgentScan = async (scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL', target?: string, toolName?: string) => {
    setScanningTarget(target || scope); // Track which ticker is being scanned
    setAgentOutput(`Initializing ${scope} scan...`);

    let searchContext = "";
    try {
      // FIX: Enable Grounding Search for TOOLS (Macro) as well as TICKERS
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

    const res = await (window.fetch as any)('/api/agent/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope,
        target: scope === 'TOOL' ? target : target,
        tool: toolName || (scope === 'TOOL' ? target : undefined),
        context: searchContext
      })
    });
    const data = await res.json();

    // ... rest of function
    const finalAnalysis = searchContext ? `${data.analysis}\n${searchContext}` : (data.analysis || "Analysis complete.");

    setAgentOutput(finalAnalysis);

    // <<< PERSISTENCE LOGIC >>>

    // 1. Save the report to the persistent store
    if (finalAnalysis) {
      const reportKey = scope === 'TOOL' ? (toolName || target || 'unknown') : (target || scope);
      setResearchReports(prev => ({
        ...prev,
        [reportKey]: finalAnalysis
      }));

      // Also save to research history for tracking changes over time
      setResearchHistory(prev => {
        const entries = prev[reportKey] || [];
        const newEntry = { content: finalAnalysis, timestamp: Date.now() };
        return { ...prev, [reportKey]: [newEntry, ...entries].slice(0, 10) };
      });
    }

    // 2. Refresh Clocks (Timestamps)
    const timestamp = Date.now();
    if (data.clocks && (data.clocks as MarketClock[]).length > 0) {
      // FULL scan or macro tool - update macro clocks from API response
      setMarketClocks(prev => {
        if (!prev) return data.clocks;
        const newClocks = data.clocks as MarketClock[];
        const updated = [...prev];
        newClocks.forEach(nc => {
          const idx = updated.findIndex(oc => oc.code === nc.code);
          if (idx >= 0) {
            updated[idx] = { ...nc, lastUpdated: timestamp };
          } else {
            updated.push({ ...nc, lastUpdated: timestamp });
          }
        });
        return updated;
      });
    } else if (scope === 'TICKER' && target) {
      // TICKER scan - create/update ticker-specific clocks
      const tickerClocks = getClocksForEntity('TICKER', target);
      let updatedClocks: MarketClock[] = [];

      setMarketClocks(prev => {
        const updated = [...prev];
        tickerClocks.forEach(nc => {
          // Get AI-provided status or default to yellow
          const aiClock = data.clocks ? (data.clocks as MarketClock[]).find((c: any) => c.code === nc.code) : null;
          const freshClock = aiClock ? {
            ...aiClock,
            lastUpdated: timestamp
          } : {
            ...nc,
            lastUpdated: timestamp,
            status: 'yellow' as const, // Default to neutral if AI didn't analyze
            reason: 'Analysis pending'
          };
          const idx = updated.findIndex(oc => oc.code === nc.code);
          if (idx >= 0) {
            updated[idx] = freshClock;
          } else {
            updated.push(freshClock);
          }
        });
        updatedClocks = updated;
        return updated;
      });

      // Update selected entity if it matches this ticker
      if (selectedEntity) {
        const ticker = selectedEntity.code.split('_')[0];
        if (ticker === target || selectedEntity.code === target) {
          // Get status from any of the ticker's clocks (e.g., AVGO_VOL, AVGO_MOM)
          // The selectedEntity.code might be just "AVGO", so we look for AVGO_* clocks
          const tickerClockCode = `${target}_VOL`; // Use VOL as primary indicator
          const aiClock = data.clocks ?
            (data.clocks as MarketClock[]).find((c: any) => c.code === tickerClockCode) :
            null;
          const aiStatus = aiClock?.status || 'yellow';

          setSelectedEntity({
            code: selectedEntity.code,
            label: selectedEntity.label,
            lastUpdated: timestamp,
            status: aiStatus,
            reason: aiClock?.reason || 'Fresh analysis completed'
          });
        }
      }
    } else if (scope === 'TOOL' && toolName) {
      // TOOL scan fallback - update the specific tool clock if it exists
      setMarketClocks(prev => prev.map(c =>
        c.code === toolName
          ? { ...c, lastUpdated: timestamp, status: 'green', reason: 'Fresh analysis: Stable' }
          : c
      ));

      // Also update the selected entity live
      if (selectedEntity && selectedEntity.code === toolName) {
        setSelectedEntity({
          ...selectedEntity,
          lastUpdated: timestamp,
          status: 'green',
          reason: 'Fresh analysis: Stable'
        });
      }
    }

    // FINAL SYNC: Ensure selected entity matches one of the updated clocks if possible
    // Only for FULL scans - ticker scans already updated selectedEntity above
    if (scope === 'FULL' && data.clocks && selectedEntity) {
      const updatedClock = (data.clocks as MarketClock[]).find(c => c.code === selectedEntity.code);
      if (updatedClock) {
        setSelectedEntity({ ...updatedClock, lastUpdated: timestamp });
      }
    }

    const widget: AnalysisWidget = {
      id: `agent-${Date.now()}`,
      type: 'profile',
      title: `Agent Report (${scope === 'TOOL' ? toolName || target : scope})`,
      data: { text: finalAnalysis, sources: [] }
    };
    setWidgets(prev => [widget, ...prev]);
    setMobileView('dashboard');
    setScanningTarget(null);

    return finalAnalysis; // Return analysis for use in chat
  };

  const handleRunAgentScan = async (scope: 'FULL' | 'SLEEVE' | 'TICKER' | 'TOOL', target?: string, toolName?: string) => {
    if (scope === 'TICKER' && target) {
      checkCurated(target);
    } else {
      setUncuratedTicker(null);
    }

    const scanLabel = scope === 'TOOL' ? (toolName || target) : (target || scope);
    const loadingMsgId = `scan-${Date.now()}`;

    // Add loading message to chat (Command Center)
    const loadingMessage: ChatMessageType = {
      id: loadingMsgId,
      role: 'model',
      content: `🤖 **Analyzing ${scanLabel}...**\n\nGathering live market data and news. This may take up to 60 seconds.`,
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    // Run the scan
    try {
      const analysisContent = await executeAgentScan(scope, target, toolName);

      // Update chat with actual research content
      const completionMessage: ChatMessageType = {
        id: loadingMsgId,
        role: 'model',
        content: `✅ **${scanLabel} Analysis Complete**\n\n${analysisContent || 'Analysis complete. Check the research panel for details.'}`,
        isLoading: false
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMsgId ? completionMessage : msg));
    } catch (error) {
      // Update chat with error message
      const errorMessage: ChatMessageType = {
        id: loadingMsgId,
        role: 'model',
        content: `❌ **Analysis of ${scanLabel} failed.**\n\nPlease try again later.`,
        isLoading: false
      };
      setMessages(prev => prev.map(msg => msg.id === loadingMsgId ? errorMessage : msg));
    }
  };

  const handleViewEntityDetail = (entity: MarketClock) => {
    setSelectedEntity(entity);
    setActiveTab('entity-detail');
  };

  // ... 

  // FIX: Ensure Sidebar Toggle is Clickable (z-index)
  // Inside the main return block...


  useEffect(() => {
    const loadPersistedRun = async () => {
      try {
        const res = await (window.fetch as any)('/api/agent/latest');
        if (res.ok) {
          const data = await res.json();
          if (data && data.analysis) {
            setAgentOutput(data.analysis);
            if (data.clocks) {
              setMarketClocks(prev => {
                if (!prev) return data.clocks;
                const newClocks = data.clocks as MarketClock[];
                const updated = [...prev];
                newClocks.forEach(nc => {
                  const idx = updated.findIndex(oc => oc.code === nc.code);
                  if (idx >= 0) updated[idx] = nc;
                  else updated.push(nc);
                });
                return updated;
              });
            }
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

      {/* LEFT COLUMN: Portfolio & Actions */}
      {/* LEFT COLUMN: Portfolio & Actions */}
      <div className={`${isLeftSidebarOpen ? 'w-[300px] xl:w-[350px] border-r min-w-[300px]' : 'w-0 border-none min-w-0'} flex-shrink-0 flex flex-col border-slate-800 bg-slate-900/40 transition-all duration-300 overflow-hidden relative`}>
        <div className="min-w-[300px] w-[300px] h-full flex flex-col">
          <div className="h-[60px] px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-50">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-cyan-600 to-purple-700 rounded-lg shadow-lg">
                <Icon icon="bot" className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none">
                  StockCommand
                </h1>
              </div>
            </div>

            <button onClick={() => setIsLeftSidebarOpen(false)} title="Collapse Sidebar" className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-cyan-400 font-bold tracking-wider transition-colors z-50 whitespace-nowrap">
              CLOSE &lt;
            </button>
          </div>

          <div className="p-3 bg-slate-900 border-b border-slate-800 font-semibold text-xs text-cyan-400 tracking-wider">
            PORTFOLIO CONTEXT
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
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

            <Toolbox
              symbols={symbols}
              selectedSymbols={selectedSymbols}
              onAddSymbol={handleAddSymbol}
              onRemoveSymbol={handleRemoveSymbol}
              onToggleSymbol={handleToggleSymbol}
              onAnalysisRequested={handleAnalysisRequest}
              onPortfolioReport={() => setIsPortfolioModalOpen(true)}
              onThesisChange={() => {
                // Start thesis change discussion in chat
                const thesisMessage: ChatMessageType = {
                  id: `thesis-${Date.now()}`,
                  role: 'model',
                  content: `🎯 **Thesis Change Mode Active**\n\nI'm ready to discuss changes to your portfolio thesis. You have control over all strategic decisions.\n\n**Current framework includes:**\n- Core Tech (structural holdings)\n- Rotatable Tech (cyclical positions)\n- Specialized sleeves (Energy, Defense, AI Infra, etc.)\n- Macro clocks for timing\n\n**What would you like to discuss?**\n1. Add/remove tickers from a sleeve\n2. Create a new specialized sleeve\n3. Adjust allocation weights\n4. Modify rotation triggers\n5. Something else?\n\nTell me what you're thinking and we'll debate IT!`,
                  isLoading: false
                };
                setMessages(prev => [...prev, thesisMessage]);
                setActiveTab('command-center');
              }}
              isLoading={isDashboardLoading}
            />
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: Command Center (Flexible) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative border-r border-slate-800 transition-all duration-300">

        {/* TOP BAR: Navigation & Status */}
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-50 relative">
          <div className="flex items-center gap-3">
            {!isLeftSidebarOpen && (
              <button onClick={() => setIsLeftSidebarOpen(true)} className="px-3 py-1 bg-cyan-900/50 hover:bg-cyan-800/80 border border-cyan-500/50 text-cyan-300 rounded text-xs font-bold tracking-wider shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all z-50 flex gap-2 items-center whitespace-nowrap">
                <span>OPEN TOOLBOX</span>
                <Icon icon="chevron-down" className="w-3 h-3 -rotate-90" />
              </button>
            )}

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
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('competitions')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${activeTab === 'competitions'
                  ? 'bg-slate-800 text-purple-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
              >
                🏆 Compete
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/50 bg-slate-900/30 px-2 py-1 rounded border border-slate-800/30">
              <Icon icon="terminal" className="w-3 h-3" />
              <span>AGENT COMMAND</span>
            </div>
            {!isRightSidebarOpen && (
              <button onClick={() => setIsRightSidebarOpen(true)} className="px-3 py-1 bg-amber-900/50 hover:bg-amber-800/80 border border-amber-500/50 text-amber-300 rounded text-xs font-bold tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all z-50 flex gap-2 items-center whitespace-nowrap">
                <Icon icon="chevron-down" className="w-3 h-3 rotate-90" />
                <span>OPEN CLOCKS</span>
              </button>
            )}
          </div>
        </div>

        {/* LOADING PROGRESS LINE */}
        {activeJobsCount > 0 && (
          <div className="absolute top-[60px] left-0 right-0 h-[2px] bg-amber-500/50 overflow-hidden z-30">
            <div className="absolute inset-0 bg-amber-400 animate-progress origin-left"></div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'entity-detail' ? (
            // <<< ENTITY DETAIL VIEW >>>
            <EntityDetailView
              entity={selectedEntity}
              freshnessThreshold={dataFreshnessHours * 60 * 60 * 1000}
              onBack={() => setActiveTab('command-center')}
              onRunAnalysis={(e) => {
                // Extract ticker symbol from entity code (e.g., "AMZN_VOL" -> "AMZN")
                const ticker = e.code.split('_')[0];
                executeAgentScan('TICKER', ticker);
              }}
              researchContent={selectedEntity ? researchReports[selectedEntity.code.split('_')[0]] : null}
              isScanning={scanningTarget !== null && selectedEntity !== null && (scanningTarget === selectedEntity.code || scanningTarget === selectedEntity.code.split('_')[0])}
              researchHistory={selectedEntity ? researchHistory[selectedEntity.code.split('_')[0]] : undefined}
              onViewHistory={() => {
                if (selectedEntity) {
                  const ticker = selectedEntity.code.split('_')[0];
                  const history = researchHistory[ticker];
                  if (history && history.length > 0) {
                    const historyText = history.map((h, i) =>
                      `--- Entry ${i + 1} (${new Date(h.timestamp).toLocaleString()}) ---\n${h.content.substring(0, 500)}...`
                    ).join('\n\n');
                    alert(`Research History for ${ticker}:\n\n${historyText}`);
                  }
                }
              }}
            />
          ) : activeTab === 'command-center' ? (
            // <<< COMMAND CENTER VIEW >>>
            <>
              {/* Header with Freshness Settings */}
              <div className="flex justify-between items-end p-8 border-b border-slate-800/50">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
                  <p className="text-gray-400">System Status & tactical overview.</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Data Validity:</span>
                  <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
                    {[24, 168, 720].map(hours => (
                      <button
                        key={hours}
                        onClick={() => setDataFreshnessHours(hours)}
                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${dataFreshnessHours === hours ? 'bg-slate-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {hours === 24 ? '24H' : hours === 168 ? '7D' : '30D'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Controls Overlay */}
              <div className="p-4 border-b border-slate-800/50 flex gap-2 overflow-x-auto bg-slate-900/20">
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleRunAgentScan('FULL')}
                >
                  RUN FULL SCAN
                </GlassButton>

                <div className="h-6 w-px bg-slate-700 mx-1" />

                {[
                  { label: 'Liquidity Cycle', code: 'CLOCK_LIQUIDITY_CYCLE' },
                  { label: 'Commodity Cycle', code: 'CLOCK_COMMODITY_CYCLE' },
                  { label: 'VIX Regime', code: 'CLOCK_VIX_REGIME' },
                  { label: 'Inflation Trend', code: 'CLOCK_INFLATION_TREND' },
                  { label: 'Credit Impulse', code: 'CLOCK_CREDIT_IMPULSE' },
                  { label: 'Dollar Strength', code: 'CLOCK_DOLLAR_STRENGTH' }
                ].map((tool, i) => (
                  <GlassButton
                    key={i}
                    variant="glass"
                    size="sm"
                    onClick={() => handleRunAgentScan('TOOL', tool.code, tool.code)}
                  >
                    {tool.label}
                  </GlassButton>
                ))}

                <div className="h-6 w-px bg-slate-700 mx-1" />

                <select
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
                  onChange={(e) => {
                    if (e.target.value) handleRunAgentScan('SLEEVE', e.target.value);
                    e.target.value = "";
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

              {/* Chat Input Area */}
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
                {/* Warnings */}
                {uncuratedTicker && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
                    <h3 className="text-red-400 font-bold text-sm">Uncurated Ticker: {uncuratedTicker}</h3>
                    <div className="flex gap-2 mt-2">
                      <GlassButton size="sm" variant="danger" onClick={handleActionOverride}>Override</GlassButton>
                      <GlassButton size="sm" variant="glass" onClick={() => setUncuratedTicker(null)}>Cancel</GlassButton>
                    </div>
                  </div>
                )}

                {/* Combined Feed */}
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className="animate-fadeIn">
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

                {/* Widgets */}
                {widgets.filter(w => !w.title.includes('Agent')).map(widget => (
                  <div key={widget.id} className="animate-fadeIn">{renderWidget(widget)}</div>
                ))}
              </div>

              <div ref={chatContainerRef} />
            </>
          ) : activeTab === 'competitions' ? (
            // <<< COMPETITIONS VIEW >>>
            <CompetitionsView
              onSubmitPortfolio={() => {
                // Create submit portfolio message in chat
                const submitMessage: ChatMessageType = {
                  id: `submit-${Date.now()}`,
                  role: 'model',
                  content: `📤 **Submit Portfolio for Competition**\n\nTo enter a competition, you'll need to:\n1. Have at least 3 tickers in your portfolio\n2. Define your thesis strategy\n3. Set your competition entry\n\nYour current portfolio has ${symbols.length} ticker(s).\n\n${symbols.length >= 3 ? '✅ You meet the minimum requirements!' : '⚠️ Add more tickers to qualify.'}\n\n*Note: Competition features coming soon with full Cloudflare D1 integration.*`,
                  isLoading: false
                };
                setMessages(prev => [...prev, submitMessage]);
                setActiveTab('command-center');
              }}
            />
          ) : (
            // <<< PORTFOLIO VIEW >>>
            <PortfolioView
              sleevesWithStats={sleevesWithStats}
              onClockClick={handleViewEntityDetail}
              freshnessThreshold={dataFreshnessHours * 60 * 60 * 1000}
            />
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Market Data & Clocks */}
      {/* RIGHT COLUMN: Market Data & Clocks */}
      <div className={`${isRightSidebarOpen ? 'w-[300px] xl:w-[350px] border-l min-w-[300px]' : 'w-0 border-none min-w-0'} flex-shrink-0 flex flex-col bg-slate-900/40 border-slate-800 transition-all duration-300 overflow-hidden relative`}>
        <div className="min-w-[300px] w-[300px] h-full flex flex-col">
          <div className="h-[60px] px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-50">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsRightSidebarOpen(false)} title="Collapse Clocks" className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-amber-500 font-bold tracking-wider transition-colors z-50 whitespace-nowrap">
                &gt; CLOSE
              </button>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-xs text-gray-400 font-medium">LIVE</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="space-y-3">
              {/* Only show macro clocks in sidebar, not ticker clocks */}
              {marketClocks.filter(clock => clock.code.startsWith('CLOCK_')).map(clock => {
                const stale = isStale(clock.lastUpdated);
                return (
                  <div key={clock.code}
                    className={`bg-slate-800/50 p-3 rounded border transition-colors cursor-pointer relative ${stale ? 'border-amber-500/50 hover:bg-amber-900/10' : 'border-slate-700/50 hover:border-amber-500/50'}`}
                    onClick={() => handleViewEntityDetail(clock)}>

                    {/* Action Needed Badge */}
                    {stale && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border border-slate-900 z-10" title="Action Needed: Update Stale Data" />
                    )}

                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-medium ${stale ? 'text-gray-500' : 'text-gray-400'}`}>{clock.label}</span>
                      <div className={`w-2 h-2 rounded-full shadow-md ${stale ? 'bg-slate-700' : (clock.status === 'green' ? 'bg-emerald-500' : clock.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500')}`} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Portfolio Sleeves</div>
              <div className="space-y-2">
                {sleevesWithStats.map(({ sleeveName, items, stats }) => (
                  <div key={sleeveName} className="border border-slate-800 rounded bg-slate-900/30 overflow-hidden">
                    <div className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => toggleSleeve(sleeveName)}>
                      <span className="text-xs font-bold text-gray-300">{sleeveName}</span>
                      <Icon icon="chevron-down" className={`w-3 h-3 text-gray-500 transition-transform ${expandedSleeves[sleeveName] ? 'rotate-180' : ''}`} />
                    </div>
                    {expandedSleeves[sleeveName] && (
                      <div className="bg-slate-950/50 border-t border-slate-800/50">
                        {items.map(ticker => {
                          const tickerClocks = getClocksForEntity('TICKER', ticker.symbol);
                          return (
                            <div key={ticker.symbol} className="px-3 py-2 flex flex-col gap-2 hover:bg-slate-800/30 border-l-2 border-transparent hover:border-blue-500 transition-all cursor-pointer"
                              onClick={() => handleSelectSymbol(ticker.symbol)}>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-mono text-cyan-400">{ticker.symbol}</span>
                              </div>
                              {/* Ticker Clocks Row - visual indicators only */}
                              <div className="flex gap-1">
                                {tickerClocks.map(c => {
                                  // Look up clock in marketClocks for current status
                                  const storedClock = marketClocks.find(mc => mc.code === c.code);
                                  const clockStatus = storedClock?.status || c.status;
                                  const clockReason = storedClock?.reason || c.reason;
                                  const clockTimestamp = storedClock?.lastUpdated || c.lastUpdated;
                                  return (
                                    <div
                                      key={c.code}
                                      title={`${c.label}: ${clockReason}`}
                                      className={`w-1.5 h-1.5 rounded-full ${isStale(clockTimestamp) ? 'bg-slate-700' : (clockStatus === 'green' ? 'bg-emerald-500' : clockStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500')}`}
                                    />
                                  );
                                })}
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
        </div>
      </div>

      <PortfolioReportModal
        isOpen={isPortfolioModalOpen}
        symbols={symbols}
        activeSymbol={selectedSymbols[0] || null}
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

const App: React.FC = () => {
  return (
    <JobProvider>
      <AppContent />
    </JobProvider>
  );
};



export default App;
