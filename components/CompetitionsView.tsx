import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

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

// Mock data for competitions
const MOCK_COMPETITIONS: Competition[] = [
    { id: '1', name: 'Q1 2025 Alpha Challenge', type: 'public', participants: 1247, startDate: '2025-01-01', endDate: '2025-03-31', status: 'upcoming', prize: '$10,000' },
    { id: '2', name: 'Tech Sector Showdown', type: 'public', participants: 823, startDate: '2024-12-01', endDate: '2024-12-31', status: 'active', prize: '$5,000' },
    { id: '3', name: 'Private League: Hedgies', type: 'private', participants: 24, startDate: '2024-11-01', endDate: '2025-02-28', status: 'active' },
    { id: '4', name: 'Macro Masters Cup', type: 'public', participants: 2156, startDate: '2024-10-01', endDate: '2024-12-15', status: 'active', prize: '$15,000' },
];

interface CompetitionsViewProps {
    onSubmitPortfolio: () => void;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ onSubmitPortfolio }) => {
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

    const filteredCompetitions = MOCK_COMPETITIONS.filter(comp => {
        if (filter !== 'all' && comp.type !== filter) return false;
        if (statusFilter !== 'all' && comp.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-800/20">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                            🏆 Thesis Competitions
                        </h2>
                        <p className="text-gray-400 text-sm">Submit your portfolio strategy and compete with others</p>
                    </div>
                    <GlassButton variant="primary" onClick={onSubmitPortfolio}>
                        <div className="flex items-center gap-2">
                            <Icon icon="upload" className="w-4 h-4" />
                            Submit Portfolio
                        </div>
                    </GlassButton>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">Type:</span>
                        <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                            {['all', 'public', 'private'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${filter === f ? 'bg-slate-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">Status:</span>
                        <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                            {['all', 'active', 'upcoming', 'completed'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s as any)}
                                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${statusFilter === s ? 'bg-slate-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Competitions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {filteredCompetitions.map(comp => (
                    <div
                        key={comp.id}
                        className={`bg-slate-800/40 rounded-lg p-5 border transition-all hover:border-purple-500/50 cursor-pointer ${comp.status === 'active' ? 'border-green-500/30' :
                                comp.status === 'upcoming' ? 'border-yellow-500/30' : 'border-slate-700/50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-white">{comp.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${comp.type === 'public' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                        }`}>
                                        {comp.type.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {comp.startDate} → {comp.endDate}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${comp.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                        comp.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {comp.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">
                                    <span className="text-white font-bold">{comp.participants.toLocaleString()}</span> participants
                                </span>
                                {comp.prize && (
                                    <span className="text-emerald-400 font-bold">
                                        💰 {comp.prize}
                                    </span>
                                )}
                            </div>
                            <GlassButton size="sm" variant="glass">
                                {comp.status === 'active' ? 'Join Now' : comp.status === 'upcoming' ? 'Register' : 'View Results'}
                            </GlassButton>
                        </div>
                    </div>
                ))}

                {filteredCompetitions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Icon icon="trophy" className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No competitions match your filters</p>
                    </div>
                )}
            </div>

            {/* Create Competition CTA */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
                <button className="w-full py-3 border border-dashed border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors text-sm font-medium">
                    + Create Private Competition
                </button>
            </div>
        </div>
    );
};
