import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { UNIVERSE, SECTOR_ETFS, SectorName } from '../lib/agent/universe';
import { MarketClock } from '../lib/agent/types';
import { getClocksForEntity } from '../lib/clockData';
import { StorageService } from '../lib/storage';

interface TraditionalViewProps {
    clocks: MarketClock[];
    symbols: string[];
    onAddSymbol: (symbol: string) => void;
    onRemoveSymbol?: (symbol: string) => void;
    isAgentActive?: boolean;
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

// Mock price data generator - structured for future API integration
function generateMockPriceData(symbol: string): PricePoint[] {
    // Seed based on symbol for consistency across renders
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = (seed % 200) + 50;
    return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        price: basePrice + Math.sin((i + seed) / 3) * 10 + ((seed * i) % 5),
        volume: Math.floor(((seed * (i + 1)) % 900000) + 100000),
    }));
}

// Generate mock sector performance (ETF % change relative to SPY)
// Scale values based on time period
function generateSectorPerformance(period: TimePeriod): SectorPerformance[] {
    const sectors = Object.entries(SECTOR_ETFS) as [SectorName, string][];

    // Scale factor based on period (longer periods = larger swings)
    const periodMultiplier: Record<TimePeriod, number> = {
        '1D': 1,
        '1W': 2,
        '1M': 3,
        '1Y': 5,
        '5Y': 8
    };
    const multiplier = periodMultiplier[period];

    return sectors.map(([sectorName, etf]) => {
        // Seed based on sector name + period for varied results
        const seed = sectorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + period.charCodeAt(0);
        const baseChange = ((seed % 100) - 50) / 10; // -5% to +5%
        const changePercent = baseChange * multiplier;
        const status: 'green' | 'yellow' | 'red' =
            changePercent > 1 ? 'green' :
                changePercent < -1 ? 'red' : 'yellow';

        return {
            name: sectorName.slice(0, 12),
            fullName: sectorName,
            etf,
            changePercent: Math.round(changePercent * 100) / 100, // Round to 2 decimals
            status
        };
    });
}

