import React, { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { MarketClock } from '../lib/agent/types';
import { UNIVERSE } from '../lib/agent/universe';
import { getClocksForEntity } from '../lib/clockData';

interface MarketClocksViewProps {
    clocks: MarketClock[];
    onClockClick: (clock: MarketClock) => void;
    onPinClock: (clock: MarketClock) => void;
}

export const MarketClocksView: React.FC<MarketClocksViewProps> = ({ clocks, onClockClick, onPinClock }) => {

    // Group clocks by category - EXCLUDE ticker-specific clocks (those with tickerSymbol)
    const groupedClocks = useMemo(() => {
        const groups: Record<string, MarketClock[]> = {
            'FINANCIAL': [],
            'MARKETS': [],
            'SENTIMENT': [],
            'SECTOR': [],
            'NEWS': [],
            'MACRO': [],
            'OTHER': []
        };

        clocks.forEach(clock => {
            // Skip clocks that belong to a specific ticker - they're shown under ticker dropdowns
            if (clock.tickerSymbol) return;

            // Skip TICKER category clocks entirely from global view
            if (clock.category === 'TICKER') return;

            const cat = clock.category || 'OTHER';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(clock);
        });

        // Filter out empty groups
        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }, [clocks]);

    // Ticker Logic
    const [expandedTickers, setExpandedTickers] = useState<Set<string>>(new Set());

    const toggleTicker = (symbol: string) => {
        const newSet = new Set(expandedTickers);
        if (newSet.has(symbol)) newSet.delete(symbol);
        else newSet.add(symbol);
        setExpandedTickers(newSet);
    };

    return (
        <div className="flex-1 p-6 space-y-4 pb-32">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icon icon="clock" className="text-cyan-500 w-6 h-6" />
                        MARKET CLOCKS
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Hierarchical systemic risk analysis</p>
                </div>
                <div className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-cyan-400 border border-cyan-900">
                    SYSTEM_SYNC: ACTIVE
                </div>
            </div>

            {/* 1. TICKER CLOCKS SECTION */}
            <details className="group border border-slate-800 bg-slate-900/20 rounded-xl overflow-hidden" open>
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors list-none select-none">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Icon icon="chevron-down" className="w-4 h-4 transition-transform group-open:rotate-180" />
                        ACTIVE TICKER MONITORS
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">{UNIVERSE.length} TRACKED</span>
                </summary>

                <div className="p-4 border-t border-slate-800/50 space-y-2">
                    {UNIVERSE.map(ticker => {
                        const isExpanded = expandedTickers.has(ticker.symbol);
                        const subClocks = isExpanded ? getClocksForEntity('TICKER', ticker.symbol) : [];

                        return (
                            <div key={ticker.symbol} className="border border-slate-800/50 bg-slate-950/50 rounded-lg overflow-hidden">
                                <div
                                    onClick={() => toggleTicker(ticker.symbol)}
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-700'}`}></div>
                                        <span className="font-bold text-white font-mono">{ticker.symbol}</span>
                                        <span className="text-xs text-slate-500 ml-2">{ticker.role}</span>
                                    </div>
                                    <Icon icon="chevron-down" className={`w-3 h-3 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Sub-clocks Grid for Ticker */}
                                {isExpanded && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-black/20 border-t border-slate-800/50 animate-fadeIn">
                                        {subClocks.map(clock => (
                                            <div key={clock.code} className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col gap-1 hover:border-cyan-900 transition-colors cursor-pointer" onClick={() => onClockClick(clock)}>
                                                <span className="text-[10px] text-slate-500 uppercase">{clock.label}</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-white">{clock.reason || "Neutral"}</span>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${clock.status === 'green' ? 'bg-green-500' : clock.status === 'red' ? 'bg-red-500' : 'bg-slate-600'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </details>

            {/* 2. CATEGORY SECTIONS (MACRO, SECTOR, ETC) */}
            {groupedClocks.map(([category, categoryClocks]) => (
                <details key={category} className="group border border-slate-800 bg-slate-900/20 rounded-xl overflow-hidden" open={category === 'MARKETS' || category === 'FINANCIAL'}>
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors list-none select-none">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Icon icon="chevron-down" className="w-4 h-4 transition-transform group-open:rotate-180" />
                            {category} CLOCKS
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">{categoryClocks.length} NODES</span>
                    </summary>

                    <div className="p-4 border-t border-slate-800/50">
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
                </details>
            ))}
        </div>
    );
};
