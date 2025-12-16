import React from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

interface FeatureDetailViewProps {
    featureName: string;
    symbols: string[];
    content: string | null;
    isLoading: boolean;
    onBack: () => void;
    onRerun: (symbols?: string[]) => void;
}

// Feature-specific configurations
export const FEATURE_CONFIG: Record<string, {
    icon: string;
    gradient: string;
    description: string;
    sections: string[];
}> = {
    'Divergence Analysis': {
        icon: 'chart',
        gradient: 'from-blue-600 to-cyan-600',
        description: 'Price vs. momentum divergences (RSI, MACD)',
        sections: ['Regular Divergences', 'Hidden Divergences', 'Signals']
    },
    'Ghost Pattern': {
        icon: 'ghost',
        gradient: 'from-purple-600 to-pink-600',
        description: 'Wyckoff Springs, Upthrusts, and liquidity patterns',
        sections: ['Pattern Detection', 'Accumulation/Distribution', 'Targets']
    },
    'Options Strategy': {
        icon: 'strategy',
        gradient: 'from-green-600 to-emerald-600',
        description: 'Optimal options strategies based on volatility regime',
        sections: ['Recommended Strategy', 'Greeks', 'Risk/Reward']
    },
    'Financial News': {
        icon: 'search',
        gradient: 'from-orange-600 to-amber-600',
        description: 'Recent catalysts and news impact analysis',
        sections: ['Headlines', 'Catalyst Analysis', 'Sentiment']
    },
    'Company Profile': {
        icon: 'search',
        gradient: 'from-slate-600 to-gray-600',
        description: 'Deep-dive fundamental analysis',
        sections: ['Business Model', 'Competitive Moat', 'Financials']
    },
    'Peer Comparison': {
        icon: 'search',
        gradient: 'from-indigo-600 to-blue-600',
        description: 'Valuation vs. competitors',
        sections: ['Valuation Multiples', 'Growth Metrics', 'Ranking']
    },
    'Sentiment Analysis': {
        icon: 'search',
        gradient: 'from-rose-600 to-red-600',
        description: 'Market sentiment from price action and flow',
        sections: ['Bullish/Bearish Score', 'Volume Analysis', 'Trend']
    },
    'Technical Indicators': {
        icon: 'search',
        gradient: 'from-teal-600 to-cyan-600',
        description: 'RSI, MACD, Bollinger Bands, Moving Averages',
        sections: ['Momentum', 'Trend', 'Volatility', 'Signal Summary']
    },
    'Earnings Analysis': {
        icon: 'upload',
        gradient: 'from-yellow-600 to-orange-600',
        description: 'EPS, revenue, guidance analysis',
        sections: ['Results vs. Estimates', 'Guidance', 'Market Reaction']
    },
    'Market Overview': {
        icon: 'chart',
        gradient: 'from-violet-600 to-purple-600',
        description: 'Macro environment and sector positioning',
        sections: ['Macro Backdrop', 'Sector Rotation', 'Positioning']
    }
};

export const FeatureDetailView: React.FC<FeatureDetailViewProps> = ({
    featureName,
    symbols,
    content,
    isLoading,
    onBack,
    onRerun
}) => {
    const config = FEATURE_CONFIG[featureName] || {
        icon: 'search',
        gradient: 'from-gray-600 to-slate-600',
        description: 'Analysis results',
        sections: ['Analysis']
    };

    const [targetInput, setTargetInput] = React.useState(symbols.join(', '));
    const isCustomMode = targetInput.trim() !== symbols.join(', ');

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header */}
            <div className={`p-6 border-b border-slate-700/50 bg-gradient-to-r ${config.gradient} bg-opacity-10`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                            <Icon icon="chevron-down" className="w-6 h-6 rotate-90" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
                                    <Icon icon={config.icon as any} className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">{featureName}</h2>
                            </div>
                            <p className="text-gray-400 text-sm">{config.description}</p>
                        </div>
                    </div>
                </div>

                {/* Symbols Input & Actions */}
                <div className="flex items-end gap-3 mt-4">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Analysis Target(s)</label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-slate-900/80 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:border-cyan-500 outline-none transition-all"
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                placeholder="Enter tickers (e.g. NVDA, TSLA)"
                            />
                            <GlassButton variant={isCustomMode ? "primary" : "glass"} size="sm" onClick={() => onRerun(targetInput.split(',').map(s => s.trim()).filter(Boolean))} disabled={isLoading}>
                                <div className="flex items-center gap-2">
                                    <Icon icon="bot" className="w-4 h-4" />
                                    {isLoading ? 'Analyzing...' : isCustomMode ? 'Run New Scan' : 'Rerun Analysis'}
                                </div>
                            </GlassButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative mb-6">
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icon icon={config.icon as any} className="w-8 h-8 text-white animate-spin" />
                            </div>
                        </div>
                        <p className="text-gray-400 text-lg">Running {featureName}...</p>
                        <p className="text-gray-600 text-sm mt-2">Analyzing {symbols.join(', ')}</p>
                    </div>
                ) : content ? (
                    <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50">
                        {/* Section headers based on feature type */}
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {config.sections.map(section => (
                                <span key={section} className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.gradient} bg-opacity-20 text-white border border-white/10`}>
                                    {section}
                                </span>
                            ))}
                        </div>

                        {/* Content display */}
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">
                            {content}
                        </pre>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${config.gradient} bg-opacity-20 flex items-center justify-center mb-4`}>
                            <Icon icon={config.icon as any} className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="text-gray-400 text-lg mb-2">No analysis data yet</p>
                        <p className="text-gray-600 text-sm mb-4">Click "Rerun Analysis" to generate insights</p>
                        <GlassButton variant="primary" onClick={() => onRerun(targetInput.split(',').map(s => s.trim()).filter(Boolean))}>
                            Start Analysis
                        </GlassButton>
                    </div>
                )}
            </div>

            {/* Quick Actions Footer */}
            {content && !isLoading && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/20 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        Analysis for {symbols.join(', ')} • {featureName}
                    </div>
                    <div className="flex gap-2">
                        <GlassButton size="sm" variant="glass">
                            <Icon icon="file-text" className="w-4 h-4 mr-1" />
                            Export
                        </GlassButton>
                        <GlassButton size="sm" variant="glass">
                            <Icon icon="history" className="w-4 h-4 mr-1" />
                            History
                        </GlassButton>
                    </div>
                </div>
            )}
        </div>
    );
};
