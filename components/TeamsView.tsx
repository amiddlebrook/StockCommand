import React from 'react';
import { Icon } from './Icon';

interface TeamsViewProps { }

export const TeamsView: React.FC<TeamsViewProps> = () => {
    const myTeam = {
        name: 'Alpha Collective',
        members: 8,
        rank: 12,
        totalReturns: 156.3,
        weeklyReturns: 4.2,
    };

    const mockTeamMembers = [
        { name: 'AlphaTrader99', role: 'Leader', returns: 42.5, online: true },
        { name: 'QuantMaster', role: 'Co-Leader', returns: 38.2, online: true },
        { name: 'ThetaGang', role: 'Member', returns: 28.1, online: false },
        { name: 'You', role: 'Member', returns: 22.4, online: true },
        { name: 'SwingTrader', role: 'Member', returns: 15.3, online: false },
    ];

    const topTeams = [
        { rank: 1, name: 'Quant Elite', members: 12, returns: 324.5 },
        { rank: 2, name: 'Deep Value Gang', members: 8, returns: 287.2 },
        { rank: 3, name: 'Momentum Masters', members: 15, returns: 256.8 },
        { rank: 4, name: 'Theta Collective', members: 10, returns: 234.1 },
        { rank: 5, name: 'Macro Hunters', members: 6, returns: 198.7 },
    ];

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="users" className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold tracking-wide">TEAMS & GUILDS</h2>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Icon icon="plus" className="w-4 h-4" />
                    Create Team
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Team */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-blue-400">{myTeam.name}</h3>
                                <p className="text-slate-400">Rank #{myTeam.rank} • {myTeam.members} members</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-green-400">+{myTeam.totalReturns}%</div>
                                <div className="text-sm text-slate-400">+{myTeam.weeklyReturns}% this week</div>
                            </div>
                        </div>

                        <h4 className="text-sm text-slate-400 uppercase tracking-wider mb-2">Team Members</h4>
                        <div className="space-y-2">
                            {mockTeamMembers.map((member, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${member.online ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                                        <span className={member.name === 'You' ? 'text-cyan-400 font-bold' : ''}>{member.name}</span>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{member.role}</span>
                                    </div>
                                    <span className="text-green-400 font-mono">+{member.returns}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Teams */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                    <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Top Teams</h3>
                    <div className="space-y-3">
                        {topTeams.map((team) => (
                            <div key={team.rank} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold ${team.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                                        #{team.rank}
                                    </span>
                                    <div>
                                        <div className="font-medium">{team.name}</div>
                                        <div className="text-xs text-slate-400">{team.members} members</div>
                                    </div>
                                </div>
                                <span className="text-green-400 font-mono text-sm">+{team.returns}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
