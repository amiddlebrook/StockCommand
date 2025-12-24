import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface TradingSignal {
    id: string;
    symbol: string;
    signalType: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
    confidence: number;
    targetPrice?: number;
    stopLoss?: number;
    reasoning: string;
    source: 'AI' | 'CROWD_WISDOM' | 'MARKET_CLOCK' | 'USER_STRATEGY';
    createdAt: number;
    expiresAt: number;
}

interface BrokerConnection {
    id: string;
    broker_name: string;
    is_active: number;
}

interface TradeExecutionPanelProps {
    signals?: TradingSignal[];
    onExecuteTrade?: (signal: TradingSignal, broker: string, qty: number) => void;
}

// No mock signals - component shows empty state when no signals available
export const TradeExecutionPanel: React.FC<TradeExecutionPanelProps> = ({
    signals = [], // Empty by default - signals come from agent workflow
    onExecuteTrade
}) => {
    const [connections, setConnections] = useState<BrokerConnection[]>([]);
    const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
    const [selectedBroker, setSelectedBroker] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('1');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [limitPrice, setLimitPrice] = useState<string>('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/brokers/connections');
            if (res.ok) {
                const data = await res.json() as BrokerConnection[];
                setConnections(data);
                if (data.length > 0) {
                    setSelectedBroker(data[0].broker_name);
                }
            }
        } catch (error) {
            console.error('Failed to fetch broker connections:', error);
        }
    };

    const getSignalColor = (type: string) => {
        switch (type) {
            case 'BUY': return 'text-green-400 bg-green-500/20 border-green-500/50';
            case 'SELL': return 'text-red-400 bg-red-500/20 border-red-500/50';
            case 'HOLD': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
            case 'CLOSE': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
            default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'AI': return '🤖';
            case 'CROWD_WISDOM': return '👥';
            case 'MARKET_CLOCK': return '⏰';
            case 'USER_STRATEGY': return '📊';
            default: return '📡';
        }
    };

    const getTimeRemaining = (expiresAt: number) => {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) return 'Expired';
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleExecute = async () => {
        if (!selectedSignal || !selectedBroker) return;

        setIsExecuting(true);
        setExecutionResult(null);

        try {
            // In production, this would call the broker API
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

            if (onExecuteTrade) {
                onExecuteTrade(selectedSignal, selectedBroker, parseFloat(quantity));
            }

            setExecutionResult({
                success: true,
                message: `Order submitted: ${selectedSignal.signalType} ${quantity} ${selectedSignal.symbol} via ${selectedBroker.toUpperCase()}`
            });

            // Reset form
            setTimeout(() => {
                setSelectedSignal(null);
                setExecutionResult(null);
            }, 3000);

        } catch (error: any) {
            setExecutionResult({
                success: false,
                message: error.message || 'Order execution failed'
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white font-mono">TRADE_EXECUTION</h2>
                        <p className="text-xs text-slate-500">Review signals and execute trades</p>
                    </div>
                    {connections.length === 0 && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded">
                            NO BROKER CONNECTED
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Signals List */}
                <div className="w-1/2 border-r border-slate-800 overflow-y-auto p-4">
                    <h3 className="text-xs font-bold text-cyan-400 mb-3 font-mono uppercase">Active Signals ({signals.length})</h3>

                    <div className="space-y-2">
                        {signals.map(signal => (
                            <div
                                key={signal.id}
                                onClick={() => setSelectedSignal(signal)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSignal?.id === signal.id
                                    ? 'bg-cyan-900/30 border-cyan-500'
                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-white">{signal.symbol}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSignalColor(signal.signalType)}`}>
                                            {signal.signalType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getSourceIcon(signal.source)}</span>
                                        <span className={`text-xs font-mono ${signal.confidence >= 0.8 ? 'text-green-400' :
                                            signal.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {Math.round(signal.confidence * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{signal.reasoning}</p>

                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <span>Expires: {getTimeRemaining(signal.expiresAt)}</span>
                                    {signal.targetPrice && (
                                        <span>Target: ${signal.targetPrice.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {signals.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No active signals
                            </div>
                        )}
                    </div>
                </div>

                {/* Execution Panel */}
                <div className="w-1/2 p-4 overflow-y-auto">
                    {selectedSignal ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-cyan-400 mb-3 font-mono uppercase">Execute Trade</h3>

                            {/* Signal Summary */}
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl font-bold text-white">{selectedSignal.symbol}</span>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getSignalColor(selectedSignal.signalType)}`}>
                                        {selectedSignal.signalType}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">{selectedSignal.reasoning}</p>
                            </div>

                            {/* Broker Selection */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Broker</label>
                                {connections.length > 0 ? (
                                    <select
                                        value={selectedBroker}
                                        onChange={(e) => setSelectedBroker(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                                    >
                                        {connections.map(conn => (
                                            <option key={conn.id} value={conn.broker_name}>
                                                {conn.broker_name.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
                                        Connect a broker to execute trades
                                    </div>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min="1"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Order Type */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Order Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setOrderType('market')}
                                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${orderType === 'market'
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Market
                                    </button>
                                    <button
                                        onClick={() => setOrderType('limit')}
                                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${orderType === 'limit'
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Limit
                                    </button>
                                </div>
                            </div>

                            {/* Limit Price */}
                            {orderType === 'limit' && (
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Limit Price</label>
                                    <input
                                        type="number"
                                        value={limitPrice}
                                        onChange={(e) => setLimitPrice(e.target.value)}
                                        step="0.01"
                                        placeholder={selectedSignal.targetPrice?.toString() || '0.00'}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            )}

                            {/* Target & Stop */}
                            {(selectedSignal.targetPrice || selectedSignal.stopLoss) && (
                                <div className="flex gap-4 text-xs">
                                    {selectedSignal.targetPrice && (
                                        <div>
                                            <span className="text-slate-500">Target: </span>
                                            <span className="text-green-400">${selectedSignal.targetPrice.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {selectedSignal.stopLoss && (
                                        <div>
                                            <span className="text-slate-500">Stop: </span>
                                            <span className="text-red-400">${selectedSignal.stopLoss.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Execution Result */}
                            {executionResult && (
                                <div className={`p-3 rounded text-sm ${executionResult.success
                                    ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                    : 'bg-red-900/30 text-red-400 border border-red-500/30'
                                    }`}>
                                    {executionResult.message}
                                </div>
                            )}

                            {/* Execute Button */}
                            <button
                                onClick={handleExecute}
                                disabled={isExecuting || connections.length === 0}
                                className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${selectedSignal.signalType === 'BUY' || selectedSignal.signalType === 'HOLD'
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700'
                                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700'
                                    } text-white disabled:text-slate-400 shadow-lg`}
                            >
                                {isExecuting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Executing...
                                    </span>
                                ) : (
                                    `${selectedSignal.signalType} ${quantity} ${selectedSignal.symbol}`
                                )}
                            </button>

                            {/* Disclaimer */}
                            <p className="text-[9px] text-slate-600 text-center leading-relaxed">
                                This is not investment advice. You are responsible for all trading decisions.
                                By clicking execute, you agree to submit an order through your connected broker.
                            </p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center text-slate-500">
                                <Icon icon="chart" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Select a signal to execute</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
