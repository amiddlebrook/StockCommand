import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface PortfolioViewProps {
    sleevesWithStats: {
        sleeveName: string;
        items: any[];
        stats: { green: number; yellow: number; red: number };
    }[];
    totalLiquidity?: number;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ sleevesWithStats, totalLiquidity = 1240500 }) => {
    const [selectedSleeveName, setSelectedSleeveName] = useState<string>('');

    // Initialize selection
    useEffect(() => {
        if (sleevesWithStats.length > 0 && !selectedSleeveName) {
            setSelectedSleeveName(sleevesWithStats[0].sleeveName);
        }
    }, [sleevesWithStats, selectedSleeveName]);

    const activeSleeve = sleevesWithStats.find(s => s.sleeveName === selectedSleeveName) || sleevesWithStats[0];

    return (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative h-full">
            {/* Top Section: Fixed (Header + Cards) */}
            <div className="flex-none p-6 md:p-8 border-b border-slate-800/50 bg-slate-950 z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Portfolio Strategy</h2>
                        <p className="text-gray-400 text-sm">2026-2031 Core Framework</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Liquidity</span>
                        <div className="text-3xl font-mono font-bold text-emerald-400">
                            ${totalLiquidity.toLocaleString()}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span>Core: 65%</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Cash: 35%</span>
                        </div>
                    </div>
                </div>

                {/* Strategy Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-purple-500/10 rounded-lg">
                                <Icon icon="strategy" className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-white font-semibold text-sm">Active Rotation</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Dynamic allocation between Core Tech & Specialized sectors.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                <Icon icon="chart" className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-white font-semibold text-sm">Risk Management</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Automated stop-loss & VIX regime monitoring.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                <Icon icon="ghost" className="w-4 h-4 text-amber-400" />
                            </div>
                            <span className="text-white font-semibold text-sm">Ghost Patterns</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            AI-driven accumulation/distribution detection.
                        </p>
                    </div>
                </div>
            </div>

            {/* Control Section: Sleeve Selector */}
            <div className="flex-none px-6 md:px-8 py-4 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <label htmlFor="sleeve-select" className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Select Sleeve:</label>
                    <div className="relative">
                        <select
                            id="sleeve-select"
                            value={selectedSleeveName}
                            onChange={(e) => setSelectedSleeveName(e.target.value)}
                            className="appearance-none bg-slate-800 border border-slate-700 text-white pl-4 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-w-[200px]"
                        >
                            {sleevesWithStats.map(s => (
                                <option key={s.sleeveName} value={s.sleeveName}>
                                    {s.sleeveName} ({s.items.length})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <Icon icon="chevron-down" className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Active Sleeve Stats Summary */}
                {activeSleeve && (
                    <div className="flex gap-2">
                        {activeSleeve.stats.green > 0 && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-mono">{activeSleeve.stats.green} Bullish</span>}
                        {activeSleeve.stats.yellow > 0 && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20 font-mono">{activeSleeve.stats.yellow} Neutral</span>}
                        {activeSleeve.stats.red > 0 && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-mono">{activeSleeve.stats.red} Bearish</span>}
                    </div>
                )}
            </div>

            {/* Detail Section: Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-700">
                {activeSleeve ? (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800/50 text-gray-500 text-xs uppercase tracking-wider bg-slate-900/50 sticky top-0 backdrop-blur-sm z-10">
                                    <th className="px-6 py-4 font-medium">Symbol</th>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium text-right">Allocation</th>
                                    <th className="px-6 py-4 font-medium text-right">Trend Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {activeSleeve.items.map((ticker) => {
                                    const status = ['bg-emerald-500', 'bg-amber-500', 'bg-red-500'][ticker.symbol.length % 3];
                                    const statusLabel = ['Bullish', 'Neutral', 'Bearish'][ticker.symbol.length % 3];
                                    const statusColor = ['text-emerald-400', 'text-amber-400', 'text-red-400'][ticker.symbol.length % 3];

                                    return (
                                        <tr key={ticker.symbol} className="hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-cyan-400 font-bold text-base group-hover:text-cyan-300 transition-colors">
                                                {ticker.symbol}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 font-medium">{ticker.name}</td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-400">
                                                {(100 / activeSleeve.items.length).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center justify-end gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800/50">
                                                    <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                                                    <div className={`w-2 h-2 rounded-full ${status} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 italic">
                        Select a sleeve to view holdings.
                    </div>
                )}
            </div>
        </div>
    );
};
