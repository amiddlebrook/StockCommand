import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { UNIVERSE } from '../lib/agent/universe';
import { MarketClock } from '../lib/agent/types';

interface TraditionalViewProps {
    clocks: MarketClock[];
    symbols: string[];
    onAddSymbol: (symbol: string) => void;
}

// Mock price data generator - in production, this would come from Alpha Vantage/etc
function generateMockPriceData(symbol: string) {
    const basePrice = Math.random() * 200 + 50;
    return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        price: basePrice + Math.sin(i / 3) * 10 + Math.random() * 5,
        volume: Math.floor(Math.random() * 1000000) + 100000,
    }));
}

// Convert clock status to percentage for correlation display
function clockToPercentage(status: string): number {
    switch (status) {
        case 'GREEN': return 75 + Math.random() * 25;
        case 'YELLOW': return 40 + Math.random() * 30;
        case 'RED': return Math.random() * 35;
        default: return 50;
    }
}

export const TraditionalView: React.FC<TraditionalViewProps> = ({
    clocks = [],
    symbols = [],
    onAddSymbol
}) => {
    // Safety check just in case
    if (!Array.isArray(clocks)) {
        console.error("TraditionalView: clocks prop is not an array", clocks);
        return <div className="p-4 text-red-500">Error: Invalid Market Data</div>;
    }
    console.log("TraditionalView mounting", { clocksCount: clocks.length, symbolsCount: symbols.length });
    const [symbolInput, setSymbolInput] = useState('');
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

    // Get unique sectors
    const sectors = useMemo(() => {
        const set = new Set(UNIVERSE.map(t => t.sector));
        return Array.from(set);
    }, []);

    // Aggregate clock data per sector for traditional bar chart
    const sectorData = useMemo(() => {
        return sectors.map(sector => {
            const sectorTickers = UNIVERSE.filter(t => t.sector === sector);
            const sectorClocks = clocks.filter(c => {
                if (!c) return false;
                const code = c.code || '';
                const name = c.name || '';
                return sectorTickers.some(t => code.includes(t.symbol) || name.toLowerCase().includes(sector.toLowerCase()));
            });

            const greenCount = sectorClocks.filter(c => c?.status === 'GREEN').length;
            const yellowCount = sectorClocks.filter(c => c?.status === 'YELLOW').length;
            const redCount = sectorClocks.filter(c => c?.status === 'RED').length;
            const total = greenCount + yellowCount + redCount || 1;

            return {
                name: sector.slice(0, 12),
                fullName: sector,
                score: ((greenCount * 100) + (yellowCount * 50) + (redCount * 0)) / total,
                green: greenCount,
                yellow: yellowCount,
                red: redCount,
                tickers: sectorTickers.length
            };
        });
    }, [sectors, clocks]);

    const handleAddSymbol = () => {
        const sym = symbolInput.trim().toUpperCase();
        if (sym) {
            onAddSymbol(sym);
            setSymbolInput('');
        }
    };

    const selectedData = selectedTicker ? generateMockPriceData(selectedTicker) : null;

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white font-mono">CHART_VIEW</h1>
                    <p className="text-xs text-slate-500">Raw data & charts — compare with Spatial color signals</p>
                </div>

                {/* Add Ticker */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                        placeholder="Add any ticker..."
                        className="bg-slate-900/50 border border-slate-700 rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                        onClick={handleAddSymbol}
                        disabled={!symbolInput.trim()}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Sector Performance Bar Chart */}
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4">
                <h2 className="text-sm font-bold text-cyan-400 mb-3 font-mono">SECTOR_PERFORMANCE_INDEX</h2>
                <div className="h-48 flex items-center justify-center border border-slate-700 rounded relative">
                    {sectorData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorData} layout="vertical">
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    labelStyle={{ color: '#e2e8f0' }}
                                    formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, 'Score']}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                    {sectorData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.score >= 70 ? '#22c55e' : entry.score >= 40 ? '#eab308' : '#ef4444'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-500 text-xs">No Data Available</p>
                    )}
                </div>
                <p className="text-[10px] text-slate-600 mt-2">↑ This correlates with sectors</p>
            </div>

            {/* Ticker Grid - Traditional Data Cards */}
            <div>
                <h2 className="text-sm font-bold text-cyan-400 mb-3 font-mono">UNIVERSE_TICKERS ({UNIVERSE.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {UNIVERSE.slice(0, 24).map(ticker => {
                        const mockChange = (Math.random() - 0.5) * 10;
                        const isPositive = mockChange >= 0;

                        return (
                            <div
                                key={ticker.symbol}
                                onClick={() => setSelectedTicker(ticker.symbol)}
                                className={`bg-slate-900/40 border rounded-lg p-3 cursor-pointer transition-all hover:border-cyan-500/50 ${selectedTicker === ticker.symbol ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono font-bold text-white text-sm">{ticker.symbol}</span>
                                    <span className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? '+' : ''}{mockChange.toFixed(2)}%
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-500 truncate">{ticker.sector}</p>
                            </div>
                        );
                    })}
                </div>
                {UNIVERSE.length > 24 && (
                    <p className="text-xs text-slate-600 mt-2 text-center">+ {UNIVERSE.length - 24} more tickers</p>
                )}
            </div>

            {/* Selected Ticker Detail Chart */}
            {selectedTicker && selectedData && (
                <div className="bg-slate-900/40 border border-cyan-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white font-mono">{selectedTicker}</h2>
                        <button onClick={() => setSelectedTicker(null)} className="text-slate-500 hover:text-white">
                            <Icon icon="close" className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Price Chart */}
                    <div className="h-48 mb-4 flex items-center justify-center border border-slate-700 rounded">
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
                    <div className="h-24 flex items-center justify-center border border-slate-700 rounded">
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

                    <p className="text-[10px] text-slate-600 mt-2">
                        ↑ In Spatial view, this ticker's market clocks show the same trend as color signals
                    </p>
                </div>
            )}

            {/* Correlation Legend */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Understanding the Correlation</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-slate-300">GREEN = Uptrend / Bullish signals</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-slate-300">YELLOW = Neutral / Consolidation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-slate-300">RED = Downtrend / Bearish signals</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-600 mt-3">
                    Toggle to Spatial view to see how these tactical metrics translate into actionable color signals.
                </p>
            </div>
        </div>
    );
};
