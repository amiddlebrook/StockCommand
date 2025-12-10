
import React from 'react';
import { MarketClock } from '../lib/agent/types';
import { GlassButton } from './ui/GlassButton';
import { Icon } from './Icon';
import { useJobContext } from '../contexts/JobContext';

interface ResearchHistoryEntry {
    content: string;
    timestamp: number;
    status?: string;
}

interface EntityDetailViewProps {
    entity: MarketClock | null; // Reusing MarketClock as the base entity type for now
    onBack: () => void;
    onRunAnalysis: (entity: MarketClock) => void;
    researchContent?: string | null;
    freshnessThreshold: number;
    isScanning?: boolean;
    researchHistory?: ResearchHistoryEntry[];
    onViewHistory?: () => void;
}

export const EntityDetailView: React.FC<EntityDetailViewProps> = ({ entity, onBack, onRunAnalysis, researchContent, freshnessThreshold, isScanning, researchHistory, onViewHistory }) => {
    const { confirmAction } = useJobContext();

    if (!entity) return <div className="p-8 text-center text-gray-500">No entity selected</div>;

    const isStale = !entity.lastUpdated || (Date.now() - entity.lastUpdated > freshnessThreshold);

    const handleRefresh = () => {
        confirmAction(
            `Analyze ${entity.label}?`,
            "This will dispatch a specialized agent to gather fresh intelligence.",
            async () => {
                onRunAnalysis(entity);
            }
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-800/20">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                                <Icon icon="chevron-down" className="w-5 h-5 rotate-90" />
                            </button>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{entity.label}</h2>
                        </div>
                        <div className="flex items-center gap-2 pl-8">
                            <span className="text-xs font-mono text-gray-500">{entity.code}</span>
                            <span className="text-gray-600">•</span>
                            <span className={`text-xs ${isStale ? 'text-gray-500' : 'text-emerald-400'}`}>
                                {isStale ? 'Data Stale' : 'Live Data'}
                            </span>
                        </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full shadow-lg ${isStale ? 'bg-slate-600' : (entity.status === 'green' ? 'bg-emerald-500' : entity.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500')}`} />
                </div>

                <div className="flex gap-3 pl-8">
                    <GlassButton size="sm" variant="primary" onClick={handleRefresh}>
                        <div className="flex items-center gap-2">
                            <Icon icon="bot" className="w-4 h-4" />
                            RUN DEEP ANALYSIS
                        </div>
                    </GlassButton>
                    <GlassButton size="sm" variant="glass" onClick={onViewHistory} disabled={!researchHistory || researchHistory.length === 0}>
                        <div className="flex items-center gap-2">
                            <Icon icon="file-text" className="w-4 h-4" />
                            VIEW HISTORY {researchHistory && researchHistory.length > 0 && `(${researchHistory.length})`}
                        </div>
                    </GlassButton>
                </div>
            </div>

            {/* Content Scroll */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">

                {/* Status Section */}
                <div className="bg-slate-800/40 rounded-lg p-5 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Current Status</h3>
                    <p className="text-lg text-gray-200 leading-relaxed">
                        {entity.reason || "No status data available."}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center text-xs text-gray-500 font-mono">
                        <span>Last Updated: {entity.lastUpdated ? new Date(entity.lastUpdated).toLocaleString() : 'Never'}</span>
                    </div>
                </div>

                {/* Agent Active indicator - shows whenever scanning this ticker */}
                {isScanning && (
                    <div className="bg-slate-900/50 rounded-lg p-12 border border-cyan-500/30 flex flex-col items-center justify-center gap-4 animate-pulse mb-4">
                        <div className="flex items-center gap-3 bg-slate-900/90 px-6 py-3 rounded-full border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Icon icon="cpu" className="w-5 h-5 text-cyan-400 animate-spin" />
                            <span className="text-sm font-mono text-cyan-300 tracking-wider font-bold uppercase">Agent Active</span>
                        </div>
                        <p className="text-xs text-gray-500 max-w-xs text-center">Gathering intelligence and analyzing market conditions...</p>
                    </div>
                )}

                {/* Research Content or Placeholder */}
                {researchContent ? (
                    <div className="bg-slate-800/40 rounded-lg p-5 border border-slate-700/50 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-indigo-500/20 rounded">
                                <Icon icon="bot" className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">Agent Research</h3>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none alpha-channel">
                            <pre className="whitespace-pre-wrap font-sans text-gray-300">{researchContent}</pre>
                        </div>
                    </div>
                ) : !isScanning && (
                    <div className="bg-slate-800/20 rounded-lg p-8 border border-slate-800 border-dashed flex flex-col items-center justify-center text-gray-600 gap-3">
                        <Icon icon="bot" className="w-8 h-8 opacity-20" />
                        <span className="text-sm font-medium uppercase tracking-wider">Awaiting Intelligence Probe...</span>
                        <p className="text-xs max-w-xs text-center">Click 'RUN DEEP ANALYSIS' to dispatch a specialized agent to this target.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
