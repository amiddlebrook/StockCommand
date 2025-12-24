import React, { useState } from 'react';
import { Icon } from './Icon';

interface TeamMember {
    name: string;
    role: 'Leader' | 'Co-Leader' | 'Member';
    returns: number;
    online: boolean;
}

interface Team {
    name: string;
    members: number;
    rank: number;
    totalReturns: number;
    weeklyReturns: number;
    memberList?: TeamMember[];
}

export const TeamsView: React.FC = () => {
    // In future, will come from API
    const [myTeam] = useState<Team | null>(null);
    const [topTeams] = useState<Team[]>([]);

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
                    {myTeam ? (
                        <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
                            {/* Team Details */}
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-lg text-center">
                            <Icon icon="users" className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-400 mb-2">Not in a Team</h3>
                            <p className="text-sm text-slate-500 mb-4">Join or create a team to compete together</p>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                                Browse Teams
                            </button>
                        </div>
                    )}
                </div>

                {/* Top Teams */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                    <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Top Teams</h3>
                    {topTeams.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-slate-500">No team rankings available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Top Teams List */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
