import React, { useMemo } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { MarketClock } from '../lib/agent/types';

interface MarketClocksViewProps {
    clocks: MarketClock[];
    onClockClick: (clock: MarketClock) => void;
    onPinClock: (clock: MarketClock) => void;
}

export const MarketClocksView: React.FC<MarketClocksViewProps> = ({ clocks, onClockClick, onPinClock }) => {

    // Group clocks by category
    const groupedClocks = useMemo(() => {
        const groups: Record<string, MarketClock[]> = {
            'FINANCIAL': [],
            'MARKETS': [],
            'SENTIMENT': [],
            'SECTOR': [],
            'NEWS': [],
            'OTHER': []
        };

        clocks.forEach(clock => {
            const cat = clock.category || 'OTHER';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(clock);
        });

        // Filter out empty groups
        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }, [clocks]);

    return (
        <div className="flex-1 p-6 space-y-8 pb-32">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icon icon="clock" className="text-cyan-500 w-6 h-6" />
                        MARKET CLOCKS
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Real-time systemic risk and opportunity analysis</p>
                </div>
                <div className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-cyan-400 border border-cyan-900">
                    FEED_RATING: 98.4%
                </div>
            </div>

            {groupedClocks.map(([category, categoryClocks]) => (
                <div key={category} className="space-y-4 animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
                        {category}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryClocks.map(clock => (
                            <div
                                key={clock.code}
                                onClick={() => onClockClick(clock)}
                                className="group bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]
                                            ${clock.status === 'green' ? 'bg-emerald-500 text-emerald-500' :
                                                clock.status === 'red' ? 'bg-red-500 text-red-500' :
                                                    clock.status === 'yellow' ? 'bg-amber-500 text-amber-500' : 'bg-slate-600 text-slate-600'}
                                        `} />
                                        <span className="font-bold text-slate-200 text-sm">{clock.label}</span>
                                    </div>
                                    <Icon icon="activity" className="text-slate-700 w-4 h-4 group-hover:text-cyan-500 transition-colors" />
                                </div>

                                <p className="text-xs text-slate-400 font-mono mb-3 line-clamp-2 min-h-[2.5em]">
                                    {clock.reason || "Awaiting signal processing..."}
                                </p>

                                <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono border-t border-slate-800/50 pt-3">
                                    <span>ID: {clock.code.split('_')[1] || clock.code}</span>
                                    <span suppressHydrationWarning>{clock.lastUpdated ? new Date(clock.lastUpdated).toLocaleTimeString() : 'WAITING'}</span>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
