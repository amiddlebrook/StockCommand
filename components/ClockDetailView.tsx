import React from 'react';
import { MarketClock } from '../lib/agent/types';
import { GlassButton } from './ui/GlassButton';
import { Icon } from './Icon';
import { useJobContext } from '../contexts/JobContext';

interface ClockDetailViewProps {
    clock: MarketClock | null;
    onBack: () => void;
}

export const ClockDetailView: React.FC<ClockDetailViewProps> = ({ clock, onBack }) => {
    const { confirmAction } = useJobContext();

    if (!clock) return <div className="p-8 text-center text-gray-500">No clock selected</div>;

    const handleRefresh = () => {
        confirmAction(
            `Refresh ${clock.label}?`,
            "This will re-run the specific agent tools associated with this market clock. It may take a minute.",
            async () => {
                // In a real app, this would trigger the specific scan.
                // For now we simulate or call the generic scan endpoint if we had the function passed down.
                // We'll trust the parent to have handled the "Start" via the existing context hook if we moved logic there,
                // but here we might need to invoke the API directly or pass a handler.
                // Let's assume we use the standard API endpoint directly here for simplicity since we are in a view.

                await fetch('/api/agent/scan', {
                    method: 'POST',
                    body: JSON.stringify({ scope: 'TOOL', target: clock.code })
                });
            }
        );
    };

    const statusColor = clock.status === 'green' ? 'text-emerald-400' : clock.status === 'yellow' ? 'text-amber-400' : 'text-red-400';
    const statusBg = clock.status === 'green' ? 'bg-emerald-500/10' : clock.status === 'yellow' ? 'bg-amber-500/10' : 'bg-red-500/10';
    const statusBorder = clock.status === 'green' ? 'border-emerald-500/20' : clock.status === 'yellow' ? 'border-amber-500/20' : 'border-red-500/20';

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950/50">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-800/50">
                <GlassButton variant="ghost" size="icon" onClick={onBack}>
                    <Icon icon="chevron-down" className="w-5 h-5 rotate-90" />
                </GlassButton>
                <div>
                    <h2 className="text-2xl font-bold text-white">{clock.label}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 font-mono">{clock.code}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-gray-400">Last Updated: {clock.lastUpdated ? new Date(clock.lastUpdated).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-4xl mx-auto w-full space-y-8 overflow-y-auto custom-markdown">

                {/* Status Card */}
                <div className={`p-6 rounded-2xl border ${statusBorder} ${statusBg} flex items-start gap-4`}>
                    <div className={`mt-1 w-3 h-3 rounded-full ${clock.status === 'green' ? 'bg-emerald-500' : clock.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'} shadow w-shrink-0`} />
                    <div>
                        <h3 className={`text-lg font-bold ${statusColor} mb-2`}>
                            Current Status: {clock.status.toUpperCase()}
                        </h3>
                        <p className="text-gray-200 leading-relaxed text-sm md:text-base">
                            {clock.reason || "No detailed analysis available."}
                        </p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex gap-4">
                    <GlassButton variant="primary" onClick={handleRefresh} icon={<Icon icon="bot" className="w-4 h-4" />}>
                        Run Deep Analysis
                    </GlassButton>
                    <GlassButton variant="glass" icon={<Icon icon="chart" className="w-4 h-4" />}>
                        View Historical Trend
                    </GlassButton>
                </div>

                {/* Dummy Historical Chart Placeholder */}
                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Regime History (30 Days)</h4>
                    <div className="h-48 flex items-end justify-between gap-1 px-2">
                        {/* Random bars */}
                        {[...Array(30)].map((_, i) => {
                            const h = Math.random() * 80 + 20;
                            return (
                                <div key={i} className="w-full bg-slate-700/50 hover:bg-cyan-500/50 transition-colors rounded-t-sm" style={{ height: `${h}%` }} />
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
