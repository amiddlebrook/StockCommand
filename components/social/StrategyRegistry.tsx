import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { GlassButton } from '../ui/GlassButton';

interface SharedStrategy {
    id: string;
    userId: string;
    name: string;
    description: string;
    performance: {
        roi: number;
        winRate: number;
        drawdown: number;
    };
    clones: number;
    price: number;
    displayName: string;
    avatarUrl?: string;
}

export const StrategyRegistry: React.FC = () => {
    const [strategies, setStrategies] = useState<SharedStrategy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/social/strategies')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStrategies(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">Loading Intelligence...</div>;

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Icon icon="cpu" className="mr-3 text-cyan-400" /> Strategy Registry
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                    <div key={strategy.id} className="bg-slate-900 border border-slate-800 p-5 rounded-lg hover:border-cyan-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                                    {strategy.avatarUrl ? (
                                        <img src={strategy.avatarUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                            {strategy.displayName.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-200">{strategy.name}</div>
                                    <div className="text-xs text-slate-500">by {strategy.displayName}</div>
                                </div>
                            </div>
                            <div className="text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/20">
                                {strategy.performance.roi}% ROI
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm mb-4 h-10 overflow-hidden line-clamp-2">
                            {strategy.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
                                <div className="text-green-400 font-bold text-sm">{strategy.performance.winRate}%</div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Users</div>
                                <div className="text-white font-bold text-sm">{strategy.clones}</div>
                            </div>
                            <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Cost</div>
                                <div className="text-yellow-400 font-bold text-sm">{strategy.price || 'Free'}</div>
                            </div>
                        </div>

                        <GlassButton className="w-full text-xs py-2">
                            CLONE AGENT
                        </GlassButton>
                    </div>
                ))}
            </div>

            {strategies.length === 0 && (
                <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No public strategies available. Be the first to publish.
                </div>
            )}
        </div>
    );
};
