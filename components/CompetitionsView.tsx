import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

interface Player {
    rank: number;
    name: string;
    org: string;
    pnl: number;
    delta: number;
    isUser?: boolean;
    isAi?: boolean;
}

const LEADERBOARD: Player[] = [
    { rank: 1, name: 'HIVE_MIND_CORE', org: 'SYSTEM', pnl: 42.8, delta: 1.2, isAi: true },
    { rank: 2, name: 'Citadel_Alpha', org: 'HF', pnl: 38.5, delta: 0.8 },
    { rank: 3, name: 'Vanguard_Quant', org: 'HF', pnl: 35.1, delta: -0.2 },
    { rank: 4, name: 'COMMANDER (YOU)', org: 'USER', pnl: 28.4, delta: 2.1, isUser: true },
    { rank: 5, name: 'Retail_Whale', org: 'IND', pnl: 12.2, delta: -1.5 },
];

interface CompetitionsViewProps {
    onSubmitPortfolio: () => void;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ onSubmitPortfolio }) => {
    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
            {/* Background Map Overlay */}
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-5 bg-no-repeat bg-center bg-cover pointer-events-none mix-blend-overlay" />

            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 flex items-center gap-3">
                        <Icon icon="crosshair" className="text-red-500 w-8 h-8 animate-pulse" />
                        WAR GAMES
                    </h1>
                    <p className="text-red-400/60 text-sm mt-1 font-mono tracking-widest">GLOBAL ALPHA CONFLICT ACTIVE</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-red-900/20 border border-red-900/50 px-4 py-2 rounded flex flex-col items-center">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">DEFCON</span>
                        <span className="text-2xl font-black text-red-500 leading-none">3</span>
                    </div>
                </div>
            </div>

            {/* Main Battle Area */}
            <div className="flex-1 overflow-y-auto p-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Leaderboard */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Icon icon="list" className="text-cyan-500" />
                                    Global Ranking
                                </h3>
                                <span className="text-xs text-emerald-400 animate-pulse">● LIVE UPDATES</span>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {LEADERBOARD.map((player) => (
                                    <div key={player.rank} className={`flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors ${player.isUser ? 'bg-cyan-900/10 border-l-2 border-cyan-500' : ''} ${player.isAi ? 'bg-purple-900/10 border-l-2 border-purple-500' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-mono text-xl font-bold w-8 ${player.rank <= 3 ? 'text-yellow-500' : 'text-slate-500'}`}>#{player.rank}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${player.isUser ? 'text-cyan-400' : player.isAi ? 'text-purple-400' : 'text-white'}`}>{player.name}</span>
                                                    {player.isAi && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded border border-purple-500/30">AI</span>}
                                                    {player.isUser && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1 rounded border border-cyan-500/30">YOU</span>}
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono">{player.org} // TIER 1</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-white font-mono">{player.pnl}%</div>
                                            <div className={`text-xs font-mono flex items-center justify-end gap-1 ${player.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {player.delta >= 0 ? '▲' : '▼'} {Math.abs(player.delta)}% 24h
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Events Log */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 font-mono text-sm space-y-2 opacity-80">
                            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Tactical Log</div>
                            <div className="flex gap-2 text-slate-400"><span className="text-slate-600">[12:04:02]</span> Citadel_Alpha liquidated <span className="text-red-400">SHORT SPY</span> positions.</div>
                            <div className="flex gap-2 text-slate-400"><span className="text-slate-600">[12:03:45]</span> HIVE_MIND_CORE detected <span className="text-purple-400">Gamma Squeeze</span> in NVDA.</div>
                            <div className="flex gap-2 text-slate-400"><span className="text-slate-600">[12:01:12]</span> Retail_Whale entered <span className="text-emerald-400">LONG TSLA</span> ($2.4M).</div>
                        </div>
                    </div>

                    {/* Right Col: User Status */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Commander Status</h3>

                            <div className="text-center mb-6">
                                <div className="text-4xl font-black text-cyan-400 mb-1">28.4%</div>
                                <div className="text-sm text-cyan-600 font-mono">YTD RETURN</div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Rank Progress</span>
                                        <span>RANK #4</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-600 w-[75%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Win Rate</span>
                                        <span className="text-emerald-400">62%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600 w-[62%]" />
                                    </div>
                                </div>
                            </div>

                            <GlassButton variant="primary" className="w-full justify-center group" onClick={onSubmitPortfolio}>
                                <span className="group-hover:text-white transition-colors">DEPLOY STRATEGY</span>
                            </GlassButton>
                        </div>

                        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <Icon icon="bot" className="w-8 h-8 text-purple-400" />
                                <div>
                                    <h4 className="font-bold text-white mb-1">Hive Mind Analysis</h4>
                                    <p className="text-sm text-purple-200/60 leading-relaxed">
                                        Your alpha correlation with the Hive Mind is <span className="text-white font-bold">84%</span>. Divergence detected in Energy sector. Recommended Action: Review XLE exposure.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
