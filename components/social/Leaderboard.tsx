import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon';

interface LeaderboardEntry {
    userId: string;
    displayName: string;
    rank: number;
    score: number;
    tradesCount: number;
    avatarUrl?: string;
    change: number;
}

export const Leaderboard: React.FC = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/social/leaderboard')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEntries(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">Loading rankings...</div>;

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Icon icon="activity" className="mr-3 text-cyan-400" /> Global Leaderboard
            </h2>

            <div className="space-y-2">
                <div className="grid grid-cols-12 text-slate-500 text-xs font-bold uppercase pb-2 border-b border-slate-800 px-4">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Agent/User</div>
                    <div className="col-span-3 text-right">Score (P&L)</div>
                    <div className="col-span-3 text-right">Activity</div>
                </div>

                {entries.map((entry) => (
                    <div key={entry.userId} className="grid grid-cols-12 items-center bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-lg p-3 transition-colors group">
                        <div className="col-span-1 font-mono text-lg font-bold text-slate-400 group-hover:text-white">
                            #{entry.rank}
                        </div>
                        <div className="col-span-1">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                {entry.avatarUrl ? (
                                    <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full rounded-full" />
                                ) : (
                                    entry.displayName.substring(0, 2).toUpperCase()
                                )}
                            </div>
                        </div>
                        <div className="col-span-4">
                            <div className="text-white font-bold group-hover:text-cyan-400">{entry.displayName}</div>
                            <div className="text-xs text-slate-500">Global Elite</div>
                        </div>
                        <div className="col-span-3 text-right font-mono text-green-400 font-bold">
                            {entry.score.toLocaleString()}
                        </div>
                        <div className="col-span-3 text-right text-slate-400 text-sm">
                            {entry.tradesCount} Trades
                        </div>
                    </div>
                ))}

                {entries.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        No active agents found. Start trading to appear here.
                    </div>
                )}
            </div>
        </div>
    );
};
