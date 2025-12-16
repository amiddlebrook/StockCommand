import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { MarketClock, UserStrategy } from '../lib/agent/types';
import { StorageService } from '../lib/storage';
import { simulateWarGame, BattleResult } from '../lib/wargame';

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

const INITIAL_LEADERBOARD: Player[] = [
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

    // State
    const [leaderboard, setLeaderboard] = useState<Player[]>(INITIAL_LEADERBOARD);
    const [isDeploying, setIsDeploying] = useState(false);
    const [userStrategies, setUserStrategies] = useState<UserStrategy[]>([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Calculate DEFCON based on Market Stress (kept logic)
    const defconLevel = useMemo(() => {
        let level = 4;
        const redClocks = clocks.filter(c => c.status === 'red').length;
        const yellowClocks = clocks.filter(c => c.status === 'yellow').length;
        if (redClocks >= 2) return 1;
        if (redClocks === 1) return 2;
        if (yellowClocks >= 2) return 3;
        return level;
    }, [clocks]);

    // Load strategies on mount
    useEffect(() => {
        setUserStrategies(StorageService.loadStrategies());
    }, []);

    const handleDeployClick = () => {
        setIsDeploying(true);
        setBattleResult(null);
        setBattleLog([]);
    };

    const handleRunSimulation = async () => {
        if (!selectedStrategyId) return;
        const strategy = userStrategies.find(s => s.id === selectedStrategyId);
        if (!strategy) return;

        setIsSimulating(true);
        setBattleLog([`Initializing uplink to War Games server...`, `Authenticating strategy: ${strategy.name}...`]);

        // Mock delay for dramatic effect
        await new Promise(r => setTimeout(r, 800));
        setBattleLog(prev => [...prev, `Syncing with global market clocks...`]);
        await new Promise(r => setTimeout(r, 800));

        // Actual Simulation
        const result = simulateWarGame(strategy, clocks);

        // Stream the result logs
        for (const log of result.log) {
            setBattleLog(prev => [...prev, log]);
            await new Promise(r => setTimeout(r, 400));
        }

        setBattleResult(result);
        setIsSimulating(false);

        // Update Leaderboard Mock
        setLeaderboard(prev => prev.map(p => {
            if (p.isUser) {
                return { ...p, pnl: p.pnl + result.pnlPercent, delta: result.pnlPercent };
            }
            return p;
        }).sort((a, b) => b.pnl - a.pnl).map((p, i) => ({ ...p, rank: i + 1 })));
    };

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

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Operations Center */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Official / Major Events (Existing) */}
                        {/* Simplified for brevity in this view, keeping full layout logic */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Icon icon="star" className="text-amber-400 w-4 h-4" />
                                SANCTIONED OPERATIONS
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_COMPETITIONS.filter(c => c.prize).map(comp => (
                                    <div key={comp.id} className="bg-gradient-to-br from-amber-900/10 to-slate-900 border border-amber-500/30 rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-amber-500/60 transition-all">
                                        <div className="absolute top-0 right-0 p-2 opacity-50"><Icon icon="award" className="w-12 h-12 text-amber-500/10 transform rotate-12" /></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">OFFICIAL</span>
                                                <span className="text-amber-400 font-bold font-mono text-sm">{comp.prize}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-100 transition-colors">{comp.name}</h4>
                                            <GlassButton size="sm" variant="primary" className="w-full justify-center mt-4 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200">ENTER WARZONE</GlassButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Events Log (Mock) */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 font-mono text-sm space-y-2 opacity-80">
                            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Tactical Log</div>
                            <div className="flex gap-2 text-slate-400"><span className="text-slate-600">[12:04:02]</span> Citadel_Alpha liquidated <span className="text-red-400">SHORT SPY</span> positions.</div>
                            <div className="flex gap-2 text-slate-400"><span className="text-slate-600">[12:03:45]</span> HIVE_MIND_CORE detected <span className="text-purple-400">Gamma Squeeze</span> in NVDA.</div>
                        </div>
                    </div>

                    {/* Right Col: User Status & Leaderboard */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Commander Status</h3>

                            {/* Dynamic Leaderboard for User */}
                            {leaderboard.filter(p => p.isUser).map(user => (
                                <div key={user.name} className="text-center mb-6">
                                    <div className={`text-4xl font-black mb-1 ${user.pnl >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                        {user.pnl > 0 ? '+' : ''}{user.pnl.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-cyan-600 font-mono">YTD RETURN</div>
                                    <div className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Global Rank #{user.rank}</div>
                                </div>
                            ))}

                            <GlassButton variant="primary" className="w-full justify-center group" onClick={handleDeployClick}>
                                <span className="group-hover:text-white transition-colors">DEPLOY STRATEGY</span>
                            </GlassButton>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Global Leaderboard</h3>
                            <div className="space-y-2">
                                {leaderboard.map(p => (
                                    <div key={p.name} className={`flex justify-between items-center text-sm p-2 rounded ${p.isUser ? 'bg-cyan-900/20 border border-cyan-700/30' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-500 w-4">{p.rank}</span>
                                            <span className={`font-bold ${p.isUser ? 'text-cyan-400' : 'text-slate-300'}`}>{p.name}</span>
                                        </div>
                                        <span className={`font-mono ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {p.pnl > 0 ? '+' : ''}{p.pnl.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DEPLOY MODAL OVERLAY */}
            {isDeploying && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Icon icon="upload" className="text-cyan-500" />
                                MISSION BRIEFING
                            </h2>
                            <button onClick={() => setIsDeploying(false)} className="text-slate-500 hover:text-white"><Icon icon="x" /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            {!battleResult ? (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Select Strategy to Deploy</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {userStrategies.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => !isSimulating && setSelectedStrategyId(s.id)}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedStrategyId === s.id ? 'bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                                >
                                                    <div className="font-bold text-white mb-1">{s.name}</div>
                                                    <div className="text-xs text-slate-400">{s.triggers.length} Triggers • {s.actions.length} Actions</div>
                                                </div>
                                            ))}
                                            {userStrategies.length === 0 && (
                                                <div className="col-span-2 text-center p-8 border border-dashed border-slate-700 text-slate-500 rounded-lg">
                                                    No strategies found. Visit Strategy Forge to create one.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Console Log Area */}
                                    <div className="bg-black rounded-lg p-4 font-mono text-xs text-emerald-500 h-48 overflow-y-auto border border-slate-800 shadow-inner">
                                        {battleLog.length === 0 ? (
                                            <span className="text-slate-600 animate-pulse">Awaiting launch command...</span>
                                        ) : (
                                            battleLog.map((log, i) => <div key={i}>{'>'} {log}</div>)
                                        )}
                                        {isSimulating && <div className="animate-pulse">{'>'} Processing...</div>}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 animate-fadeIn">
                                    <div className={`text-6xl mb-4 ${battleResult.outcome === 'VICTORY' ? 'text-emerald-500' : battleResult.outcome === 'DEFEAT' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {battleResult.outcome === 'VICTORY' ? '🏆' : battleResult.outcome === 'DEFEAT' ? '💀' : '⚖️'}
                                    </div>
                                    <h2 className={`text-4xl font-black uppercase mb-2 ${battleResult.outcome === 'VICTORY' ? 'text-emerald-500' : battleResult.outcome === 'DEFEAT' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {battleResult.outcome}
                                    </h2>
                                    <div className="text-2xl font-mono text-white mb-6">
                                        PnL: <span className={battleResult.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>{battleResult.pnlPercent > 0 ? '+' : ''}{battleResult.pnlPercent}%</span>
                                        <span className="mx-4 text-slate-600">|</span>
                                        Alpha: <span className={battleResult.alpha >= 0 ? 'text-emerald-400' : 'text-red-400'}>{battleResult.alpha > 0 ? '+' : ''}{battleResult.alpha}</span>
                                    </div>
                                    <GlassButton to="#" onClick={() => setIsDeploying(false)} variant="primary" className="mx-auto">RETURN TO BASE</GlassButton>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {!battleResult && (
                            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
                                <GlassButton
                                    to="#"
                                    onClick={handleRunSimulation}
                                    disabled={!selectedStrategyId || isSimulating}
                                    variant="primary"
                                    className={isSimulating ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                    {isSimulating ? 'SIMULATING WARGAME...' : 'INITIATE SIMULATION'}
                                </GlassButton>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
