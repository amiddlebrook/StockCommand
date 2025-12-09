import React from 'react';
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
    return (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
            <div className="p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Icon icon="strategy" className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-white font-semibold">Active Rotation</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Dynamic capital allocation between Core Tech and Specialized sectors based on macro-economic cycle indicators.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Icon icon="chart" className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-white font-semibold">Risk Management</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Automated stop-loss triggers and VIX regime monitoring to protect capital during high volatility periods.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Icon icon="ghost" className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-white font-semibold">Ghost Patterns</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            AI-driven detection of institutional accumulation and distribution patterns before major price movements.
                        </p>
                    </div>
                </div>

                {/* Sleeves Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Active Sleeves</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {sleevesWithStats.map(({ sleeveName, items, stats }) => (
                            <div key={sleeveName} className="bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all">
                                <div className="p-4 border-b border-slate-800/50 bg-slate-900/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-slate-200">{sleeveName}</h4>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-gray-500">{items.length} Assets</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Status Pills */}
                                        {stats.green > 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">{stats.green} Bullish</span>}
                                        {stats.yellow > 0 && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">{stats.yellow} Neutral</span>}
                                        {stats.red > 0 && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">{stats.red} Bearish</span>}
                                    </div>
                                </div>

                                <div className="p-0">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-800/50 text-gray-500 text-xs uppercase tracking-wider bg-slate-900/20">
                                                <th className="px-4 py-3 font-medium">Symbol</th>
                                                <th className="px-4 py-3 font-medium">Name</th>
                                                <th className="px-4 py-3 font-medium text-right">Allocation</th>
                                                <th className="px-4 py-3 font-medium text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/30">
                                            {items.map((ticker) => (
                                                <tr key={ticker.symbol} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">{ticker.symbol}</td>
                                                    <td className="px-4 py-3 text-gray-300">{ticker.name}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-gray-400">
                                                        {/* Mock Allocation */}
                                                        {(100 / items.length).toFixed(1)}%
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {/* Using the mock status logic implicitly via CSS for now, could pass explicit status if needed */}
                                                        <div className="inline-flex items-center justify-end gap-2">
                                                            <span className="text-xs text-gray-500">Active</span>
                                                            <div className={`w-2 h-2 rounded-full ${['bg-emerald-500', 'bg-amber-500', 'bg-red-500'][ticker.symbol.length % 3]}`}></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
