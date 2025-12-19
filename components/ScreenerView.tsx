import React, { useState } from 'react';
import { Icon } from './Icon';

interface ScreenerViewProps { }

export const ScreenerView: React.FC<ScreenerViewProps> = () => {
    const [filters, setFilters] = useState({
        marketCap: 'all',
        sector: 'all',
        priceRange: 'all',
        momentum: 'all',
    });

    const mockResults = [
        { symbol: 'NVDA', name: 'NVIDIA Corp', price: 485.12, change: 3.45, pe: 62.5, marketCap: '1.2T', sector: 'Tech' },
        { symbol: 'AAPL', name: 'Apple Inc', price: 193.58, change: 1.23, pe: 30.2, marketCap: '3.0T', sector: 'Tech' },
        { symbol: 'TSLA', name: 'Tesla Inc', price: 248.79, change: -2.15, pe: 72.1, marketCap: '790B', sector: 'Auto' },
        { symbol: 'AMZN', name: 'Amazon.com', price: 154.32, change: 0.87, pe: 45.3, marketCap: '1.6T', sector: 'Retail' },
        { symbol: 'META', name: 'Meta Platforms', price: 342.67, change: 2.34, pe: 25.8, marketCap: '890B', sector: 'Tech' },
        { symbol: 'GOOGL', name: 'Alphabet Inc', price: 138.45, change: 1.56, pe: 23.4, marketCap: '1.7T', sector: 'Tech' },
    ];

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="search" className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold tracking-wide">STOCK SCREENER</h2>
                </div>
                <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors">
                    Save Screener
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

            {/* Results Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
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
                        {mockResults.map((stock) => (
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
            </div>
        </div>
    );
};
