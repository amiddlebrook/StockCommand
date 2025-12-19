import React from 'react';
import { Icon } from './Icon';

interface DuelsViewProps { }

export const DuelsView: React.FC<DuelsViewProps> = () => {
    const mockActiveDuels = [
        { id: 1, opponent: 'QuantMaster', stake: 500, duration: '7d', yourReturn: 12.4, theirReturn: 8.2, status: 'winning' },
        { id: 2, opponent: 'ThetaGang', stake: 1000, duration: '30d', yourReturn: -2.1, theirReturn: 5.4, status: 'losing' },
    ];

    const mockOpenChallenges = [
        { id: 3, challenger: 'SwingTrader', stake: 250, duration: '7d', winRate: 62, strategies: 11 },
        { id: 4, challenger: 'DeepValue', stake: 500, duration: '14d', winRate: 65, strategies: 6 },
        { id: 5, challenger: 'MomentumKing', stake: 1000, duration: '30d', winRate: 62, strategies: 9 },
    ];

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="zap" className="w-6 h-6 text-red-400" />
                    <h2 className="text-xl font-bold tracking-wide">DUELS</h2>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Icon icon="plus" className="w-4 h-4" />
                    Challenge Trader
                </button>
            </div>

            {/* Active Duels */}
            <div>
                <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-3">Active Duels</h3>
                <div className="space-y-3">
                    {mockActiveDuels.map((duel) => (
                        <div key={duel.id} className={`p-4 border rounded-lg ${duel.status === 'winning' ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                        <Icon icon="user" className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold">vs {duel.opponent}</div>
                                        <div className="text-sm text-slate-400">{duel.duration} duel • ${duel.stake} stake</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <div className="text-xs text-slate-400">YOU</div>
                                        <div className={`text-lg font-mono ${duel.yourReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {duel.yourReturn >= 0 ? '+' : ''}{duel.yourReturn}%
                                        </div>
                                    </div>
                                    <div className="text-2xl text-slate-600">vs</div>
                                    <div className="text-center">
                                        <div className="text-xs text-slate-400">THEM</div>
                                        <div className={`text-lg font-mono ${duel.theirReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {duel.theirReturn >= 0 ? '+' : ''}{duel.theirReturn}%
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold ${duel.status === 'winning' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {duel.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Open Challenges */}
            <div>
                <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-3">Open Challenges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockOpenChallenges.map((challenge) => (
                        <div key={challenge.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center">
                                    <Icon icon="user" className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="font-bold">{challenge.challenger}</div>
                                    <div className="text-xs text-slate-400">{challenge.winRate}% win rate • {challenge.strategies} strategies</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-3">
                                <span className="text-slate-400">Stake: <span className="text-white font-mono">${challenge.stake}</span></span>
                                <span className="text-slate-400">Duration: <span className="text-white">{challenge.duration}</span></span>
                            </div>
                            <button className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors">
                                Accept Challenge
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
