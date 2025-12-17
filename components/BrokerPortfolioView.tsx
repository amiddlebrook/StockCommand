import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface BrokerConnection {
    id: string;
    broker_name: string;
    is_active: number;
    connected_at: number;
}

interface Position {
    symbol: string;
    qty: number;
    side: 'long' | 'short';
    avgEntryPrice: number;
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    broker: string;
}

interface Balance {
    cash: number;
    portfolioValue: number;
    buyingPower: number;
    equity: number;
    currency: string;
    broker: string;
}

interface BrokerPortfolioViewProps {
    onOpenBrokerModal?: () => void;
}

export const BrokerPortfolioView: React.FC<BrokerPortfolioViewProps> = ({ onOpenBrokerModal }) => {
    const [connections, setConnections] = useState<BrokerConnection[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/brokers/connections');
            if (res.ok) {
                const data = await res.json() as BrokerConnection[];
                setConnections(data);

                // Fetch portfolio data for each connection
                if (data.length > 0) {
                    await Promise.all(data.map(conn => syncBroker(conn.broker_name, false)));
                }
            }
        } catch (err) {
            setError('Failed to fetch broker connections');
        } finally {
            setLoading(false);
        }
    };

    const syncBroker = async (brokerName: string, showLoading = true) => {
        if (showLoading) setSyncing(brokerName);

        try {
            // Fetch positions
            const posRes = await fetch(`/api/brokers/${brokerName}/positions`);
            if (posRes.ok) {
                const posData = await posRes.json() as Position[];
                setPositions(prev => {
                    // Remove old positions from this broker and add new ones
                    const filtered = prev.filter(p => p.broker !== brokerName);
                    return [...filtered, ...posData.map(p => ({ ...p, broker: brokerName }))];
                });
            }

            // Fetch balance
            const balRes = await fetch(`/api/brokers/${brokerName}/balance`);
            if (balRes.ok) {
                const balData = await balRes.json() as Balance;
                setBalances(prev => {
                    const filtered = prev.filter(b => b.broker !== brokerName);
                    return [...filtered, { ...balData, broker: brokerName }];
                });
            }
        } catch (err) {
            console.error(`Failed to sync ${brokerName}:`, err);
        } finally {
            if (showLoading) setSyncing(null);
        }
    };

    const getTotalPortfolioValue = () => {
        return balances.reduce((sum, b) => sum + b.portfolioValue, 0);
    };

    const getTotalCash = () => {
        return balances.reduce((sum, b) => sum + b.cash, 0);
    };

    const getTotalUnrealizedPL = () => {
        return positions.reduce((sum, p) => sum + p.unrealizedPL, 0);
    };

    const getTotalUnrealizedPLPercent = () => {
        const totalCost = positions.reduce((sum, p) => sum + p.costBasis, 0);
        if (totalCost === 0) return 0;
        return (getTotalUnrealizedPL() / totalCost) * 100;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    if (connections.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                    <Icon icon="briefcase" className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Brokers Connected</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        Connect your brokerage account to view your real portfolio positions and execute trades from signals.
                    </p>
                    {onOpenBrokerModal && (
                        <button
                            onClick={onOpenBrokerModal}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg transition-all"
                        >
                            Connect Broker
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white font-mono">PORTFOLIO_OVERVIEW</h2>
                        <p className="text-xs text-slate-500">Aggregated across {connections.length} broker{connections.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {syncing && (
                            <span className="text-xs text-cyan-400 animate-pulse">Syncing {syncing}...</span>
                        )}
                        <button
                            onClick={() => connections.forEach(c => syncBroker(c.broker_name))}
                            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title="Refresh all"
                        >
                            <Icon icon="loader" className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Total Value</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(getTotalPortfolioValue())}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Cash</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(getTotalCash())}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">P&L (Unrealized)</p>
                        <p className={`text-xl font-bold ${getTotalUnrealizedPL() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(getTotalUnrealizedPL())}
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Return</p>
                        <p className={`text-xl font-bold ${getTotalUnrealizedPLPercent() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(getTotalUnrealizedPLPercent())}
                        </p>
                    </div>
                </div>
            </div>

            {/* Positions Table */}
            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-bold text-cyan-400 mb-3 font-mono uppercase">Positions ({positions.length})</h3>

                {positions.length > 0 ? (
                    <div className="space-y-2">
                        {/* Table Header */}
                        <div className="grid grid-cols-8 gap-2 px-3 py-2 text-[10px] text-slate-500 uppercase border-b border-slate-800">
                            <div>Symbol</div>
                            <div>Broker</div>
                            <div className="text-right">Qty</div>
                            <div className="text-right">Avg Cost</div>
                            <div className="text-right">Current</div>
                            <div className="text-right">Market Value</div>
                            <div className="text-right">P&L</div>
                            <div className="text-right">%</div>
                        </div>

                        {/* Table Rows */}
                        {positions.map((pos, idx) => (
                            <div
                                key={`${pos.broker}-${pos.symbol}-${idx}`}
                                className="grid grid-cols-8 gap-2 px-3 py-2 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-slate-800/50 text-sm transition-colors"
                            >
                                <div className="font-bold text-white">{pos.symbol}</div>
                                <div>
                                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded uppercase">
                                        {pos.broker}
                                    </span>
                                </div>
                                <div className="text-right text-slate-300">
                                    {pos.qty} <span className="text-slate-500 text-xs">{pos.side === 'short' ? '(S)' : ''}</span>
                                </div>
                                <div className="text-right text-slate-400">{formatCurrency(pos.avgEntryPrice)}</div>
                                <div className="text-right text-white">{formatCurrency(pos.currentPrice)}</div>
                                <div className="text-right text-white">{formatCurrency(pos.marketValue)}</div>
                                <div className={`text-right font-medium ${pos.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(pos.unrealizedPL)}
                                </div>
                                <div className={`text-right font-medium ${pos.unrealizedPLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatPercent(pos.unrealizedPLPercent)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        <Icon icon="chart" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No open positions</p>
                        <p className="text-xs mt-1">Execute a trade to see positions here</p>
                    </div>
                )}
            </div>

            {/* Connected Brokers Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {connections.map(conn => (
                            <div
                                key={conn.id}
                                className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded text-xs"
                            >
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-slate-300 uppercase">{conn.broker_name}</span>
                            </div>
                        ))}
                    </div>
                    {onOpenBrokerModal && (
                        <button
                            onClick={onOpenBrokerModal}
                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            + Add Broker
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
