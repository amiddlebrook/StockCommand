import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { UNIVERSE, SECTOR_ETFS, SectorName } from '../lib/agent/universe';
import { MarketClock } from '../lib/agent/types';
// import { getClocksForEntity } from '../lib/clockData';
import { StorageService } from '../lib/storage';

interface TraditionalViewProps {
    clocks: MarketClock[];
    symbols: string[];
    onAddSymbol: (symbol: string) => void;
    onRemoveSymbol?: (symbol: string) => void;
    isAgentActive?: boolean;
    analysisData?: Record<string, any>;
}

// Types for API-ready mock data
interface TickerClocks {
    vol: 'green' | 'yellow' | 'red';  // Volatility
    mom: 'green' | 'yellow' | 'red';  // Momentum
    sent: 'green' | 'yellow' | 'red'; // Sentiment
    val: 'green' | 'yellow' | 'red';  // Valuation
}

interface TickerData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    sector: string;
    clocks: TickerClocks;
    isLoading?: boolean;
}

interface SectorPerformance {
    name: string;
    fullName: string;
    etf: string;
    changePercent: number; // ETF % change relative to SPY
    status: 'green' | 'yellow' | 'red';
    isLoading?: boolean;
}

interface PricePoint {
    day: number;
    price: number;
    volume: number;
}

// Time period options
const TIME_PERIODS = ['1D', '1W', '1M', '1Y', '5Y'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

// Open chart state
interface OpenChart {
    symbol: string;
    period: TimePeriod;
    isOpen: boolean;
}

// Agent Analysis Cache
interface AnalysisData {
    symbol: string;
    analysis: string;
    isLoading: boolean;
}

// Get all clock statuses for a ticker (4 metrics)
function getTickerClocks(symbol: string): TickerClocks {
    const clocks: any[] = []; // getClocksForEntity('TICKER', symbol);

    // Map clock codes to their statuses
    const findClockStatus = (suffix: string): 'green' | 'yellow' | 'red' => {
        const clock = clocks.find(c => c.code.endsWith(suffix));
        return clock?.status === 'gray' ? 'yellow' : (clock?.status || 'yellow');
    };

    return {
        vol: findClockStatus('_VOL'),
        mom: findClockStatus('_MOM'),
        sent: findClockStatus('_SENT'),
        val: findClockStatus('_VAL')
    };
}

// Skeleton Components
const SkeletonBar = () => (
    <div className="w-full h-full animate-pulse flex flex-col justify-end space-y-1">
        <div className="w-full bg-slate-800/50 rounded-t h-1/3"></div>
        <div className="w-full bg-slate-800/80 rounded-t h-2/3"></div>
    </div>
);

const SkeletonChart = () => (
    <div className="w-full h-full animate-pulse bg-slate-900/50 rounded border border-slate-800 flex items-center justify-center">
        <Icon icon="activity" className="w-8 h-8 text-slate-800" />
    </div>
);

const SkeletonTickerCard = () => (
    <div className="bg-slate-900/20 border border-slate-800/60 rounded-lg p-3 animate-pulse">
        <div className="flex justify-between mb-2">
            <div className="h-4 w-12 bg-slate-800 rounded"></div>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-800"></div>)}
            </div>
        </div>
        <div className="flex justify-between mt-2">
            <div className="h-2 w-16 bg-slate-800/50 rounded"></div>
            <div className="h-3 w-10 bg-slate-800 rounded"></div>
        </div>
    </div>
);

// Collapsible section component
const CollapsibleSection: React.FC<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}> = ({ title, isOpen, onToggle, children, headerActions }) => (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg overflow-hidden">
        <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
            onClick={onToggle}
        >
            <h2 className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-2">
                <Icon
                    icon="chevron-down"
                    className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                />
                {title}
            </h2>
            {headerActions && (
                <div onClick={e => e.stopPropagation()}>
                    {headerActions}
                </div>
            )}
        </div>
        <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-4 pt-0">
                {children}
            </div>
        </div>
    </div>
);

