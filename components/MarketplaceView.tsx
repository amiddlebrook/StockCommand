import React, { useState } from 'react';
import { Icon } from './Icon';

interface MarketplaceViewProps { }

export const MarketplaceView: React.FC<MarketplaceViewProps> = () => {
    const [activeTab, setActiveTab] = useState<'browse' | 'my-strategies' | 'purchased'>('browse');

    const mockStrategies = [
        { id: 1, name: 'Momentum Alpha', creator: 'QuantMaster', price: 299, returns: 156.3, subscribers: 234, rating: 4.8 },
        { id: 2, name: 'Theta Harvester', creator: 'ThetaGang', price: 499, returns: 89.2, subscribers: 156, rating: 4.6 },
        { id: 3, name: 'Deep Value Scanner', creator: 'DeepValue', price: 199, returns: 124.5, subscribers: 89, rating: 4.9 },
        { id: 4, name: 'Macro Rotator', creator: 'MacroHunter', price: 399, returns: 67.8, subscribers: 45, rating: 4.4 },
        { id: 5, name: 'Swing Catcher Pro', creator: 'SwingTrader', price: 249, returns: 98.1, subscribers: 178, rating: 4.7 },
        { id: 6, name: 'AI Sentiment Bot', creator: 'AlphaTrader99', price: 799, returns: 234.2, subscribers: 312, rating: 4.9 },
    ];

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

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockStrategies.map((strategy) => (
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
        </div>
    );
};
