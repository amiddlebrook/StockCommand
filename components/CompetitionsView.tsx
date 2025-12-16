import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { MarketClock } from '../lib/agent/types';

interface Player {
    rank: number;
    name: string;
    org: string;
    pnl: number;
    delta: number;
    isUser?: boolean;
    isAi?: boolean;
}

interface Competition {
    id: string;
    name: string;
    type: 'public' | 'private';
    participants: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'upcoming' | 'completed';
    prize?: string;
}

const LEADERBOARD: Player[] = [
    { rank: 1, name: 'HIVE_MIND_CORE', org: 'SYSTEM', pnl: 42.8, delta: 1.2, isAi: true },
    { rank: 2, name: 'Citadel_Alpha', org: 'HF', pnl: 38.5, delta: 0.8 },
    { rank: 3, name: 'Vanguard_Quant', org: 'HF', pnl: 35.1, delta: -0.2 },
    { rank: 4, name: 'COMMANDER (YOU)', org: 'USER', pnl: 28.4, delta: 2.1, isUser: true },
    { rank: 5, name: 'Retail_Whale', org: 'IND', pnl: 12.2, delta: -1.5 },
];

const MOCK_COMPETITIONS: Competition[] = [
    { id: '1', name: 'Q1 2025 Alpha Challenge', type: 'public', participants: 1247, startDate: '2025-01-01', endDate: '2025-03-31', status: 'upcoming', prize: '$10,000' },
    { id: '2', name: 'Tech Sector Showdown', type: 'public', participants: 823, startDate: '2024-12-01', endDate: '2024-12-31', status: 'active', prize: '$5,000' },
    { id: '3', name: 'Private League: Hedgies', type: 'private', participants: 24, startDate: '2024-11-01', endDate: '2025-02-28', status: 'active' },
    { id: '4', name: 'Macro Masters Cup', type: 'public', participants: 2156, startDate: '2024-10-01', endDate: '2024-12-15', status: 'active', prize: '$15,000' },
];

interface CompetitionsViewProps {
    onSubmitPortfolio: () => void;
    clocks: MarketClock[];
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ onSubmitPortfolio, clocks }) => {

    // Calculate DEFCON based on Market Stress
    const defconLevel = useMemo(() => {
        // Default to 4 (Guarded)
        let level = 4;

        const redClocks = clocks.filter(c => c.status === 'red').length;
        const yellowClocks = clocks.filter(c => c.status === 'yellow').length;

        if (redClocks >= 2) return 1; // Critical
        if (redClocks === 1) return 2; // Severe
        if (yellowClocks >= 2) return 3; // Elevated

        return level;
    }, [clocks]);

    const getDefconColor = (level: number) => {
        if (level === 1) return 'text-red-600 animate-pulse';
        if (level === 2) return 'text-red-500';
        if (level === 3) return 'text-amber-500';
        return 'text-emerald-500';
    };

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
                    <div className={`bg-slate-900 border px-4 py-2 rounded flex flex-col items-center shadow-lg transition-colors duration-500 ${defconLevel <= 2 ? 'border-red-500/50 bg-red-900/20' : 'border-slate-700'}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${getDefconColor(defconLevel)}`}>DEFCON</span>
                        <span className={`text-2xl font-black leading-none ${getDefconColor(defconLevel)}`}>{defconLevel}</span>
                    </div>
                </div>
            </div>

            {/* Main Battle Area */}
            <div className="flex-1 overflow-y-auto p-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Operations Center */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Official / Major Events */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Icon icon="star" className="text-amber-400 w-4 h-4" />
                                SANCTIONED OPERATIONS (PRIZE POOLS)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_COMPETITIONS.filter(c => c.prize).map(comp => (
                                    <div key={comp.id} className="bg-gradient-to-br from-amber-900/10 to-slate-900 border border-amber-500/30 rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-amber-500/60 transition-all">
                                        <div className="absolute top-0 right-0 p-2 opacity-50">
                                            <Icon icon="award" className="w-12 h-12 text-amber-500/10 transform rotate-12" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">
                                                    OFFICIAL
                                                </span>
                                                <span className="text-amber-400 font-bold font-mono text-sm">{comp.prize}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-100 transition-colors">{comp.name}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                                                <span className="flex items-center gap-1"><Icon icon="users" className="w-3 h-3" /> {comp.participants.toLocaleString()}</span>
                                                <span>•</span>
                                                <span>{comp.endDate} (Ending Soon)</span>
                                            </div>
                                            <GlassButton size="sm" variant="primary" className="w-full justify-center bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/50 text-amber-200">
                                                ENTER WARZONE
                                            </GlassButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Community / User Generated */}
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Icon icon="globe" className="text-blue-400 w-4 h-4" />
                                    COMMUNITY SKIRMISHES
                                </h3>
                                <div className="flex gap-2 text-xs">
                                    <button className="text-white font-bold bg-slate-800 px-2 py-1 rounded">TRENDING</button>
                                    <button className="text-slate-500 hover:text-white px-2 py-1 transition-colors">NEW</button>
                                    <button className="text-slate-500 hover:text-white px-2 py-1 transition-colors">FRIENDS</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {MOCK_COMPETITIONS.filter(c => !c.prize).concat([
                                    { id: '101', name: 'WSB Degens Only', type: 'public', participants: 42069, startDate: '2024-12-01', endDate: '2024-12-31', status: 'active', prize: undefined },
                                    { id: '102', name: 'Theta Gang Strategies', type: 'public', participants: 405, startDate: '2024-12-01', endDate: '2024-12-31', status: 'active', prize: undefined }
                                ]).map(comp => (
                                    <div key={comp.id} className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded bg-slate-800 ${comp.type === 'private' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                <Icon icon={comp.type === 'private' ? 'lock' : 'users'} className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{comp.name}</h4>
                                                <div className="flex gap-2 text-[10px] text-slate-500 uppercase font-bold mt-1">
                                                    <span>{comp.type}</span>
                                                    <span>•</span>
                                                    <span>{comp.participants.toLocaleString()} Fighters</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] text-emerald-400 font-bold">AVG RTRN</div>
                                                <div className="text-sm font-mono text-white">+12.4%</div>
                                            </div>
                                            <GlassButton size="sm" variant="glass">Join</GlassButton>
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

                        {/* Host Action */}
                        <div className="pt-4 border-t border-slate-800">
                            <GlassButton variant="glass" className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white">
                                + HOST WARGAME
                            </GlassButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
