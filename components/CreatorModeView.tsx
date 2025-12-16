import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

type ForgeTab = 'builder' | 'deployed' | 'templates';

interface LogicBlock {
    id: string;
    type: 'TRIGGER' | 'ACTION';
    metric?: string;
    operator?: '>' | '<' | '=' | 'CROSSES';
    value?: string;
    actionType?: 'SCAN' | 'ALERT' | 'REBALANCE';
    target?: string;
}

export const CreatorModeView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ForgeTab>('builder');
    const [strategyName, setStrategyName] = useState('');
    const [logicBlocks, setLogicBlocks] = useState<LogicBlock[]>([
        { id: '1', type: 'TRIGGER', metric: 'VIX', operator: '>', value: '25' },
        { id: '2', type: 'ACTION', actionType: 'SCAN', target: 'Defensive Tech' }
    ]);

    const addBlock = (type: 'TRIGGER' | 'ACTION') => {
        setLogicBlocks([...logicBlocks, {
            id: Date.now().toString(),
            type,
            metric: 'RSI',
            operator: '<',
            value: '30',
            actionType: 'ALERT',
            target: 'Watchlist'
        }]);
    };

    const removeBlock = (id: string) => {
        setLogicBlocks(logicBlocks.filter(b => b.id !== id));
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 flex items-center gap-3">
                        <Icon icon="zap" className="text-orange-500 w-8 h-8" />
                        STRATEGY FORGE
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Architect autonomous agent behaviors</p>
                </div>
                <div className="flex gap-2">
                    <GlassButton
                        variant={activeTab === 'builder' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('builder')}
                    >
                        Builder
                    </GlassButton>
                    <GlassButton
                        variant={activeTab === 'deployed' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('deployed')}
                    >
                        Active Agents
                    </GlassButton>
                </div>
            </div>

            {/* Builder Area */}
            {activeTab === 'builder' && (
                <div className="flex-1 relative z-10 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">

                        {/* Strategy Identity */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                            <label className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 block">Strategy Designation</label>
                            <input
                                type="text"
                                value={strategyName}
                                onChange={(e) => setStrategyName(e.target.value)}
                                placeholder="e.g. VOLATILITY HUNTER MK-1"
                                className="w-full bg-transparent border-b-2 border-slate-700 text-2xl font-bold text-white focus:border-orange-500 focus:outline-none py-2 placeholder-slate-600 font-mono"
                            />
                        </div>

                        {/* Logic Chain */}
                        <div className="relative space-y-4">
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800 -z-10" />

                            {logicBlocks.map((block, index) => (
                                <div key={block.id} className="relative group">
                                    <div className={`absolute left-[-11px] top-1/2 w-4 h-4 rounded-full border-4 border-slate-950 ${block.type === 'TRIGGER' ? 'bg-blue-500' : 'bg-green-500'}`} />

                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 ml-8 hover:border-orange-500/50 transition-colors shadow-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${block.type === 'TRIGGER' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {block.type === 'TRIGGER' ? 'IF CONDITION DETECTED' : 'THEN EXECUTE ACTION'}
                                            </span>
                                            <button onClick={() => removeBlock(block.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                                                <Icon icon="x" className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            {block.type === 'TRIGGER' ? (
                                                <>
                                                    <select className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none">
                                                        <option>VIX (Volatility)</option>
                                                        <option>RSI (Momentum)</option>
                                                        <option>SPY Price</option>
                                                        <option>Portfolio Drawdown</option>
                                                    </select>
                                                    <select className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none">
                                                        <option>GREATER THAN</option>
                                                        <option>LESS THAN</option>
                                                        <option>CROSSES ABOVE</option>
                                                        <option>CROSSES BELOW</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        defaultValue={block.value}
                                                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <select className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-green-500 outline-none">
                                                        <option>RUN SCAN</option>
                                                        <option>SEND ALERT</option>
                                                        <option>REALLOCATE</option>
                                                        <option>HEDGE POSITIONS</option>
                                                    </select>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="text"
                                                            defaultValue={block.target}
                                                            placeholder="Target (e.g. Tech Sleeve)"
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-green-500 outline-none"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    {index < logicBlocks.length - 1 && (
                                        <div className="flex justify-center my-2 ml-8">
                                            <Icon icon="arrow-down" className="text-slate-600 w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4 ml-8 pt-4">
                            <button onClick={() => addBlock('TRIGGER')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-dashed border-slate-600 text-slate-400 text-sm font-bold flex items-center gap-2 transition-colors">
                                <Icon icon="plus" className="w-4 h-4" /> ADD CONDITION
                            </button>
                            <button onClick={() => addBlock('ACTION')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-dashed border-slate-600 text-slate-400 text-sm font-bold flex items-center gap-2 transition-colors">
                                <Icon icon="plus" className="w-4 h-4" /> ADD ACTION
                            </button>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <GlassButton variant="primary" size="lg" className="shadow-orange-900/20 shadow-xl">
                                <span className="mr-2">INITIALIZE AGENT</span>
                                <Icon icon="zap" className="w-4 h-4" />
                            </GlassButton>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'deployed' && (
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { name: 'SENTINEL_ALPHA', status: 'ACTIVE', type: 'Defense', triggers: 142 },
                                { name: 'MOMENTUM_SCALPER', status: 'SLEEPING', type: 'Growth', triggers: 0 },
                            ].map(agent => (
                                <div key={agent.name} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white font-mono">{agent.name}</h3>
                                            <span className="text-xs text-slate-500 font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${agent.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Class</span>
                                            <span className="text-orange-400">{agent.type}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">triggers_24h</span>
                                            <span className="text-white font-mono">{agent.triggers}</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs text-gray-500">LAST SYNC: 2m ago</span>
                                        <button className="text-orange-400 text-xs font-bold hover:text-white transition-colors">CONFIGURE &gt;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
