import React from 'react';
import { MarketClock } from '../lib/agent/types';

interface MarketClocksViewProps {
    clocks: MarketClock[];
    onClockClick: (clock: MarketClock) => void;
}

export const MarketClocksView: React.FC<MarketClocksViewProps> = ({ clocks, onClockClick }) => {
    // Only show Clock-prefixed items (Macro)
    const macroClocks = clocks.filter(c => c.code.startsWith('CLOCK_'));

    const getStatusColor = (status: 'green' | 'yellow' | 'red' | 'gray') => {
        switch (status) {
            case 'green': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
            case 'yellow': return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            case 'red': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            default: return 'bg-slate-600';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fadeIn pb-32">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Market Regime Clocks</h1>
                <p className="text-gray-400 text-sm md:text-base">High-level macro indicators driving the broader market.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {macroClocks.map(clock => (
                    <div
                        key={clock.code}
                        onClick={() => onClockClick(clock)}
                        className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-5 cursor-pointer transition-all hover:border-cyan-500/50 hover:bg-slate-800/80 group shadow-lg relative overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{clock.code.replace('CLOCK_', '').replace(/_/g, ' ')}</span>
                                <h3 className="text-xl font-bold text-gray-100 group-hover:text-cyan-400 transition-colors">{clock.label}</h3>
                            </div>
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(clock.status)} ring-1 ring-white/10`} />
                        </div>

                        <div className="relative z-10">
                            <div className={`text-sm leading-relaxed ${clock.reason ? 'text-gray-400' : 'text-gray-600 italic'}`}>
                                {clock.reason || 'No analysis data available. Run a scan on this clock to populate live market intelligence.'}
                            </div>

                            {/* Call to Action Hint */}
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-cyan-500/50 group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
                                <span>View Analysis</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
