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
        <div className="p-4 bg-[#0D0D0D] h-full">
            <div className="mb-4">
                <label htmlFor="stock-symbol" className="text-sm font-medium text-gray-400 block mb-2">
                    Add Stock Symbol
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="stock-symbol"
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                        placeholder="e.g., GME"
                        disabled={isLoading}
                        className="w-full bg-black border border-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                    />
                    <button 
                        onClick={handleAddSymbol} 
                        disabled={isLoading || !symbolInput.trim()}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 whitespace-nowrap disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 block mb-2">Ticker List</h3>
                <div className="flex flex-wrap gap-2 min-h-[28px]">
                    {symbolList.length === 0 ? (
                        <p className="text-xs text-gray-600 italic px-1 py-1">No tickers added yet.</p>
                    ) : (
                        symbolList.map(symbol => (
                            <div 
                                key={symbol} 
                                className={`flex items-center gap-1.5 pl-3 pr-1 py-1 text-sm border cursor-pointer transition-colors ${
                                    activeSymbol === symbol 
                                    ? 'bg-cyan-800 border-cyan-600 text-white' 
                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                                }`}
                                onClick={() => handleSetActiveSymbol(symbol)}
                            >
                                <span className="font-mono font-bold">{symbol}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveSymbol(symbol); }} 
                                    className="text-gray-500 hover:text-white rounded-full p-0.5"
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

            <div className="space-y-2">
                {features.map((feature) => (
                    <button
                        key={feature.name}
                        onClick={() => handleFeatureClick(feature.name)}
                        disabled={isLoading || !activeSymbol}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 bg-gray-900/50 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icon icon={feature.icon as any} className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm font-medium">{feature.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};