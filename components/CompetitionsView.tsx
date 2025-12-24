import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { MarketClock, UserStrategy } from '../lib/agent/types';
import { StorageService } from '../lib/storage';

interface Player {
    rank: number;
    name: string;
    org: string;
    pnl: number;
    delta: number;
    isUser?: boolean;
    isAi?: boolean;
    strategyId?: string;
}

interface Competition {
    id: string;
    name: string;
    type: 'public' | 'private';
    participants: number;
    startDate: string;
    endDate: string;
    endDateDisplay: string;
    status: 'active' | 'upcoming' | 'completed';
    prize?: string;
}

interface CompetitionsViewProps {
    clocks: MarketClock[];
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ clocks }) => {
    // State
    const [leaderboard, setLeaderboard] = useState<Player[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [communityStrategies, setCommunityStrategies] = useState<Record<string, UserStrategy>>({});
    const [inspectingStrategy, setInspectingStrategy] = useState<UserStrategy | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch leaderboard and competitions from API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [leaderboardRes, competitionsRes, strategiesRes] = await Promise.all([
                    fetch('/api/social/leaderboard'),
                    fetch('/api/social/competitions'),
                    fetch('/api/social/strategies'),
                ]);

                if (leaderboardRes.ok) {
                    const data = await leaderboardRes.json() as Player[];
                    setLeaderboard(Array.isArray(data) ? data : []);
                }
                if (competitionsRes.ok) {
                    const data = await competitionsRes.json() as Competition[];
                    setCompetitions(Array.isArray(data) ? data : []);
                }
                if (strategiesRes.ok) {
                    const data = await strategiesRes.json() as UserStrategy[];
                    const strategiesMap: Record<string, UserStrategy> = {};
                    (Array.isArray(data) ? data : []).forEach(s => {
                        strategiesMap[s.id] = s;
                    });
                    setCommunityStrategies(strategiesMap);
                }
            } catch (e) {
                console.warn('Competitions data fetch error:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate DEFCON based on Market Stress
    const defconLevel = useMemo(() => {
        let level = 4;
        const redClocks = clocks.filter(c => c.status === 'red').length;
        const yellowClocks = clocks.filter(c => c.status === 'yellow').length;
        if (redClocks >= 2) return 1;
        if (redClocks === 1) return 2;
        if (yellowClocks >= 2) return 3;
        return level;
    }, [clocks]);

    const getDefconColor = (level: number) => {
        if (level === 1) return 'text-red-600 animate-pulse';
        if (level === 2) return 'text-red-500';
        if (level === 3) return 'text-amber-500';
        return 'text-emerald-500';
    };

    const handleInspect = (player: Player) => {
        if (player.strategyId && communityStrategies[player.strategyId]) {
            setInspectingStrategy(communityStrategies[player.strategyId]);
        }
    };

    const handleClone = () => {
        if (inspectingStrategy) {
            StorageService.saveCloneStrategy(inspectingStrategy);
            alert(`Strategy "${inspectingStrategy.name}" cloned to Strategy Forge!`);
            setInspectingStrategy(null);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-400 font-mono">Loading competition data...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
            {/* Background Map Overlay */}
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-5 bg-no-repeat bg-center bg-cover pointer-events-none mix-blend-overlay" />

            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 flex items-center gap-3">
                        <Icon icon="crosshair" className="text-red-500 w-8 h-8 animate-pulse" />
                        WAR ZONE
                    </h1>
                    <p className="text-red-400/60 text-sm mt-1 font-mono tracking-widest">GLOBAL LEADERBOARD ACTIVE</p>
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
                        {/* Official / Major Events */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Icon icon="star" className="text-amber-400 w-4 h-4" />
                                SANCTIONED OPERATIONS
                            </h3>
                            {competitions.filter(c => c.prize).length === 0 ? (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
                                    <Icon icon="trophy" className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">No active competitions</p>
                                    <p className="text-xs text-slate-600 mt-1">Check back for upcoming events</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {competitions.filter(c => c.prize).map(comp => (
                                        <div key={comp.id} className="bg-gradient-to-br from-amber-900/10 to-slate-900 border border-amber-500/30 rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-amber-500/60 transition-all">
                                            <div className="absolute top-0 right-0 p-2 opacity-50"><Icon icon="award" className="w-12 h-12 text-amber-500/10 transform rotate-12" /></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">OFFICIAL</span>
                                                    <span className="text-amber-400 font-bold font-mono text-sm">{comp.prize}</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-100 transition-colors">{comp.name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                                                    <span className="flex items-center gap-1"><Icon icon="users" className="w-3 h-3" /> {comp.participants.toLocaleString()}</span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                    <span>{comp.endDateDisplay}</span>
                                                </div>
                                                <GlassButton size="sm" variant="glass" className="w-full justify-center">
                                                    VIEW STANDINGS
                                                </GlassButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tactical Log */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 font-mono text-sm space-y-2 opacity-80">
                            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Tactical Log</div>
                            <div className="text-center py-4 text-slate-500">
                                <p className="text-xs">No recent activity</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: User Status & Leaderboard */}
                    <div className="space-y-6">
                        {/* Leaderboard Table */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Global Leaderboard</h3>
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-8">
                                    <Icon icon="users" className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No rankings available</p>
                                    <p className="text-xs text-slate-600 mt-1">Join a competition to see the leaderboard</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map(p => (
                                        <div
                                            key={p.name}
                                            className={`flex justify-between items-center text-sm p-3 rounded border transition-colors ${p.isUser ? 'bg-cyan-900/20 border-cyan-700/30' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono w-6 text-center text-lg font-bold ${p.rank <= 3 ? 'text-amber-400' : 'text-slate-600'}`}>#{p.rank}</span>
                                                <div>
                                                    <div className={`font-bold flex items-center gap-2 ${p.isUser ? 'text-cyan-400' : 'text-slate-300'}`}>
                                                        {p.name}
                                                        {p.isAi && <Icon icon="bot" className="w-3 h-3 text-purple-400" />}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.org}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className={`font-mono font-bold ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {p.pnl > 0 ? '+' : ''}{p.pnl.toFixed(1)}%
                                                </span>
                                                {p.strategyId && communityStrategies[p.strategyId] && (
                                                    <button onClick={() => handleInspect(p)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-700 transition-colors" title="Inspect Strategy">
                                                        <Icon icon="search" className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Your Performance</h3>
                            <div className="text-center py-4">
                                <p className="text-sm text-slate-500">Join a competition to track your performance</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* INSPECT STRATEGY MODAL */}
            {inspectingStrategy && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Icon icon="eye" className="text-purple-400" />
                                STRATEGY INSPECTOR
                            </h2>
                            <button onClick={() => setInspectingStrategy(null)} className="text-slate-500 hover:text-white"><Icon icon="x" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <div className="text-2xl font-bold text-white mb-1">{inspectingStrategy.name}</div>
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">Author: {inspectingStrategy.author}</span>
                                    <span className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Return: +{inspectingStrategy.performance}%</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-2">Triggers</div>
                                    {inspectingStrategy.triggers.map(t => (
                                        <div key={t.id} className="text-sm text-slate-300 font-mono">
                                            <span className="text-blue-400">{t.metric}</span> {t.operator} <span className="text-white">{t.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-2">Actions</div>
                                    {inspectingStrategy.actions.map(a => (
                                        <div key={a.id} className="text-sm text-slate-300 font-mono">
                                            <span className="text-green-400">{a.type}</span> on <span className="text-white">{a.target}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <GlassButton variant="primary" className="w-full justify-center" onClick={handleClone}>
                                <Icon icon="copy" className="mr-2" />
                                CLONE STRATEGY
                            </GlassButton>
                            <p className="text-[10px] text-center text-slate-500 mt-2">
                                Cloning will add this strategy to your Forge where you can edit, test, and deploy it.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
