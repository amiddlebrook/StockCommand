import React from 'react';
import { MarketClock } from '../lib/agent/types';
import { Icon } from './Icon';

interface MarketClocksViewProps {
    clocks: MarketClock[];
    onClockClick: (clock: MarketClock) => void;
}

export const MarketClocksView: React.FC<MarketClocksViewProps> = ({ clocks, onClockClick }) => {
    // Only show Clock-prefixed items (Macro)
    const macroClocks = clocks.filter(c => c.code.startsWith('CLOCK_'));

    const getStatusColor = (status: 'green' | 'yellow' | 'red' | 'gray') => {
        switch (status) {
            case 'green': return 'text-emerald-500 shadow-emerald-500/50';
            case 'yellow': return 'text-amber-500 shadow-amber-500/50';
            case 'red': return 'text-red-500 shadow-red-500/50';
            default: return 'text-slate-500 shadow-slate-500/50';
        }
    };

    const getBgGlow = (status: 'green' | 'yellow' | 'red' | 'gray') => {
        switch (status) {
            case 'green': return 'from-emerald-500/10 via-emerald-500/5';
            case 'yellow': return 'from-amber-500/10 via-amber-500/5';
            case 'red': return 'from-red-900/20 via-red-900/10';
            default: return 'from-slate-800/20 via-slate-800/10';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fadeIn pb-32 relative">
            {/* Ambient Background Noise/Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

            <div className="mb-8 relative z-10">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500 mb-2 tracking-tight">SYSTEM STATE</h1>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">Primary Neural Junctions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {macroClocks.map(clock => (
                    <div
                        key={clock.code}
                        onClick={() => onClockClick(clock)}
                        className={`
                            relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md 
                            cursor-pointer group transition-all duration-500
                            hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1
                        `}
                    >
                        {/* Dynamic Background Glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getBgGlow(clock.status)} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                        {/* Status Line - The "Nerve" */}
                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${clock.status === 'red' ? 'from-red-500 to-transparent' : clock.status === 'green' ? 'from-emerald-500 to-transparent' : 'from-amber-500 to-transparent'} opacity-50 group-hover:opacity-100 transition-opacity`} />

                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-1 rounded mb-2 inline-block border border-slate-800">
                                        {clock.code.replace('CLOCK_', '').replace(/_/g, ' ')}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors">{clock.label}</h3>
                                </div>

                                {/* Pulse Indicator */}
                                <div className="relative">
                                    <div className={`w-3 h-3 rounded-full ${clock.status === 'green' ? 'bg-emerald-500' : clock.status === 'red' ? 'bg-red-500' : 'bg-amber-500'} shadow-[0_0_20px_currentColor]`} />
                                    <div className={`absolute inset-0 w-3 h-3 rounded-full ${clock.status === 'green' ? 'bg-emerald-500' : clock.status === 'red' ? 'bg-red-500' : 'bg-amber-500'} animate-ping opacity-75`} />
                                </div>
                            </div>

                            <div className="min-h-[4rem] mb-4">
                                <p className={`text-sm leading-relaxed ${clock.reason ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 italic'} transition-colors duration-300 line-clamp-3`}>
                                    {clock.reason || 'Data stream inactive. Initiate scan to establish liquidity baseline.'}
                                </p>
                            </div>

                            {/* Abstract Data Viz Line */}
                            <div className="h-8 w-full flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-full rounded-t-sm transition-all duration-300 ${clock.status === 'green' ? 'bg-emerald-500/20 group-hover:bg-emerald-500/50' : clock.status === 'red' ? 'bg-red-500/20 group-hover:bg-red-500/50' : 'bg-amber-500/20 group-hover:bg-amber-500/50'}`}
                                        style={{ height: `${Math.random() * 100}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
