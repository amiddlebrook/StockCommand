import React, { useState } from 'react';
import { MarketClock } from '../lib/agent/types';
import { Icon } from './Icon';

interface MarketClocksViewProps {
    clocks: MarketClock[];
    onClockClick: (clock: MarketClock) => void;
}

export const MarketClocksView: React.FC<MarketClocksViewProps> = ({ clocks, onClockClick }) => {
    const [filter, setFilter] = useState('');

    // Group clocks? Or just list them? 
    // List specific macro clocks first, then tickers.
    const macroClocks = clocks.filter(c => c.code.startsWith('CLOCK_'));
    const tickerClocks = clocks.filter(c => !c.code.startsWith('CLOCK_'));

    const getStatusColor = (status: 'green' | 'yellow' | 'red' | 'gray') => {
        switch (status) {
            case 'green': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
            case 'yellow': return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            case 'red': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            default: return 'bg-slate-600';
        }
    };

    const filteredTickerClocks = tickerClocks.filter(c =>
        c.label.toLowerCase().includes(filter.toLowerCase()) ||
        c.code.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto p-8 animate-fadeIn">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Market Clocks</h1>
                    <p className="text-gray-400">Real-time regime indicators for the entire market universe.</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filter clocks..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* MACRO SECTION */}
            <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-800 pb-2">Macro Regimes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {macroClocks.map(clock => (
                    <div
                        key={clock.code}
                        onClick={() => onClockClick(clock)}
                        className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-xl group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold text-gray-500 group-hover:text-cyan-400 transition-colors">{clock.code}</span>
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(clock.status)}`} />
                        </div>
                        <div className="font-bold text-lg leading-tight mb-1">{clock.label}</div>
                        <div className="text-xs text-gray-400 truncate">{clock.reason || 'No data'}</div>
                    </div>
                ))}
            </div>

            {/* TICKER SECTION */}
            <h2 className="text-xl font-bold text-purple-400 mb-4 border-b border-slate-800 pb-2">Ticker Indicators</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTickerClocks.map(clock => (
                    <div
                        key={clock.code}
                        onClick={() => onClockClick(clock)}
                        className="bg-slate-800/30 hover:bg-slate-700/30 border border-slate-800 rounded-lg p-3 cursor-pointer transition-all hover:border-purple-500/30"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(clock.status)}`} />
                            <span className="font-bold text-sm">{clock.label}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 line-clamp-2">{clock.reason}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
