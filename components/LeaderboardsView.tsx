import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface Leader {
    rank: number;
    username: string;
    returns: number;
    winRate: number;
    strategies: number;
    badge: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
}

interface LeaderboardsViewProps { }

export const LeaderboardsView: React.FC<LeaderboardsViewProps> = () => {
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/social/leaderboard?period=${period}`);
                if (res.ok) {
                    const data = await res.json();
                    setLeaders(Array.isArray(data) ? data : []);
                } else {
                    setLeaders([]);
                }
            } catch (e) {
                console.warn('Leaderboard fetch error:', e);
                setLeaders([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, [period]);

    const getBadgeColor = (badge: string) => {
        switch (badge) {
            case 'diamond': return 'text-cyan-400 bg-cyan-900/30';
            case 'platinum': return 'text-slate-300 bg-slate-700/50';
            case 'gold': return 'text-amber-400 bg-amber-900/30';
            case 'silver': return 'text-slate-400 bg-slate-800/50';
            default: return 'text-slate-500 bg-slate-900/50';
        }
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'text-amber-400 text-2xl';
        if (rank === 2) return 'text-slate-300 text-xl';
        if (rank === 3) return 'text-amber-700 text-xl';
        return 'text-slate-500';
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="award" className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold tracking-wide">LEADERBOARDS</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPeriod('weekly')}
                        className={`px-3 py-1.5 text-sm rounded-lg ${period === 'weekly' ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setPeriod('monthly')}
                        className={`px-3 py-1.5 text-sm rounded-lg ${period === 'monthly' ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setPeriod('alltime')}
                        className={`px-3 py-1.5 text-sm rounded-lg ${period === 'alltime' ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm text-slate-400 font-mono">Loading leaderboard...</p>
                </div>
            ) : leaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Icon icon="award" className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">No Rankings Available</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                        Leaderboard rankings will appear here once traders start competing.
                    </p>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {leaders.length >= 3 && (
                        <div className="flex justify-center items-end gap-4 py-8">
                            {/* 2nd Place */}
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-700/50 border-2 border-slate-400 flex items-center justify-center text-2xl">🥈</div>
                                <div className="mt-2 font-bold text-slate-300">{leaders[1]?.username}</div>
                                <div className="text-sm text-green-400">+{leaders[1]?.returns}%</div>
                                <div className="w-24 h-20 bg-slate-700/50 rounded-t-lg mt-2"></div>
                            </div>
                            {/* 1st Place */}
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-amber-900/30 border-2 border-amber-400 flex items-center justify-center text-3xl animate-pulse">👑</div>
                                <div className="mt-2 font-bold text-amber-400">{leaders[0]?.username}</div>
                                <div className="text-sm text-green-400">+{leaders[0]?.returns}%</div>
                                <div className="w-28 h-28 bg-amber-900/30 rounded-t-lg mt-2"></div>
                            </div>
                            {/* 3rd Place */}
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-amber-950/30 border-2 border-amber-700 flex items-center justify-center text-2xl">🥉</div>
                                <div className="mt-2 font-bold text-amber-700">{leaders[2]?.username}</div>
                                <div className="text-sm text-green-400">+{leaders[2]?.returns}%</div>
                                <div className="w-24 h-16 bg-amber-950/30 rounded-t-lg mt-2"></div>
                            </div>
                        </div>
                    )}

                    {/* Full Rankings Table */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                                    <th className="text-center p-4 w-16">Rank</th>
                                    <th className="text-left p-4">Trader</th>
                                    <th className="text-right p-4">Returns</th>
                                    <th className="text-right p-4">Win Rate</th>
                                    <th className="text-right p-4">Strategies</th>
                                    <th className="text-center p-4">Tier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaders.map((leader) => (
                                    <tr key={leader.rank} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className={`p-4 text-center font-bold ${getRankStyle(leader.rank)}`}>#{leader.rank}</td>
                                        <td className="p-4 font-medium">{leader.username}</td>
                                        <td className="p-4 text-right font-mono text-green-400">+{leader.returns}%</td>
                                        <td className="p-4 text-right font-mono text-slate-300">{leader.winRate}%</td>
                                        <td className="p-4 text-right font-mono text-slate-400">{leader.strategies}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs uppercase ${getBadgeColor(leader.badge)}`}>
                                                {leader.badge}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
