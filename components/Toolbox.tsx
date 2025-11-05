import React, { useState } from 'react';
import { Icon } from './Icon';

interface ToolboxProps {
    onAnalysisRequested: (featureType: string, symbol: string) => void;
    isLoading: boolean;
}

const features = [
    { name: 'Divergence Analysis', icon: 'chart' },
    { name: 'Ghost Pattern', icon: 'ghost' },
    { name: 'Options Strategy', icon: 'strategy' },
    { name: 'Financial News', icon: 'search' },
    { name: 'Company Profile', icon: 'search' },
    { name: 'Peer Comparison', icon: 'search' },
    { name: 'Sentiment Analysis', icon: 'search' },
    { name: 'Technical Indicators', icon: 'search' },
    { name: 'Earnings Analysis', icon: 'upload' },
    { name: 'Market Overview', icon: 'chart' },
];

export const Toolbox: React.FC<ToolboxProps> = ({ onAnalysisRequested, isLoading }) => {
    const [symbolInput, setSymbolInput] = useState('');
    const [symbolList, setSymbolList] = useState<string[]>(['TSLA', 'NVDA', 'AAPL']);
    const [activeSymbol, setActiveSymbol] = useState<string | null>('TSLA');

    const handleAddSymbol = () => {
        if (isLoading) return;
        const newSymbol = symbolInput.trim().toUpperCase();
        if (newSymbol && !symbolList.includes(newSymbol)) {
            setSymbolList(prev => [...prev, newSymbol]);
            setActiveSymbol(newSymbol);
            onAnalysisRequested('Company Profile', newSymbol);
            setSymbolInput('');
        }
    };

    const handleRemoveSymbol = (symbolToRemove: string) => {
        if (isLoading) return;
        const newList = symbolList.filter(s => s !== symbolToRemove);
        setSymbolList(newList);
        if (activeSymbol === symbolToRemove) {
            setActiveSymbol(newList.length > 0 ? newList[0] : null);
        }
    };

    const handleSetActiveSymbol = (symbol: string) => {
        if (isLoading || symbol === activeSymbol) return;
        setActiveSymbol(symbol);
        onAnalysisRequested('Company Profile', symbol);
    };

    const handleFeatureClick = (featureName: string) => {
        if (activeSymbol) {
            onAnalysisRequested(featureName, activeSymbol);
        }
    };

    return (
        <div className="p-5 h-full overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-400 mb-1 tracking-widest uppercase flex items-center gap-2">
                    <Icon icon="search" className="w-4 h-4 text-cyan-400" />
                    Analysis Tools
                </h2>
                <div className="h-0.5 w-12 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
            </div>

            <div className="mb-6">
                <label htmlFor="stock-symbol" className="text-xs font-semibold text-gray-400 block mb-2 uppercase tracking-wide">
                    Stock Symbol
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="stock-symbol"
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                        placeholder="e.g., TSLA"
                        disabled={isLoading}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 disabled:opacity-50 transition-all text-sm backdrop-blur-sm"
                    />
                    <button
                        onClick={handleAddSymbol}
                        disabled={isLoading || !symbolInput.trim()}
                        className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none text-sm"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 block mb-3 uppercase tracking-wide">Active Tickers</h3>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {symbolList.length === 0 ? (
                        <p className="text-xs text-gray-600 italic px-2 py-1.5">No tickers yet</p>
                    ) : (
                        symbolList.map(symbol => (
                            <div
                                key={symbol}
                                className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm rounded-lg border cursor-pointer transition-all ${
                                    activeSymbol === symbol
                                    ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                                    : 'bg-slate-800/30 border-slate-700/50 text-gray-300 hover:bg-slate-700/40 hover:border-slate-600/50'
                                }`}
                                onClick={() => handleSetActiveSymbol(symbol)}
                            >
                                <span className="font-mono font-bold">{symbol}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(symbol); }}
                                    className="text-gray-500 hover:text-red-400 rounded-full p-0.5 transition-colors"
                                    aria-label={`Remove ${symbol}`}
                                    disabled={isLoading}
                                >
                                    <Icon icon="close" className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-400 block mb-3 uppercase tracking-wide">Features</h3>
                {features.map((feature) => (
                    <button
                        key={feature.name}
                        onClick={() => handleFeatureClick(feature.name)}
                        disabled={isLoading || !activeSymbol}
                        className="group w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-300 bg-slate-800/20 hover:bg-slate-700/30 border border-slate-700/30 hover:border-cyan-500/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/5"
                    >
                        <Icon icon={feature.icon as any} className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                        <span className="text-sm font-medium">{feature.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};