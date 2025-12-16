import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

interface NewsItem {
    id: string;
    headline: string;
    source: string;
    timestamp: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impactScore: number; // 0-100
    tickers: string[];
}

export const NewsSynthesisView: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'SEC' | 'MACRO' | 'EARNINGS'>('ALL');

    // Mock Data simulating an NLP pipeline output
    const [newsStream] = useState<NewsItem[]>([
        {
            id: 'n1', headline: 'Federal Reserve signaled potential rate cut in Q3 2025 citing cooling inflation data.',
            source: 'Central Bank Wire', timestamp: Date.now() - 1000 * 60 * 5,
            sentiment: 'bullish', impactScore: 92, tickers: ['SPY', 'QQQ', 'TLT']
        },
        {
            id: 'n2', headline: 'NVIDIA (NVDA) Form 4: Insider sale of 50,000 shares by Director.',
            source: 'SEC EDGAR', timestamp: Date.now() - 1000 * 60 * 12,
            sentiment: 'bearish', impactScore: 45, tickers: ['NVDA']
        },
        {
            id: 'n3', headline: 'Oil futures spike as geopolitical tensions rise in Red Sea corridor.',
            source: 'Global Energy Report', timestamp: Date.now() - 1000 * 60 * 25,
            sentiment: 'bearish', impactScore: 78, tickers: ['USO', 'XLE']
        },
        {
            id: 'n4', headline: 'Apple (AAPL) rumored to partner with OpenAI for next-gen Siri integration.',
            source: 'TechCrunch', timestamp: Date.now() - 1000 * 60 * 45,
            sentiment: 'bullish', impactScore: 88, tickers: ['AAPL']
        },
        {
            id: 'n5', headline: 'Weekly Jobless Claims come in higher than expected (245k vs 230k est).',
            source: 'Bureau of Labor Statistics', timestamp: Date.now() - 1000 * 60 * 60,
            sentiment: 'neutral', impactScore: 65, tickers: ['SPY', 'DXY']
        }
    ]);

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
                    <p className="text-slate-400 text-sm mt-1">Real-time NLP Sentiment Analysis & Filings Aggregation</p>
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

            {/* Sentiment Heatmap / Ticker Tape */}
            <div className="h-16 border-b border-slate-800 bg-black/40 flex items-center overflow-hidden whitespace-nowrap relative">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 z-20 pointer-events-none" />
                <div className="flex items-center gap-8 animate-marquee pl-4">
                    {newsStream.map((news, i) => (
                        news.tickers.map(ticker => (
                            <div key={`${news.id}-${ticker}`} className="flex items-center gap-2 font-mono text-xs">
                                <span className="font-bold text-slate-300">{ticker}</span>
                                <span className={news.sentiment === 'bullish' ? 'text-green-500' : news.sentiment === 'bearish' ? 'text-red-500' : 'text-slate-500'}>
                                    {news.sentiment === 'bullish' ? '▲' : news.sentiment === 'bearish' ? '▼' : '▬'} {Math.floor(Math.random() * 5)}%
                                </span>
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {newsStream.map(news => (
                    <div key={news.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-cyan-500/30 transition-all hover:bg-slate-900/60 group relative overflow-hidden">

                        {/* Sentiment Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${news.sentiment === 'bullish' ? 'bg-green-500' :
                                news.sentiment === 'bearish' ? 'bg-red-500' : 'bg-slate-500'
                            }`} />

                        {/* Content */}
                        <div className="flex-1 ml-2">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-cyan-500 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/50">
                                        {news.source.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {new Date(news.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase ${news.sentiment === 'bullish' ? 'text-green-500' :
                                            news.sentiment === 'bearish' ? 'text-red-500' : 'text-slate-500'
                                        }`}>
                                        {news.sentiment} IMPULSE
                                    </span>
                                    <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${news.sentiment === 'bullish' ? 'bg-green-500' : news.sentiment === 'bearish' ? 'bg-red-500' : 'bg-slate-500'}`}
                                            style={{ width: `${news.impactScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-cyan-400 transition-colors cursor-pointer">
                                {news.headline}
                            </h3>

                            <div className="flex items-center gap-2 mt-3">
                                {news.tickers.map(ticker => (
                                    <span key={ticker} className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded cursor-pointer hover:bg-slate-700 hover:text-white">
                                        ${ticker}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Analysis Action */}
                        <div className="flex flex-col justify-center border-l border-slate-800 pl-4">
                            <button className="p-2 text-slate-500 hover:text-cyan-400 transition-colors" title="Deep Analysis">
                                <Icon icon="bot" className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-white transition-colors" title="Pin Evidence">
                                <Icon icon="clock" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                <div className="py-8 text-center text-slate-500 text-xs font-mono animate-pulse">
                    Scanning global data streams...
                </div>
            </div>
        </div>
    );
};