// Get all clock statuses for a ticker (4 metrics)
function getTickerClocks(symbol: string): TickerClocks {
    const clocks = getClocksForEntity('TICKER', symbol);

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

// Generate mock ticker data
function generateTickerData(symbol: string, sector: string): TickerData {
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const changePercent = ((seed % 100) - 50) / 10;
    const price = (seed % 300) + 50;

    return {
        symbol,
        price,
        change: price * (changePercent / 100),
        changePercent,
        volume: (seed * 1000) % 10000000 + 100000,
        sector,
        clocks: getTickerClocks(symbol)
    };
}

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
    isAgentActive = false
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
    const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

    // Collapsible states
    const [isSectorOpen, setIsSectorOpen] = useState(true);
    const [isTickersOpen, setIsTickersOpen] = useState(true);
    const [sectorPeriod, setSectorPeriod] = useState<TimePeriod>('1D');

    // Fetch real quotes from API - PRIORITY LOADING
    // Only fetch top 10 on initial load, fetch more on demand
    useEffect(() => {
        const fetchQuotes = async () => {
            // Priority: open charts first, then first 10 of universe
            const openChartSymbols = openCharts.map(c => c.symbol);
            const universeSymbols = UNIVERSE.slice(0, 10).map(t => t.symbol); // Only first 10
            const customSymbols = [...symbols, ...localSymbols];

            // Combine priority symbols (no duplicates)
            const prioritySymbols = [...new Set([...openChartSymbols, ...universeSymbols, ...customSymbols])];

            if (prioritySymbols.length === 0) return;

            setIsLoadingQuotes(true);
            try {
                // Single batch for priority symbols (should be ~10-15 max)
                const res = await fetch(`/api/quotes?symbols=${prioritySymbols.slice(0, 10).join(',')}`);
                if (res.ok) {
                    const data = await res.json();
                    setRealQuotes(prev => ({ ...prev, ...data }));
                }
            } catch (e) {
                console.warn('Failed to fetch real quotes:', e);
            } finally {
                setIsLoadingQuotes(false);
            }
        };

        fetchQuotes();
        // Refresh every 60 seconds
        const interval = setInterval(fetchQuotes, 60000);
        return () => clearInterval(interval);
    }, [symbols, localSymbols, openCharts]);

    // Combine UNIVERSE with custom symbols, using real data when available
    const allTickers = useMemo(() => {
        const universeSymbols = UNIVERSE.map(t => t.symbol);
        const customSymbols = [...symbols, ...localSymbols].filter(s => !universeSymbols.includes(s));
        const visibleUniverse = UNIVERSE.filter(t => !hiddenSymbols.includes(t.symbol));
        const visibleCustom = customSymbols.filter(s => !hiddenSymbols.includes(s));

        const createTickerData = (symbol: string, sector: string): TickerData => {
            const realQuote = realQuotes[symbol];
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
            // Show loading state if quotes are being fetched
            if (isLoadingQuotes) {
                return {
                    symbol,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    volume: 0,
                    sector,
                    clocks: getTickerClocks(symbol),
                    isLoading: true
                };
            }
            // Fallback to mock if API failed or not configured
            return { ...generateTickerData(symbol, sector), isLoading: false };
        };

        return [
            ...visibleUniverse.map(t => createTickerData(t.symbol, t.sector)),
            ...visibleCustom.map(s => createTickerData(s, 'Custom'))
        ];
    }, [symbols, localSymbols, hiddenSymbols, realQuotes, isLoadingQuotes]);

    // Sector performance data using ETF proxies
    const sectorPerformance = useMemo(() => generateSectorPerformance(sectorPeriod), [sectorPeriod]);

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
        const fetchChartData = async () => {
            for (const chart of openCharts) {
                if (realChartData[chart.symbol]) continue; // Already fetched

                try {
                    const res = await fetch(`/api/intraday?symbol=${chart.symbol}&interval=5min`);
                    if (res.ok) {
                        const data = await res.json() as { data?: Array<{ close?: number; price?: number; volume?: number }> };
                        if (data.data && Array.isArray(data.data)) {
                            const points: PricePoint[] = data.data.slice(-30).map((d, i: number) => ({
                                day: i + 1,
                                price: d.close || d.price || 0,
                                volume: d.volume || 0
                            }));
                            setRealChartData(prev => ({ ...prev, [chart.symbol]: points }));
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch chart data for ${chart.symbol}:`, e);
                }
            }
        };

        if (openCharts.length > 0) {
            fetchChartData();
        }
    }, [openCharts]);

    // Track which charts are loading
    const isChartLoading = (symbol: string): boolean => {
        return !realChartData[symbol] && openCharts.some(c => c.symbol === symbol);
    };

    // Get chart data - use real if available, return empty for loading
    const getChartData = (symbol: string, period: TimePeriod): PricePoint[] => {
        if (realChartData[symbol] && realChartData[symbol].length > 0) {
            return realChartData[symbol];
        }
        // Return empty array while loading (will show loading indicator)
        return [];
    };

    // Agent Analysis State
    const [analysisData, setAnalysisData] = useState<Record<string, AnalysisData>>({});

    const fetchAgentAnalysis = async (symbol: string) => {
        // Don't re-fetch if we already have it
        if (analysisData[symbol]?.analysis) return;

        setAnalysisData(prev => ({ ...prev, [symbol]: { symbol, analysis: '', isLoading: true } }));
        try {
            const res = await fetch(`/api/agent/analyze?ticker=${symbol}`);
            const data = await res.json();
            setAnalysisData(prev => ({
                ...prev,
                [symbol]: { symbol, analysis: data.analysis || "Analysis unavailable.", isLoading: false }
            }));
        } catch (e) {
            setAnalysisData(prev => ({
                ...prev,
                [symbol]: { symbol, analysis: "Agent offline.", isLoading: false }
            }));
        }
    };

    // Auto-Scan Logic
    useEffect(() => {
        if (!isAgentActive) return;

        const target = openCharts.find(c => !analysisData[c.symbol]?.analysis && !analysisData[c.symbol]?.isLoading);

        if (target) {
            const timer = setTimeout(() => {
                fetchAgentAnalysis(target.symbol);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isAgentActive, analysisData, openCharts]);

    // Consolidate duplicate handleToggleChart
    const handleToggleChart = (symbol: string) => {
        setOpenCharts(prev => {
            const exists = prev.find(c => c.symbol === symbol);
            if (exists) {
                // Toggle open state, if opening trigger analysis
                if (!exists.isOpen) fetchAgentAnalysis(symbol);
                return prev.map(c => c.symbol === symbol ? { ...c, isOpen: !c.isOpen } : c);
            }
            // Add new chart and TRIGGER ANALYSIS
            fetchAgentAnalysis(symbol);
            return [...prev, { symbol, period: '1M', isOpen: true }];
        });
    };

    return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Header with inline legend */}
            <div className="flex items-center justify-between flex-wrap gap-2">
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

            {/* 1. Sector Performance Index (ETF % change relative to SPY) */}
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
                    {sectorPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
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
                                    labelFormatter={(label) => {
                                        const sector = sectorPerformance.find(s => s.name === label);
                                        return `${sector?.fullName} (${sector?.etf})`;
                                    }}
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
                        <p className="text-slate-500 text-xs">No Data Available</p>
                    )}
                </div>
                <p className="text-[10px] text-slate-600 mt-2">
                    ↑ Sector ETF performance relative to SPY benchmark (outperformance = green, underperformance = red)
                </p>
            </CollapsibleSection>

            {/* 2. Open Ticker Charts */}
            {openCharts.map(chart => {
                const chartData = getChartData(chart.symbol, chart.period);
                const tickerData = allTickers.find(t => t.symbol === chart.symbol);
                return (
                    <CollapsibleSection
                        key={chart.symbol}
                        title={`${chart.symbol} (${chart.period})`}
                        isOpen={chart.isOpen}
                        onToggle={() => handleToggleChart(chart.symbol)}
                        headerActions={
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                {/* Time Period Toggles */}
                                <div className="flex items-center gap-0.5">
                                    {TIME_PERIODS.map(period => (
                                        <button
                                            key={period}
                                            onClick={() => handleChartPeriodChange(chart.symbol, period)}
                                            className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${chart.period === period
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                                }`}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleCloseChart(chart.symbol)}
                                    className="text-slate-500 hover:text-white p-1"
                                >
                                    <Icon icon="close" className="w-4 h-4" />
                                </button>
                            </div>
                        }
                    >
                        {/* Ticker Info Bar */}
                        <div className="flex items-center justify-between mb-4 p-2 bg-slate-800/50 rounded">
                            <div className="flex items-center gap-4">
                                {tickerData && <TickerClockDots clocks={tickerData.clocks} />}
                                <span className="text-white font-mono font-bold">{chart.symbol}</span>
                                <span className="text-slate-400 text-xs">{tickerData?.sector}</span>
                                <span className={`text-sm font-mono ${(tickerData?.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {(tickerData?.changePercent || 0) >= 0 ? '+' : ''}{tickerData?.changePercent.toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleRemoveSymbol(chart.symbol)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded transition-colors"
                                    title="Remove Ticker"
                                >
                                    <Icon icon="trash" className="w-3 h-3" />
                                    <span className="hidden sm:inline">Remove</span>
                                </button>
                            </div>
                        </div>

                        {/* Agent Analysis Panel (New Feature) */}
                        <div className="mb-4 text-xs font-mono bg-slate-900 border border-slate-700 p-2 rounded relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-20">
                                <Icon icon="bot" className="w-8 h-8 text-cyan-500" />
                            </div>
                            <span className="text-cyan-400 font-bold mr-2">AGENT_INSIGHT:</span>
                            {analysisData[chart.symbol]?.isLoading ? (
                                <span className="text-slate-500 animate-pulse">Analyzing market data...</span>
                            ) : (
                                <span className="text-slate-300">{analysisData[chart.symbol]?.analysis || "Initialize Agent to view."}</span>
                            )}
                        </div>

                        {/* Price Chart */}
                        <div className="h-48 mb-4">
                            {isChartLoading(chart.symbol) ? (
                                <div className="h-full flex items-center justify-center text-cyan-400 font-mono text-sm animate-pulse">
                                    <Icon icon="activity" className="w-4 h-4 mr-2" />
                                    Fetching live data...
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">
                                    No data available
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
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

                        {/* Volume Chart */}
                        <div className="h-20">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 8 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="volume" fill="#3b82f6" opacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CollapsibleSection>
                );
            })}

            {/* 3. Ticker Grid */}
            <CollapsibleSection
                title={`UNIVERSE_TICKERS (${allTickers.length})`}
                isOpen={isTickersOpen}
                onToggle={() => setIsTickersOpen(!isTickersOpen)}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {allTickers.slice(0, 48).map(ticker => {
                        const isOpen = openCharts.some(c => c.symbol === ticker.symbol);
                        return (
                            <div
                                key={ticker.symbol}
                                onClick={() => handleOpenChart(ticker.symbol)}
                                className={`bg-slate-800/40 border rounded-lg p-3 cursor-pointer transition-all hover:border-cyan-500/50 ${isOpen ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700/50'
                                    }`}
                            >
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
                            </div>
                        );
                    })}
                </div>
                {allTickers.length > 48 && (
                    <p className="text-xs text-slate-600 mt-2 text-center">+ {allTickers.length - 48} more tickers</p>
                )}
            </CollapsibleSection>


        </div>
    );
};
