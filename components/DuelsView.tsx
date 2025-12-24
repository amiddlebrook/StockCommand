import React, { useState } from 'react';
import { Icon } from './Icon';

interface Duel {
    id: number;
    opponent: string;
    stake: number;
    duration: string;
    yourReturn: number;
    theirReturn: number;
    status: 'winning' | 'losing';
}

interface Challenge {
    id: number;
    challenger: string;
    stake: number;
    duration: string;
    winRate: number;
    strategies: number;
}

export const DuelsView: React.FC = () => {
    // In future, will come from API
    const [activeDuels] = useState<Duel[]>([]);
    const [openChallenges] = useState<Challenge[]>([]);

    const noDuels = activeDuels.length === 0 && openChallenges.length === 0;

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

            {noDuels ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Icon icon="zap" className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">No Active Duels</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                        Challenge other traders to head-to-head performance competitions.
                    </p>
                </div>
            ) : (
                <>
                    {/* Placeholder for content when implemented */}
                </>
            )}
        </div>
    );
};
