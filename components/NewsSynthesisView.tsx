import React, { useState } from 'react';
import { Icon } from './Icon';

interface NewsItem {
    id: string;
    headline: string;
    source: string;
    timestamp: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impactScore: number;
    tickers: string[];
}

interface NewsSynthesisViewProps {
    // News data comes from agent analysis, passed via props
    newsItems?: NewsItem[];
    isAgentScanning?: boolean;
}

export const NewsSynthesisView: React.FC<NewsSynthesisViewProps> = ({
    newsItems = [],
    isAgentScanning = false
}) => {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'SEC' | 'MACRO' | 'EARNINGS'>('ALL');

    // Filter news based on active filter (in future, use category field)
    const filteredNews = newsItems;

    return (
        <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icon icon="activity" className="text-cyan-500 w-6 h-6" />
                        INTELLIGENCE STREAM
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">AI-synthesized market intelligence</p>
                </div>
                <div className="flex gap-2">
                    {['ALL', 'SEC', 'MACRO', 'EARNINGS'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter as any)}
                            className={`
                                px-3 py-1 text-xs font-bold font-mono rounded border transition-colors
                                ${activeFilter === filter
                                    ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}
                            `}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 z-10">
                {isAgentScanning ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm text-cyan-400 font-mono">Agent synthesizing intelligence...</p>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Icon icon="activity" className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">No Intelligence Yet</h3>
                        <p className="text-sm text-slate-500 max-w-md">
                            Add tickers to your watchlist and run analysis to generate AI-powered market intelligence.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredNews.map(item => (
                            <div
                                key={item.id}
                                className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium mb-2">{item.headline}</h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>{item.source}</span>
                                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${item.sentiment === 'bullish' ? 'bg-green-900/30 text-green-400' :
                                            item.sentiment === 'bearish' ? 'bg-red-900/30 text-red-400' :
                                                'bg-slate-800 text-slate-400'
                                        }`}>
                                        {item.sentiment.toUpperCase()}
                                    </div>
                                </div>
                                {item.tickers.length > 0 && (
                                    <div className="flex gap-2 mt-3">
                                        {item.tickers.map(ticker => (
                                            <span key={ticker} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-cyan-400 font-mono">
                                                ${ticker}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
