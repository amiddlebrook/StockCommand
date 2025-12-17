import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { GlassButton } from '../ui/GlassButton';

interface Competition {
    id: string;
    title: string;
    description: string;
    startDate: number;
    endDate: number;
    status: string;
    prizePool: string;
    entryFee: number;
    participantsCount: number;
}

export const CompetitionsList: React.FC = () => {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/social/competitions')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCompetitions(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleJoin = async (id: string) => {
        try {
            const res = await fetch(`/api/social/competitions/${id}/join`, { method: 'POST' });
            if (res.ok) {
                alert('Joined competition!');
                // Refresh?
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading competitions...</div>;

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Icon icon="activity" className="mr-3 text-cyan-400" /> Active Competitions
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {competitions.map(comp => (
                    <div key={comp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/30 transition-all shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-cyan-400 to-transparent w-32 h-32 rounded-bl-full" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{comp.title}</h3>
                                <div className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold uppercase border border-green-500/30">
                                    {comp.status}
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm mb-6 h-12 overflow-hidden">{comp.description}</p>

                            <div className="flex gap-4 mb-6 text-sm">
                                <div>
                                    <div className="text-slate-500 text-xs uppercase">Prize Pool</div>
                                    <div className="text-yellow-400 font-mono font-bold">{comp.prizePool}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs uppercase">Entry Fee</div>
                                    <div className="text-white font-mono">{comp.entryFee === 0 ? 'FREE' : `${comp.entryFee} Credits`}</div>
                                </div>
                            </div>

                            <GlassButton onClick={() => handleJoin(comp.id)} className="w-full">
                                ENTER ARENA
                            </GlassButton>
                        </div>
                    </div>
                ))}

                {competitions.length === 0 && (
                    <div className="col-span-full border border-dashed border-slate-800 rounded-xl p-10 text-center text-slate-500">
                        No active competitions. Check back later.
                    </div>
                )}
            </div>
        </div>
    );
};
