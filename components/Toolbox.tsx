import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { getCustomTools, deleteCustomTool, type CustomTool, getToolCategoryColor } from '../services/customToolsService';

interface ToolboxProps {
    onAnalysisRequested: (featureType: string, symbol: string) => void;
    onCreateTool?: () => void;
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

export const Toolbox: React.FC<ToolboxProps> = ({ onAnalysisRequested, onCreateTool, isLoading }) => {
    const [symbolInput, setSymbolInput] = useState('');
    const [symbolList, setSymbolList] = useState<string[]>(['TSLA', 'NVDA', 'AAPL']);
    const [activeSymbol, setActiveSymbol] = useState<string | null>('TSLA');
    const [customTools, setCustomTools] = useState<CustomTool[]>([]);

    // Load custom tools on mount
    useEffect(() => {
        setCustomTools(getCustomTools());
    }, []);

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

    const handleDeleteCustomTool = (toolId: string) => {
        deleteCustomTool(toolId);
        setCustomTools(getCustomTools());
    };

    const handleCustomToolClick = (tool: CustomTool) => {
        if (activeSymbol) {
            // Use the tool's prompt template
            onAnalysisRequested(tool.name, activeSymbol);
        }
    };

    return (
        <div className="p-4 bg-[#0D0D0D] h-full">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 tracking-wider">TOOLBOX</h2>
            
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

            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Built-in Tools</h3>
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

            <div className="border-t border-gray-800 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Custom Tools</h3>
                    {onCreateTool && (
                        <button
                            onClick={onCreateTool}
                            disabled={isLoading}
                            className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + New Tool
                        </button>
                    )}
                </div>

                {customTools.length === 0 ? (
                    <p className="text-xs text-gray-600 italic px-1 py-2">
                        No custom tools yet. Click "+ New Tool" to create one!
                    </p>
                ) : (
                    <div className="space-y-2">
                        {customTools.map((tool) => (
                            <div
                                key={tool.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-300 bg-gradient-to-r from-purple-900/20 to-pink-900/20 hover:from-purple-800/30 hover:to-pink-800/30 border border-purple-700/30 hover:border-purple-600/50 transition-colors group"
                            >
                                <button
                                    onClick={() => handleCustomToolClick(tool)}
                                    disabled={isLoading || !activeSymbol}
                                    className="flex-1 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Icon icon="tool" className={`w-4 h-4 ${getToolCategoryColor(tool.category)}`} />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{tool.name}</div>
                                        <div className="text-xs text-gray-500">{tool.description}</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDeleteCustomTool(tool.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-all"
                                    aria-label={`Delete ${tool.name}`}
                                >
                                    <Icon icon="close" className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};