// Status dot component with optional tooltip
const StatusDot: React.FC<{ status: 'green' | 'yellow' | 'red'; label?: string }> = ({ status, label }) => {
    const colors = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500'
    };
    return (
        <span
            className={`w-2 h-2 rounded-full ${colors[status]}`}
            title={label}
        />
    );
};

// Multi-clock display for tickers
const TickerClockDots: React.FC<{ clocks: TickerClocks }> = ({ clocks }) => (
    <div className="flex items-center gap-0.5" title="VOL · MOM · SENT · VAL">
        <StatusDot status={clocks.vol} label="Volatility" />
        <StatusDot status={clocks.mom} label="Momentum" />
        <StatusDot status={clocks.sent} label="Sentiment" />
        <StatusDot status={clocks.val} label="Valuation" />
    </div>
);

export const TraditionalView: React.FC<TraditionalViewProps> = ({
    clocks = [],
    symbols = [],
    onAddSymbol,
    onRemoveSymbol,
    isAgentActive = false,
    analysisData = {}
}) => {
    // Safety check
    if (!Array.isArray(clocks)) {
        console.error("TraditionalView: clocks prop is not an array", clocks);
        return <div className="p-4 text-red-500">Error: Invalid Market Data</div>;
    }

    const [symbolInput, setSymbolInput] = useState('');
    const [openCharts, setOpenCharts] = useState<OpenChart[]>([]);
    const [localSymbols, setLocalSymbols] = useState<string[]>([]);
    const [hiddenSymbols, setHiddenSymbols] = useState<string[]>([]);
    const [watchlist, setWatchlist] = useState<string[]>(() => StorageService.loadWatchlist());

    // Real-time quote data from API
    const [realQuotes, setRealQuotes] = useState<Record<string, any>>({});
    const [isLoadingQuotes, setIsLoadingQuotes] = useState(true); // Default to true on mount

    // Collapsible states
    const [isSectorOpen, setIsSectorOpen] = useState(true);
    const [isTickersOpen, setIsTickersOpen] = useState(true);
    const [sectorPeriod, setSectorPeriod] = useState<TimePeriod>('1D');

    // Fetch real quotes from API - PRIORITY LOADING
    useEffect(() => {
        const fetchQuotes = async () => {
            const openChartSymbols = openCharts.map(c => c.symbol);
            const universeSymbols = UNIVERSE.slice(0, 10).map(t => t.symbol);
            const customSymbols = [...symbols, ...localSymbols];
            const sectorSymbols = [...Object.values(SECTOR_ETFS), 'SPY'];

            const prioritySymbols = [...new Set([...openChartSymbols, ...sectorSymbols, ...universeSymbols, ...customSymbols])];

            if (prioritySymbols.length === 0) {
                setIsLoadingQuotes(false);
                return;
            }

            // Don't set loading true here if we already have data (background refresh)
            // Only set it if we have NO data for these symbols? 
            // Better: just let the UI reflect "isLoading" if data is missing.
            // But for the initial "Skeleton" feel, we want a brief loading state.

            try {
                const res = await fetch(`/api/quotes?symbols=${prioritySymbols.slice(0, 50).join(',')}`);
                if (res.ok) {
                    const data = await res.json() as Record<string, any>;
                    setRealQuotes(prev => ({ ...prev, ...data }));
                }
            } catch (e) {
                console.warn('Failed to fetch real quotes:', e);
            } finally {
                setIsLoadingQuotes(false);
            }
        };

        fetchQuotes();
        const interval = setInterval(fetchQuotes, 60000);
        return () => clearInterval(interval);
    }, [symbols, localSymbols, openCharts]);

    // Combine UNIVERSE with custom symbols
    const allTickers = useMemo(() => {
        const universeSymbols = UNIVERSE.map(t => t.symbol);
        const customSymbols = [...symbols, ...localSymbols].filter(s => !universeSymbols.includes(s));
        const visibleUniverse = UNIVERSE.filter(t => !hiddenSymbols.includes(t.symbol));
        const visibleCustom = customSymbols.filter(s => !hiddenSymbols.includes(s));

        const createTickerData = (symbol: string, sector: string): TickerData => {
            const realQuote = realQuotes[symbol];
            // If we have data, show it
            if (realQuote && !realQuote.error && realQuote.price) {
                return {
                    symbol,
                    price: realQuote.price,
                    change: realQuote.change || 0,
                    changePercent: realQuote.changePercent || 0,
                    volume: realQuote.volume || 0,
                    sector,
                    clocks: getTickerClocks(symbol),
                    isLoading: false
                };
            }
            // If no data but we are legally "loading", return loading
            if (isLoadingQuotes) {
                return {
                    symbol, price: 0, change: 0, changePercent: 0, volume: 0, sector,
                    clocks: getTickerClocks(symbol),
                    isLoading: true
                };
            }
            // If not loading and no data, it's EMPTY or Error
            return {
                symbol, price: 0, change: 0, changePercent: 0, volume: 0, sector,
                clocks: getTickerClocks(symbol),
                isLoading: false // Done loading, just failed or empty
            };
        };

        return [
            ...visibleUniverse.map(t => createTickerData(t.symbol, t.sector)),
            ...visibleCustom.map(s => createTickerData(s, 'Custom'))
        ];
    }, [symbols, localSymbols, hiddenSymbols, realQuotes, isLoadingQuotes]);

    // Sector performance data 
    const sectorPerformance = useMemo(() => {
        const sectors = Object.entries(SECTOR_ETFS) as [SectorName, string][];
        const spyQuote = realQuotes['SPY'];

        // If loading and no spy data, return empty list (will trigger skeleton)
        if (isLoadingQuotes && !spyQuote) return [];

        // If loaded but no SPY, return empty (will trigger "No Data")
        if (!spyQuote) return [];

        const spyChange = spyQuote.changePercent || 0;

        return sectors.map(([sectorName, etf]): SectorPerformance => {
            const quote = realQuotes[etf];
            if (!quote) return {
                name: sectorName.slice(0, 12),
                fullName: sectorName,
                etf,
                changePercent: 0,
                status: 'yellow',
                isLoading: true
            };

            const changePercent = quote.changePercent || 0;
            const relativePerformance = changePercent - spyChange;
            const status: 'green' | 'yellow' | 'red' =
                relativePerformance > 0.5 ? 'green' :
                    relativePerformance < -0.5 ? 'red' : 'yellow';

            return {
                name: sectorName.slice(0, 12),
                fullName: sectorName,
                etf,
                changePercent: parseFloat(relativePerformance.toFixed(2)),
                status,
                isLoading: false
            };
        });
    }, [sectorPeriod, realQuotes, isLoadingQuotes]);

    // Handle add symbol - with duplicate check
    const handleAddSymbol = () => {
        const sym = symbolInput.trim().toUpperCase();
        if (!sym) return;

        // Check for duplicates - open chart for existing ticker
        if (allTickers.some(t => t.symbol === sym)) {
            setSymbolInput('');
            handleOpenChart(sym);
            return;
        }

        setLocalSymbols(prev => [...prev, sym]);
        onAddSymbol(sym);
        setSymbolInput('');
        setOpenCharts(prev => [...prev, { symbol: sym, period: '1D', isOpen: true }]);
    };

    // Open a chart for a ticker
    const handleOpenChart = (sym: string) => {
        // If chart already open, just expand it
        const existing = openCharts.find(c => c.symbol === sym);
        if (existing) {
            setOpenCharts(prev => prev.map(c => c.symbol === sym ? { ...c, isOpen: true } : c));
        } else {
            setOpenCharts(prev => [...prev, { symbol: sym, period: '1D', isOpen: true }]);
        }
    };

    // Close a chart
    const handleCloseChart = (sym: string) => {
        setOpenCharts(prev => prev.filter(c => c.symbol !== sym));
    };

    // Change chart time period
    const handleChartPeriodChange = (sym: string, period: TimePeriod) => {
        setOpenCharts(prev => prev.map(c => c.symbol === sym ? { ...c, period } : c));
    };

    // Handle remove symbol (hides from view)
    const handleRemoveSymbol = (sym: string) => {
        setHiddenSymbols(prev => [...prev, sym]);
        setLocalSymbols(prev => prev.filter(s => s !== sym));
        if (onRemoveSymbol) onRemoveSymbol(sym);
        setOpenCharts(prev => prev.filter(c => c.symbol !== sym));
    };

    // Handle add to watchlist
    const handleAddToWatchlist = (sym: string) => {
        if (!watchlist.includes(sym)) {
            StorageService.addToWatchlist(sym);
            setWatchlist(prev => [...prev, sym]);
        }
    };

    // Check if ticker is in watchlist
    const isInWatchlist = (sym: string) => watchlist.includes(sym);

    // Real chart data from API
    const [realChartData, setRealChartData] = useState<Record<string, PricePoint[]>>({});

    // Fetch chart data when a chart is opened
    useEffect(() => {
        if (openCharts.length > 0) {
            setRealChartData(prev => {
                const next = { ...prev };
                openCharts.forEach(c => {
                    if (!next[c.symbol]) next[c.symbol] = [];
                });
                return next;
            });
        }
    }, [openCharts]);

    const isChartLoading = (symbol: string): boolean => {
        return !realChartData[symbol] && openCharts.some(c => c.symbol === symbol);
    };

    const getChartData = (symbol: string, period: TimePeriod): PricePoint[] => {
        if (realChartData[symbol] && realChartData[symbol].length > 0) {
            return realChartData[symbol];
        }
        return [];
    };

    const handleToggleChart = (symbol: string) => {
        setOpenCharts(prev => {
            const exists = prev.find(c => c.symbol === symbol);
            if (exists) {
                return prev.map(c => c.symbol === symbol ? { ...c, isOpen: !c.isOpen } : c);
            }
            return [...prev, { symbol, period: '1M', isOpen: true }];
        });
    };


    return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Header with inline legend */}
            <div className="flex items-center justify-between flex-wrap gap-2 animate-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-xl font-bold text-white font-mono">DASHBOARD</h1>
                    <p className="text-xs text-slate-500">Market data & analysis — live feed with clock signals</p>
                </div>

                {/* Inline Legend + Add Ticker */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Bull</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Neutral</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Bear</span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={symbolInput}
                            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                            placeholder="Add ticker..."
                            className="bg-slate-900/50 border border-slate-700 rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-28"
                        />
                        <button
                            onClick={handleAddSymbol}
                            disabled={!symbolInput.trim()}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* 1. Sector Performance Index */}
            <CollapsibleSection
                title={`SECTOR_PERFORMANCE (${sectorPeriod})`}
                isOpen={isSectorOpen}
                onToggle={() => setIsSectorOpen(!isSectorOpen)}
                headerActions={
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {TIME_PERIODS.map(period => (
                            <button
                                key={period}
                                onClick={() => setSectorPeriod(period)}
                                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${sectorPeriod === period
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                    }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                }
            >
                <div className="h-56">
                    {isLoadingQuotes && sectorPerformance.length === 0 ? (
                        // SKELETON LOADING
                        <div className="w-full h-full flex gap-2 items-end p-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                                <SkeletonBar key={i} />
                            ))}
                        </div>
                    ) : sectorPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-700">
                            <BarChart data={sectorPerformance} layout="vertical">
                                <XAxis
                                    type="number"
                                    domain={[
                                        (dataMin: number) => Math.floor(Math.min(dataMin, -1)),
                                        (dataMax: number) => Math.ceil(Math.max(dataMax, 1))
                                    ]}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                    formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}% vs SPY`, 'Performance']}
                                />
                                <Bar dataKey="changePercent" radius={[0, 4, 4, 0]}>
                                    {sectorPerformance.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.status === 'green' ? '#22c55e' : entry.status === 'red' ? '#ef4444' : '#eab308'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        // EMPTY STATE
                        <div className="w-full h-full flex items-center justify-center border border-dashed border-slate-800 rounded bg-slate-900/20">
                            <p className="text-slate-600 text-xs text-center font-mono">
                                NO_SECTOR_DATA<br />
                                <span className="opacity-50">Checking feed...</span>
                            </p>
                        </div>
                    )}
                </div>
            </CollapsibleSection>

            {/* 2. Open Ticker Charts */}
            {openCharts.length > 0 && (
                <div className="space-y-4">
                    {openCharts.map((chart, idx) => {
                        // Stagger the animation of charts slightly
                        const chartData = getChartData(chart.symbol, chart.period);
                        const tickerData = allTickers.find(t => t.symbol === chart.symbol);
                        const animationDelay = `${idx * 100}ms`;

                        return (
                            <div key={chart.symbol} className="animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay }}>
                                <CollapsibleSection
                                    title={`${chart.symbol} (${chart.period})`}
                                    isOpen={chart.isOpen}
                                    onToggle={() => handleToggleChart(chart.symbol)}
                                    headerActions={
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleCloseChart(chart.symbol)}
                                                className="text-slate-500 hover:text-white p-1"
                                            >
                                                <Icon icon="close" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    }
                                >
                                    {/* Agent Analysis - Loading State Updated */}
                                    <div className="mb-4 text-xs font-mono bg-slate-900 border border-slate-700 p-2 rounded relative overflow-hidden transition-all duration-300">
                                        <span className="text-cyan-400 font-bold mr-2">AGENT_INSIGHT:</span>
                                        {analysisData[chart.symbol]?.isLoading ? (
                                            <span className="text-slate-500 animate-pulse">Initializing Agent Analysis...</span>
                                        ) : (
                                            <span className="text-slate-300 animate-in fade-in">
                                                {analysisData[chart.symbol]?.analysis || "Initializing..."}
                                            </span>
                                        )}
                                    </div>

                                    {/* Charts */}
                                    <div className="h-48 mb-4">
                                        {isChartLoading(chart.symbol) ? (
                                            <SkeletonChart />
                                        ) : chartData.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm border border-dashed border-slate-800 rounded bg-slate-900/20">
                                                NO_PRICE_DATA
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-500">
                                                <LineChart data={chartData}>
                                                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                                                    <Tooltip
                                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                                        labelStyle={{ color: '#e2e8f0' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="price"
                                                        stroke="#06b6d4"
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </CollapsibleSection>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 3. Ticker Grid - Gradual Population */}
            <CollapsibleSection
                title={`UNIVERSE_TICKERS (${allTickers.length})`}
                isOpen={isTickersOpen}
                onToggle={() => setIsTickersOpen(!isTickersOpen)}
            >
                {isLoadingQuotes && allTickers.every(t => t.isLoading) ? (
                    // GRID SKELETONS
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                            <SkeletonTickerCard key={i} />
                        ))}
                    </div>
                ) : allTickers.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {allTickers.slice(0, 48).map((ticker, index) => {
                            const isOpen = openCharts.some(c => c.symbol === ticker.symbol);
                            // Only animate if it was just loaded? Hard to track individual load times easily without complex state.
                            // Simply animate entry.
                            return (
                                <div
                                    key={ticker.symbol}
                                    onClick={() => handleOpenChart(ticker.symbol)}
                                    className={`bg-slate-800/40 border rounded-lg p-3 cursor-pointer transition-all hover:border-cyan-500/50 
                                      ${isOpen ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700/50'}
                                      animate-in zoom-in-50 fade-in duration-500 fill-mode-backwards
                                    `}
                                    style={{ animationDelay: `${(index % 10) * 50}ms` }} // Stagger small batches
                                >
                                    {ticker.isLoading ? (
                                        <div className="animate-pulse flex flex-col gap-2">
                                            <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                                            <div className="h-3 bg-slate-800/50 rounded w-1/3 self-end"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono font-bold text-white text-sm">{ticker.symbol}</span>
                                                <TickerClockDots clocks={ticker.clocks} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] text-slate-500 truncate">{ticker.sector}</p>
                                                <span className={`text-xs font-mono ${ticker.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {ticker.changePercent >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // EMPTY STATE
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded">
                        <p className="text-slate-500 font-mono text-sm">NO_VISIBLE_TICKERS</p>
                    </div>
                )}

                {allTickers.length > 48 && (
                    <p className="text-xs text-slate-600 mt-2 text-center">+ {allTickers.length - 48} more tickers</p>
                )}
            </CollapsibleSection>

        </div>
    );
};
