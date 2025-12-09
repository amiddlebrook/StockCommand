import React, { useState } from 'react';
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
    // Use a Record to track open state for each sleeve
    const [openSleeves, setOpenSleeves] = useState<Record<string, boolean>>(() => {
        // Default all closed for the grid view initally, or maybe first one open?
        // Let's keep closed for a clean "dashboard" look
        return {};
    });

    const toggleSleeve = (sleeveName: string) => {
        setOpenSleeves(prev => ({
            ...prev,
            // If we want accordion style (one at a time), we would do:
            // [sleeveName]: !prev[sleeveName], ...mapOtherToFalse
            // But multiple open might be useful? For grid, usually single expansion is cleaner.
            // Let's toggle individually.
            [sleeveName]: !prev[sleeveName]
        }));
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative h-full">

            {/* Scrollable Container for the entire view */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">

                {/* Top Strategy Section */}
                <div className="p-6 md:p-8 border-b border-slate-800/50 bg-slate-950">
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

                {/* Sleeves Grid */}
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sleevesWithStats.map((sleeve) => {
                            const isOpen = openSleeves[sleeve.sleeveName];

                            // Dynamic class to handle spanning
                            const gridSpanClass = isOpen ? 'col-span-1 md:col-span-3' : 'col-span-1';

                            return (
                                <div
                                    key={sleeve.sleeveName}
                                    className={`
                            ${gridSpanClass} 
                            border border-slate-800 rounded-xl bg-slate-900/30 overflow-hidden transition-all duration-300 ease-in-out
                            ${isOpen ? 'ring-1 ring-slate-700 shadow-xl' : 'hover:bg-slate-800/50 hover:border-slate-700'}
                          `}
                                >

                                    {/* Card Header (Clickable) */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleSleeve(sleeve.sleeveName)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                        p-1.5 rounded-lg bg-slate-800 text-gray-400 transition-transform duration-300
                                        ${isOpen ? 'rotate-180 bg-slate-700 text-cyan-400' : ''}
                                   `}>
                                                <Icon icon="chevron-down" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-base text-slate-200">{sleeve.sleeveName}</h3>
                                                    {!isOpen && (
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-gray-500 font-mono border border-slate-700/50">
                                                            {sleeve.items.length}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Mini stats preview when collapsed */}
                                                {!isOpen && (
                                                    <div className="flex gap-2 mt-1.5">
                                                        {/* Simple pill indicators */}
                                                        {(sleeve.stats.green > 0 || sleeve.stats.yellow > 0 || sleeve.stats.red > 0) ? (
                                                            <div className="flex h-1.5 gap-0.5">
                                                                {[...Array(sleeve.stats.green)].map((_, i) => <div key={`g-${i}`} className="w-3 rounded-full bg-emerald-500/50"></div>)}
                                                                {[...Array(sleeve.stats.yellow)].map((_, i) => <div key={`y-${i}`} className="w-3 rounded-full bg-amber-500/50"></div>)}
                                                                {[...Array(sleeve.stats.red)].map((_, i) => <div key={`r-${i}`} className="w-3 rounded-full bg-red-500/50"></div>)}
                                                            </div>
                                                        ) : <span className="text-[10px] text-gray-600">No signals</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Full stats pills only show when open or on large screens? 
                                       Let's show a summary pill if open
                                   */}
                                            {isOpen && (
                                                <div className="flex gap-2">
                                                    {sleeve.stats.green > 0 && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-mono">{sleeve.stats.green} Bullish</span>}
                                                    {sleeve.stats.yellow > 0 && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20 font-mono">{sleeve.stats.yellow} Neutral</span>}
                                                    {sleeve.stats.red > 0 && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-mono">{sleeve.stats.red} Bearish</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body (Table) - Only rendered if open */}
                                    {isOpen && (
                                        <div className="border-t border-slate-800/50 animate-fadeIn">
                                            <div className="bg-slate-950/30">
                                                <table className="w-full text-left text-sm">
                                                    {/* Minimal Header */}
                                                    <thead className="bg-slate-900/50 text-gray-500 text-xs uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-6 py-3 font-medium pl-14">Symbol</th>
                                                            <th className="px-6 py-3 font-medium">Name</th>
                                                            <th className="px-6 py-3 font-medium text-right">Allocation</th>
                                                            <th className="px-6 py-3 font-medium text-right">Trend Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/30">
                                                        {sleeve.items.map((ticker) => {
                                                            const status = ['bg-emerald-500', 'bg-amber-500', 'bg-red-500'][ticker.symbol.length % 3];
                                                            const statusLabel = ['Bullish', 'Neutral', 'Bearish'][ticker.symbol.length % 3];
                                                            const statusColor = ['text-emerald-400', 'text-amber-400', 'text-red-400'][ticker.symbol.length % 3];

                                                            return (
                                                                <tr key={ticker.symbol} className="hover:bg-slate-800/30 transition-colors group">
                                                                    <td className="px-6 py-3 font-mono text-cyan-400 font-bold pl-14 group-hover:text-cyan-300 transition-colors">
                                                                        {ticker.symbol}
                                                                    </td>
                                                                    <td className="px-6 py-3 text-gray-300 font-medium">{ticker.name}</td>
                                                                    <td className="px-6 py-3 text-right font-mono text-gray-400">
                                                                        {(100 / sleeve.items.length).toFixed(1)}%
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right">
                                                                        <div className="inline-flex items-center justify-end gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800/50">
                                                                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${statusColor}`}>{statusLabel}</span>
                                                                            <div className={`w-1.5 h-1.5 rounded-full ${status}`}></div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
