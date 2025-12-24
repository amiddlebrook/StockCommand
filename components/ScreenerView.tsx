import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ScreenerResult {
    symbol: string;
    name: string;
    price: number;
    change: number;
    pe: number;
    marketCap: string;
    sector: string;
}

interface ScreenerViewProps { }

export const ScreenerView: React.FC<ScreenerViewProps> = () => {
    const [filters, setFilters] = useState({
        marketCap: 'all',
        sector: 'all',
        priceRange: 'all',
        momentum: 'all',
    });
    const [results, setResults] = useState<ScreenerResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const runScreener = async () => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            const params = new URLSearchParams(filters as any);
            const res = await fetch(`/api/screener?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setResults(Array.isArray(data) ? data : []);
            } else {
                setResults([]);
            }
        } catch (e) {
            console.warn('Screener error:', e);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="search" className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold tracking-wide">STOCK SCREENER</h2>
                </div>
                <button
                    onClick={runScreener}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Run Screener
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Market Cap</label>
                    <select
                        value={filters.marketCap}
                        onChange={(e) => setFilters({ ...filters, marketCap: e.target.value })}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="mega">Mega (&gt;200B)</option>
                        <option value="large">Large (10B-200B)</option>
                        <option value="mid">Mid (2B-10B)</option>
                        <option value="small">Small (&lt;2B)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Sector</label>
                    <select
                        value={filters.sector}
                        onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                        <option value="all">All Sectors</option>
                        <option value="tech">Technology</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="finance">Finance</option>
                        <option value="energy">Energy</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Price Range</label>
                    <select
                        value={filters.priceRange}
                        onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                        <option value="all">All Prices</option>
                        <option value="under10">Under $10</option>
                        <option value="10to50">$10 - $50</option>
                        <option value="50to200">$50 - $200</option>
                        <option value="over200">Over $200</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Momentum</label>
                    <select
                        value={filters.momentum}
                        onChange={(e) => setFilters({ ...filters, momentum: e.target.value })}
                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="bullish">Bullish</option>
                        <option value="bearish">Bearish</option>
                        <option value="neutral">Neutral</option>
                    </select>
                </div>
            </div>

            {/* Results */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm text-slate-400 font-mono">Running screener...</p>
                    </div>
                ) : !hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Icon icon="search" className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">Configure & Run Screener</h3>
                        <p className="text-sm text-slate-500">Set your filters and click "Run Screener" to find matching stocks</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Icon icon="search" className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">No Results</h3>
                        <p className="text-sm text-slate-500">Try adjusting your filter criteria</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                                <th className="text-left p-4">Symbol</th>
                                <th className="text-left p-4">Name</th>
                                <th className="text-right p-4">Price</th>
                                <th className="text-right p-4">Change %</th>
                                <th className="text-right p-4">P/E</th>
                                <th className="text-right p-4">Mkt Cap</th>
                                <th className="text-left p-4">Sector</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((stock) => (
                                <tr key={stock.symbol} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer">
                                    <td className="p-4 font-mono font-bold text-cyan-400">{stock.symbol}</td>
                                    <td className="p-4 text-slate-300">{stock.name}</td>
                                    <td className="p-4 text-right font-mono">${stock.price.toFixed(2)}</td>
                                    <td className={`p-4 text-right font-mono ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-400">{stock.pe}</td>
                                    <td className="p-4 text-right font-mono text-slate-400">{stock.marketCap}</td>
                                    <td className="p-4 text-slate-400">{stock.sector}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
