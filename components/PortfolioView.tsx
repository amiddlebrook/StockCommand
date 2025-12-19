import React, { useState } from 'react';
import { Icon } from './Icon';
import { SectorName } from '../lib/agent/types';

interface PortfolioViewProps {
    sectorsWithStats: {
        sectorName: SectorName | string;
        items: { symbol: string; name: string; allocation: number }[];
        stats: { green: number; yellow: number; red: number };
    }[];
    totalLiquidity?: number;
    onTickerClick?: (symbol: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
    sectorsWithStats,
    totalLiquidity = 0,
    onTickerClick
}) => {
    const [openSectors, setOpenSectors] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<'holdings' | 'strategies'>('holdings');

    const toggleSector = (sectorName: string) => {
        setOpenSectors(prev => ({
            ...prev,
            [sectorName]: !prev[sectorName]
        }));
    };

    // Mock positions for production
    const mockPositions = [
        { symbol: 'AAPL', name: 'Apple Inc', shares: 50, avgCost: 178.50, currentPrice: 193.42, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corp', shares: 25, avgCost: 380.25, currentPrice: 415.83, sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc', shares: 20, avgCost: 138.90, currentPrice: 142.65, sector: 'Technology' },
        { symbol: 'JPM', name: 'JPMorgan Chase', shares: 30, avgCost: 178.00, currentPrice: 195.50, sector: 'Financials' },
        { symbol: 'XOM', name: 'Exxon Mobil', shares: 40, avgCost: 105.20, currentPrice: 112.45, sector: 'Energy' },
    ];

    const totalValue = mockPositions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
    const totalCost = mockPositions.reduce((sum, p) => sum + (p.shares * p.avgCost), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

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
                                    {mockPositions.map((position) => {
                                        const value = position.shares * position.currentPrice;
                                        const cost = position.shares * position.avgCost;
                                        const gainLoss = value - cost;
                                        const gainLossPercent = (gainLoss / cost) * 100;

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
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Sector Breakdown */}
                        <div className="mt-6">
                            <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-3">Sector Allocation</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Technology', 'Financials', 'Energy', 'Healthcare'].map((sector) => {
                                    const sectorPositions = mockPositions.filter(p => p.sector === sector);
                                    const sectorValue = sectorPositions.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
                                    const sectorPercent = (sectorValue / totalValue) * 100;

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
