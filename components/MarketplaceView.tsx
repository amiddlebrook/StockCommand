import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface MarketplaceStrategy {
    id: number;
    name: string;
    creator: string;
    price: number;
    returns: number;
    subscribers: number;
    rating: number;
}

interface MarketplaceViewProps { }

export const MarketplaceView: React.FC<MarketplaceViewProps> = () => {
    const [activeTab, setActiveTab] = useState<'browse' | 'my-strategies' | 'purchased'>('browse');
    const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStrategies = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/marketplace/strategies?tab=${activeTab}`);
                if (res.ok) {
                    const data = await res.json();
                    setStrategies(Array.isArray(data) ? data : []);
                } else {
                    setStrategies([]);
                }
            } catch (e) {
                console.warn('Marketplace fetch error:', e);
                setStrategies([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStrategies();
    }, [activeTab]);

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="store" className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-bold tracking-wide">STRATEGY MARKETPLACE</h2>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Icon icon="plus" className="w-4 h-4" />
                    List Strategy
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'browse' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                    Browse
                </button>
                <button
                    onClick={() => setActiveTab('my-strategies')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'my-strategies' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                    My Strategies
                </button>
                <button
                    onClick={() => setActiveTab('purchased')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'purchased' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                    Purchased
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-slate-400 font-mono">Loading strategies...</p>
                </div>
            ) : strategies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Icon icon="store" className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">
                        {activeTab === 'browse' ? 'No Strategies Listed' :
                            activeTab === 'my-strategies' ? 'No Strategies Created' : 'No Purchased Strategies'}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md">
                        {activeTab === 'browse' ? 'Strategy marketplace is empty. Be the first to list a strategy!' :
                            activeTab === 'my-strategies' ? 'Create and list your strategies to earn from subscriptions.' :
                                'Purchase strategies from top traders to boost your performance.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {strategies.map((strategy) => (
                        <div key={strategy.id} className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-emerald-500/50 transition-colors">
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg">{strategy.name}</h3>
                                        <p className="text-sm text-slate-400">by {strategy.creator}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Icon icon="star" className="w-4 h-4 fill-current" />
                                        <span className="text-sm font-medium">{strategy.rating}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase">Returns</div>
                                        <div className="text-lg font-bold text-green-400">+{strategy.returns}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase">Subscribers</div>
                                        <div className="text-lg font-bold">{strategy.subscribers}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-emerald-400">${strategy.price}</span>
                                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors">
                                        Purchase
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
