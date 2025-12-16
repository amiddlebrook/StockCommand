import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { MarketClock, UserStrategy } from '../lib/agent/types';

interface IntelligencePanelProps {
    clocks: MarketClock[];
    onClockClick: (clock: MarketClock) => void;
    onCloneStrategy: (strategy: UserStrategy) => void;
}

type Tab = 'REGIME' | 'LIBRARY' | 'SIGNALS';

const MOCK_COMMUNITY_STRATEGIES: UserStrategy[] = [
    {
        id: 'COMM_1',
        name: 'Hive Mind Alpha V1',
        triggers: [{ id: 't1', metric: 'VIX', operator: '>', value: 30 }],
        actions: [{ id: 'a1', type: 'REBALANCE', target: 'Defensive Tech' }],
        active: true,
        createdAt: Date.now(),
        author: 'HIVE_MIND_CORE',
        performance: 42.8
    },
    {
        id: 'COMM_2',
        name: 'Citadel HFT Logic',
        triggers: [{ id: 't2', metric: 'RSI', operator: '<', value: 20 }],
        actions: [{ id: 'a2', type: 'BUY', target: 'Growth' }],
        active: true,
        createdAt: Date.now(),
        author: 'Citadel_Alpha',
        performance: 38.5
    },
    {
        id: 'COMM_3',
        name: 'YOLO Momentum',
        triggers: [{ id: 't3', metric: 'CHANGE_PCT', operator: '>', value: 5 }],
        actions: [{ id: 'a3', type: 'BUY', target: 'Options' }],
        active: true,
        createdAt: Date.now(),
        author: 'Retail_Whale',
        performance: 12.2
    },
    {
        id: 'COMM_4',
        name: 'Earnings Momentum',
        triggers: [{ id: 't4', metric: 'EARNINGS_SURPRISE', operator: '>', value: 10 }],
        actions: [{ id: 'a4', type: 'BUY', target: 'Growth' }],
        active: true,
        createdAt: Date.now(),
        author: 'AlphaSeeker',
        performance: 28.3
    }
];

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ clocks, onClockClick, onCloneStrategy }) => {
    const [activeTab, setActiveTab] = useState<Tab>('REGIME');

    const macroClocks = clocks.filter(c => c.code.startsWith('CLOCK_'));
    const isStale = (timestamp?: number) => {
        if (!timestamp) return true;
        return (Date.now() - timestamp) > (24 * 60 * 60 * 1000);
    };

    return (
        <div className="flex flex-col h-full glass-panel hud-brackets relative overflow-hidden">
            {/* Scan Line Effect */}
            <div className="scan-overlay absolute inset-0 pointer-events-none z-0" />

            {/* Header with LIVE indicator */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-slate-700/50 bg-slate-950/80 relative z-10">
                <div className="flex items-center gap-2">
                    <Icon icon="radar" className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                    <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">INTEL</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] text-emerald-400 font-mono tracking-wider">LIVE</span>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-700/50 bg-slate-900/50 relative z-10">
                <button
                    onClick={() => setActiveTab('REGIME')}
                    className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest hover:bg-slate-800/50 transition-all ${activeTab === 'REGIME' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-500'}`}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Icon icon="activity" className="w-3 h-3" />
                        REGIME
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('LIBRARY')}
                    className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest hover:bg-slate-800/50 transition-all ${activeTab === 'LIBRARY' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5' : 'text-slate-500'}`}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Icon icon="book" className="w-3 h-3" />
                        LIBRARY
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('SIGNALS')}
                    className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest hover:bg-slate-800/50 transition-all ${activeTab === 'SIGNALS' ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5' : 'text-slate-500'}`}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Icon icon="bell" className="w-3 h-3" />
                        SIG
                    </div>
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 aegis-grid relative z-10">

                {/* REGIME TAB */}
                {activeTab === 'REGIME' && (
                    <div className="space-y-3 animate-fadeIn">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <Icon icon="globe" className="w-3 h-3 text-cyan-500" />
                                Macro Indicators
                            </span>
                            <span className="text-cyan-500/60 font-mono">{macroClocks.length} ACTIVE</span>
                        </div>
                        {macroClocks.map(clock => {
                            const stale = isStale(clock.lastUpdated);
                            return (
                                <div key={clock.code}
                                    className={`float-card glass-panel p-3 rounded-lg cursor-pointer relative group ${stale ? 'border-amber-500/30' : 'border-slate-700/30'}`}
                                    onClick={() => onClockClick(clock)}>

                                    {stale && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border border-slate-900 z-10" title="Stale Data" />
                                    )}

                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={`text-xs font-semibold ${stale ? 'text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>{clock.label}</span>
                                        <div className={`w-2.5 h-2.5 rounded-full ${stale ? 'bg-slate-700' : (clock.status === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : clock.status === 'yellow' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]')}`} />
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate font-mono">{clock.reason || '[ Monitoring... ]'}</div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* LIBRARY TAB */}
                {activeTab === 'LIBRARY' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <Icon icon="zap" className="w-3 h-3 text-purple-500" />
                                Strategy Exchange
                            </span>
                            <span className="text-purple-500/60 font-mono">{MOCK_COMMUNITY_STRATEGIES.length} AVAILABLE</span>
                        </div>

                        {MOCK_COMMUNITY_STRATEGIES.map(strategy => (
                            <div key={strategy.id} className="float-card glass-panel p-3.5 rounded-lg group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{strategy.name}</h4>
                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{strategy.author}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs mb-3">
                                    <span className={`font-mono ${strategy.performance && strategy.performance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {strategy.performance && strategy.performance > 0 ? '+' : ''}{strategy.performance}%
                                    </span>
                                    <span className="text-slate-700">|</span>
                                    <span className="text-slate-500">{strategy.triggers.length} triggers</span>
                                </div>
                                <GlassButton
                                    size="sm"
                                    variant="glass"
                                    className="w-full justify-center text-[10px] h-8 hover:bg-purple-500/10 hover:border-purple-500/50"
                                    onClick={() => onCloneStrategy(strategy)}
                                >
                                    <Icon icon="copy" className="w-3 h-3 mr-1.5" />
                                    CLONE TO FORGE
                                </GlassButton>
                            </div>
                        ))}
                    </div>
                )}

                {/* SIGNALS TAB */}
                {activeTab === 'SIGNALS' && (
                    <div className="animate-fadeIn">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex items-center gap-2">
                            <Icon icon="bell" className="w-3 h-3 text-amber-500" />
                            Live Alerts
                        </div>
                        <div className="glass-panel p-6 rounded-lg text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
                                <Icon icon="bell-off" className="w-6 h-6 text-slate-600" />
                            </div>
                            <p className="text-xs text-slate-500">No active signals</p>
                            <p className="text-[10px] text-slate-600 mt-1">Alerts from your strategies will appear here</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
