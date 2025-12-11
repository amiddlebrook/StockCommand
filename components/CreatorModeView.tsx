import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

type CreatorTab = 'thesis' | 'sleeve' | 'portfolio';

export const CreatorModeView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CreatorTab>('thesis');

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* Header / Sub-nav */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/40 backdrop-blur shrink-0">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                    Creator Studio
                </h1>
                <div className="flex gap-2">
                    <GlassButton
                        variant={activeTab === 'thesis' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('thesis')}
                        className="flex items-center gap-2"
                    >
                        <Icon icon="file-text" className="w-4 h-4" />
                        Thesis
                    </GlassButton>
                    <GlassButton
                        variant={activeTab === 'sleeve' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('sleeve')}
                        className="flex items-center gap-2"
                    >
                        <Icon icon="layers" className="w-4 h-4" />
                        Sleeve
                    </GlassButton>
                    <GlassButton
                        variant={activeTab === 'portfolio' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('portfolio')}
                        className="flex items-center gap-2"
                    >
                        <Icon icon="briefcase" className="w-4 h-4" />
                        Portfolio
                    </GlassButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'thesis' && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Icon icon="book-open" className="text-purple-400" />
                                Define Your Thesis
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Articulate the core strategy and macroeconomic worldview that will drive your localized agent reasoning.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thesis Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., The Great Rotation 2026"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Strategic Vision</label>
                                    <textarea
                                        rows={12}
                                        placeholder="Describe your market outlook, key sectors, and rotation logic..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono text-sm leading-relaxed"
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <GlassButton variant="primary">Save Thesis</GlassButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sleeve' && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Icon icon="box" className="text-pink-400" />
                                Construct a Sleeve
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Group related assets into a thematic sleeve to be managed as a single unit within your portfolio.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sleeve Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., AI Infrastructure"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Focus Area</label>
                                        <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors">
                                            <option>Technology</option>
                                            <option>Commodities</option>
                                            <option>Crypto</option>
                                            <option>Healthcare</option>
                                            <option>Defensive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Constituents</label>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Ticker"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                                        />
                                        <GlassButton size="sm" variant="glass">Add</GlassButton>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800/50">
                                            <span className="font-mono font-bold text-cyan-400">NVDA</span>
                                            <Icon icon="x" className="w-4 h-4 text-gray-600 cursor-pointer hover:text-red-400" />
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800/50">
                                            <span className="font-mono font-bold text-cyan-400">AMD</span>
                                            <Icon icon="x" className="w-4 h-4 text-gray-600 cursor-pointer hover:text-red-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-6">
                                <GlassButton variant="primary">Create Sleeve</GlassButton>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Icon icon="pie-chart" className="text-emerald-400" />
                                Assemble Portfolio
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Combine your defined sleeves and attach a thesis to create a complete agent-managed portfolio.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Portfolio Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Total Return 2026"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Thesis</label>
                                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors">
                                            <div className="text-sm font-bold text-white">The Great Rotation 2026</div>
                                            <div className="text-xs text-gray-500 mt-1">Updated 2m ago</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Allocation Model</label>
                                        <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors">
                                            <option>Equal Weight</option>
                                            <option>Risk Parity</option>
                                            <option>Thesis Driven (Dynamic)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Include Sleeves</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {['Core Tech', 'Rotatable Tech', 'Energy', 'Precious Metals', 'Cash', 'Options'].map(s => (
                                            <div key={s} className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-slate-800 hover:bg-slate-900 cursor-pointer">
                                                <div className="w-4 h-4 rounded border border-gray-600 bg-transparent flex items-center justify-center">
                                                    {/* Checkbox mocked */}
                                                </div>
                                                <span className="text-sm text-gray-300">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <GlassButton variant="primary">Deploy Portfolio</GlassButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
