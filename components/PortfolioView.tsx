import React, { useState } from 'react';
import { Icon } from './Icon';
import { SectorName } from '../lib/agent/types';

interface Position {
    symbol: string;
    name: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    sector: string;
}

interface PortfolioViewProps {
    sectorsWithStats: {
        sectorName: SectorName | string;
        items: { symbol: string; name: string; allocation: number }[];
        stats: { green: number; yellow: number; red: number };
    }[];
    totalLiquidity?: number;
    onTickerClick?: (symbol: string) => void;
    positions?: Position[]; // Real positions from broker connection
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
    sectorsWithStats,
    totalLiquidity = 0,
    onTickerClick,
    positions = [] // Empty by default - requires broker connection
}) => {
    const [openSectors, setOpenSectors] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<'holdings' | 'strategies'>('holdings');

    const toggleSector = (sectorName: string) => {
        setOpenSectors(prev => ({
            ...prev,
            [sectorName]: !prev[sectorName]
        }));
    };

    // Use real positions if available, otherwise empty
    const hasPositions = positions.length > 0;
    const totalValue = positions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
    const totalCost = positions.reduce((sum, p) => sum + (p.shares * p.avgCost), 0);
    const totalGainLoss = hasPositions ? totalValue - totalCost : 0;
    const totalGainLossPercent = hasPositions && totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative h-full">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">

                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-slate-800/50 bg-slate-950">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Portfolio</h2>
                            <p className="text-gray-400 text-sm">Holdings & Strategy Management</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Value</span>
                            <div className="text-3xl font-mono font-bold text-white">
                                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-sm font-mono ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('holdings')}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'holdings' ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                        >
                            Holdings
                        </button>
                        <button
                            onClick={() => setActiveTab('strategies')}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'strategies' ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                        >
                            Strategies
                        </button>
                    </div>
                </div>

                {activeTab === 'holdings' ? (
                    <div className="p-6 md:p-8">
                        {/* Positions Table */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                                        <th className="text-left p-4">Symbol</th>
                                        <th className="text-left p-4">Name</th>
                                        <th className="text-right p-4">Shares</th>
                                        <th className="text-right p-4">Avg Cost</th>
                                        <th className="text-right p-4">Current</th>
                                        <th className="text-right p-4">Value</th>
                                        <th className="text-right p-4">P/L</th>
                                        <th className="text-left p-4">Sector</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!hasPositions ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center">
                                                <Icon icon="wallet" className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-400 font-medium">No Positions</p>
                                                <p className="text-sm text-slate-500 mt-1">Connect a broker to view your portfolio holdings</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        positions.map((position) => {
                                            const value = position.shares * position.currentPrice;
                                            const cost = position.shares * position.avgCost;
                                            const gainLoss = value - cost;
                                            const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

                                            return (
                                                <tr
                                                    key={position.symbol}
                                                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                                    onClick={() => onTickerClick?.(position.symbol)}
                                                >
                                                    <td className="p-4 font-mono font-bold text-cyan-400">{position.symbol}</td>
                                                    <td className="p-4 text-slate-300">{position.name}</td>
                                                    <td className="p-4 text-right font-mono">{position.shares}</td>
                                                    <td className="p-4 text-right font-mono text-slate-400">${position.avgCost.toFixed(2)}</td>
                                                    <td className="p-4 text-right font-mono">${position.currentPrice.toFixed(2)}</td>
                                                    <td className="p-4 text-right font-mono">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className={`p-4 text-right font-mono ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                                                    </td>
                                                    <td className="p-4 text-slate-400">{position.sector}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Sector Breakdown */}
                        <div className="mt-6">
                            <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-3">Sector Allocation</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Technology', 'Financials', 'Energy', 'Healthcare'].map((sector) => {
                                    const sectorPositions = positions.filter(p => p.sector === sector);
                                    const sectorValue = sectorPositions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
                                    const sectorPercent = totalValue > 0 ? (sectorValue / totalValue) * 100 : 0;

                                    return (
                                        <div key={sector} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                                            <div className="text-xs text-slate-400 uppercase">{sector}</div>
                                            <div className="text-lg font-bold">{sectorPercent.toFixed(1)}%</div>
                                            <div className="text-sm text-slate-500">${sectorValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 md:p-8">
                        {/* Strategies Tab */}
                        <div className="text-center py-12">
                            <Icon icon="code" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400 mb-2">Strategy Manager</h3>
                            <p className="text-slate-500 mb-4">Create and manage automated trading strategies</p>
                            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
                                Create Strategy
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
