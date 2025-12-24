import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface BrokerInfo {
    name: string;
    displayName: string;
    logo?: string;
    description: string;
    supportedAssets: string[];
    supportsPaperTrading: boolean;
    website: string;
    isConfigured: boolean;
}

interface BrokerConnection {
    id: string;
    broker_name: string;
    is_active: number;
    connected_at: number;
    last_sync?: number;
}

interface BrokerConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BrokerConnectionModal: React.FC<BrokerConnectionModalProps> = ({ isOpen, onClose }) => {
    const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
    const [connections, setConnections] = useState<BrokerConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchBrokers();
            fetchConnections();
        }
    }, [isOpen]);

    const fetchBrokers = async () => {
        try {
            const res = await fetch('/api/brokers');
            const data = await res.json() as BrokerInfo[];
            setBrokers(data);
        } catch (error) {
            console.error('Failed to fetch brokers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/brokers/connections');
            if (res.ok) {
                const data = await res.json() as BrokerConnection[];
                setConnections(data);
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        }
    };

    const connectBroker = async (brokerName: string) => {
        setConnecting(brokerName);
        try {
            const res = await fetch(`/api/brokers/${brokerName}/auth`);
            const data = await res.json() as { authUrl?: string };
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (error) {
            console.error('Failed to initiate connection:', error);
            setConnecting(null);
        }
    };

    const disconnectBroker = async (connectionId: string) => {
        try {
            await fetch(`/api/brokers/connections/${connectionId}`, {
                method: 'DELETE'
            });
            setConnections(prev => prev.filter(c => c.id !== connectionId));
        } catch (error) {
            console.error('Failed to disconnect broker:', error);
        }
    };

    const isConnected = (brokerName: string) => {
        return connections.some(c => c.broker_name === brokerName && c.is_active);
    };

    const getConnection = (brokerName: string) => {
        return connections.find(c => c.broker_name === brokerName && c.is_active);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-cyan-500/30 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl shadow-cyan-500/10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white font-mono">CONNECT_BROKERAGE</h2>
                        <p className="text-xs text-slate-500">Link your broker to enable trading from signals</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                        <Icon icon="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {brokers.map(broker => {
                                const connected = isConnected(broker.name);
                                const connection = getConnection(broker.name);

                                return (
                                    <div
                                        key={broker.name}
                                        className={`p-4 rounded-lg border transition-all ${connected
                                            ? 'bg-green-900/20 border-green-500/50'
                                            : broker.isConfigured
                                                ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50'
                                                : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-bold text-white">{broker.displayName}</span>
                                                    {connected && (
                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">
                                                            CONNECTED
                                                        </span>
                                                    )}
                                                    {broker.supportsPaperTrading && (
                                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded">
                                                            PAPER TRADING
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mb-2">{broker.description}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {broker.supportedAssets.map(asset => (
                                                        <span key={asset} className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-[9px] rounded uppercase">
                                                            {asset}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="ml-4">
                                                {connected && connection ? (
                                                    <button
                                                        onClick={() => disconnectBroker(connection.id)}
                                                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium rounded transition-colors"
                                                    >
                                                        Disconnect
                                                    </button>
                                                ) : broker.isConfigured ? (
                                                    <button
                                                        onClick={() => connectBroker(broker.name)}
                                                        disabled={connecting === broker.name}
                                                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-2"
                                                    >
                                                        {connecting === broker.name ? (
                                                            <>
                                                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                                Connecting...
                                                            </>
                                                        ) : (
                                                            'Connect'
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-500">Coming Soon</span>
                                                )}
                                            </div>
                                        </div>

                                        {connected && connection && (
                                            <div className="mt-3 pt-3 border-t border-slate-700/50 text-[10px] text-slate-500">
                                                Connected {new Date(connection.connected_at * 1000).toLocaleDateString()}
                                                {connection.last_sync && (
                                                    <> • Last sync: {new Date(connection.last_sync * 1000).toLocaleString()}</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <p className="text-[10px] text-slate-600 text-center">
                        StockCommand never stores your broker credentials on our servers.
                        All connections use OAuth for secure authentication.
                    </p>
                </div>
            </div>
        </div>
    );
};
