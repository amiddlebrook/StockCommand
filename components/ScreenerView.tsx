import React, { useState } from 'react';
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

export const ScreenerView: React.FC = () => {
    const [filters, setFilters] = useState({
        marketCap: 'all',
        sector: 'all',
        priceRange: 'all',
        momentum: 'all',
    });
    const [results, setResults] = useState<ScreenerResult[]>([]);
    const [isRun, setIsRun] = useState(false);

    const runScreener = () => {
        setIsRun(true);
        // In future, this will use local filtering of the universe or an agent call
        setResults([]);
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
                {!isRun ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Icon icon="search" className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">Configure & Run Screener</h3>
                        <p className="text-sm text-slate-500">Set your filters and click "Run Screener" to find matching stocks</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Icon icon="search" className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">No Results Found</h3>
                        <p className="text-sm text-slate-500">Try adjusting your filter criteria</p>
                    </div>
                ) : (
                    <table className="w-full">
                        {/* Table would go here */}
                    </table>
                )}
            </div>
        </div>
    );
};
