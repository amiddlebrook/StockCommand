import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { UNIVERSE, SECTOR_ETFS, SectorName } from '../lib/agent/universe';
import { MarketClock } from '../lib/agent/types';
import { getClocksForEntity } from '../lib/clockData';

interface TraditionalViewProps {
    clocks: MarketClock[];
    symbols: string[];
    onAddSymbol: (symbol: string) => void;
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
function generateSectorPerformance(): SectorPerformance[] {
    const sectors = Object.entries(SECTOR_ETFS) as [SectorName, string][];
    return sectors.map(([sectorName, etf]) => {
        // Seed based on sector name for consistency
        const seed = sectorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const changePercent = ((seed % 100) - 50) / 10; // -5% to +5%
        const status: 'green' | 'yellow' | 'red' =
            changePercent > 1 ? 'green' :
                changePercent < -1 ? 'red' : 'yellow';

        return {
            name: sectorName.slice(0, 12),
            fullName: sectorName,
            etf,
            changePercent,
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
    onAddSymbol
}) => {
    // Safety check
    if (!Array.isArray(clocks)) {
        console.error("TraditionalView: clocks prop is not an array", clocks);
        return <div className="p-4 text-red-500">Error: Invalid Market Data</div>;
    }

    const [symbolInput, setSymbolInput] = useState('');
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const [localSymbols, setLocalSymbols] = useState<string[]>([]);

    // Collapsible states
    const [isSectorOpen, setIsSectorOpen] = useState(true);
    const [isChartOpen, setIsChartOpen] = useState(true);
    const [isTickersOpen, setIsTickersOpen] = useState(true);

    // Combine UNIVERSE with custom symbols and local additions
    const allTickers = useMemo(() => {
        const universeSymbols = UNIVERSE.map(t => t.symbol);
        const customSymbols = [...symbols, ...localSymbols].filter(s => !universeSymbols.includes(s));
        return [
            ...UNIVERSE.map(t => generateTickerData(t.symbol, t.sector)),
            ...customSymbols.map(s => generateTickerData(s, 'Custom'))
        ];
    }, [symbols, localSymbols]);

    // Sector performance data using ETF proxies
    const sectorPerformance = useMemo(() => generateSectorPerformance(), []);

    // Handle add symbol
    const handleAddSymbol = () => {
        const sym = symbolInput.trim().toUpperCase();
        if (sym && !allTickers.some(t => t.symbol === sym)) {
            setLocalSymbols(prev => [...prev, sym]);
            onAddSymbol(sym);
            setSymbolInput('');
            // Auto-select the new ticker
            setSelectedTicker(sym);
            setIsChartOpen(true);
        }
    };

    const selectedData = selectedTicker ? generateMockPriceData(selectedTicker) : null;
    const selectedTickerData = selectedTicker ? allTickers.find(t => t.symbol === selectedTicker) : null;

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
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Hold</span>
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
                title={`SECTOR_PERFORMANCE (vs SPY)`}
                isOpen={isSectorOpen}
                onToggle={() => setIsSectorOpen(!isSectorOpen)}
            >
                <div className="h-56">
                    {sectorPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorPerformance} layout="vertical">
                                <XAxis
                                    type="number"
                                    domain={[-5, 5]}
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

            {/* 2. Selected Ticker Detail Chart */}
            {selectedTicker && selectedData && (
                <CollapsibleSection
                    title={`${selectedTicker} CHART`}
                    isOpen={isChartOpen}
                    onToggle={() => setIsChartOpen(!isChartOpen)}
                    headerActions={
                        <button
                            onClick={() => setSelectedTicker(null)}
                            className="text-slate-500 hover:text-white p-1"
                        >
                            <Icon icon="close" className="w-4 h-4" />
                        </button>
                    }
                >
                    {/* Ticker Info Bar */}
                    <div className="flex items-center gap-4 mb-4 p-2 bg-slate-800/50 rounded">
                        {selectedTickerData && <TickerClockDots clocks={selectedTickerData.clocks} />}
                        <span className="text-white font-mono font-bold">{selectedTicker}</span>
                        <span className="text-slate-400 text-xs">{selectedTickerData?.sector}</span>
                        <span className={`text-sm font-mono ${(selectedTickerData?.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(selectedTickerData?.changePercent || 0) >= 0 ? '+' : ''}{selectedTickerData?.changePercent.toFixed(2)}%
                        </span>
                    </div>

                    {/* Price Chart */}
                    <div className="h-48 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedData}>
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
                    </div>

                    {/* Volume Chart */}
                    <div className="h-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={selectedData}>
                                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 8 }} />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <Bar dataKey="volume" fill="#3b82f6" opacity={0.6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CollapsibleSection>
            )}

            {/* 3. Ticker Grid */}
            <CollapsibleSection
                title={`UNIVERSE_TICKERS (${allTickers.length})`}
                isOpen={isTickersOpen}
                onToggle={() => setIsTickersOpen(!isTickersOpen)}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {allTickers.slice(0, 48).map(ticker => (
                        <div
                            key={ticker.symbol}
                            onClick={() => {
                                setSelectedTicker(ticker.symbol);
                                setIsChartOpen(true);
                            }}
                            className={`bg-slate-800/40 border rounded-lg p-3 cursor-pointer transition-all hover:border-cyan-500/50 ${selectedTicker === ticker.symbol ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700/50'
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
                    ))}
                </div>
                {allTickers.length > 48 && (
                    <p className="text-xs text-slate-600 mt-2 text-center">+ {allTickers.length - 48} more tickers</p>
                )}
            </CollapsibleSection>


        </div>
    );
};
