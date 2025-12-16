import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { StorageService } from '../lib/storage';
import { UserStrategy, StrategyTrigger, StrategyAction, TriggerMetric, TriggerOperator, ActionType, MarketClock } from '../lib/agent/types';
import { simulateWarGame, BattleResult } from '../lib/wargame';

type ForgeTab = 'builder' | 'deployed' | 'thesis';

interface LogicBlock {
    id: string;
    uiType: 'TRIGGER' | 'ACTION';
    // Trigger fields
    metric?: TriggerMetric;
    operator?: TriggerOperator;
    value?: string;
    // Action fields
    actionType?: ActionType;
    target?: string;
}

interface CreatorModeViewProps {
    clocks?: MarketClock[];
}

export const CreatorModeView: React.FC<CreatorModeViewProps> = ({ clocks = [] }) => {
    const [activeTab, setActiveTab] = useState<ForgeTab>('thesis');
    const [strategyName, setStrategyName] = useState('');
    const [logicBlocks, setLogicBlocks] = useState<LogicBlock[]>([
        { id: '1', uiType: 'TRIGGER', metric: 'VIX', operator: '>', value: '25' },
        { id: '2', uiType: 'ACTION', actionType: 'SCAN', target: 'Defensive Tech' }
    ]);
    const [savedStrategies, setSavedStrategies] = useState<UserStrategy[]>([]);
    const [thesis, setThesis] = useState("Market is in a structural liquidity cycle driven by central bank balance sheet expansion. \n\nFocus on:\n1. Hard Assets (Gold, Bitcoin)\n2. AI Infrastructure (Pick & Shovel)\n3. Energy Transition");

    // Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatingStrategy, setSimulatingStrategy] = useState<UserStrategy | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const loaded = StorageService.loadStrategies();
        setSavedStrategies(loaded);
    }, []);

    const addBlock = (type: 'TRIGGER' | 'ACTION') => {
        setLogicBlocks([...logicBlocks, {
            id: Date.now().toString(),
            uiType: type,
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

    const handleUpdateBlock = (id: string, updates: Partial<LogicBlock>) => {
        setLogicBlocks(logicBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const handleSaveStrategy = () => {
        if (!strategyName) {
            alert("Please name your strategy operation.");
            return;
        }

        const triggers: StrategyTrigger[] = logicBlocks
            .filter(b => b.uiType === 'TRIGGER')
            .map(b => ({
                id: b.id,
                metric: b.metric as TriggerMetric,
                operator: b.operator as TriggerOperator,
                value: parseFloat(b.value || '0')
            }));

        const actions: StrategyAction[] = logicBlocks
            .filter(b => b.uiType === 'ACTION')
            .map(b => ({
                id: b.id,
                type: b.actionType as ActionType,
                target: b.target || 'ALL'
            }));

        const newStrategy: UserStrategy = {
            id: Date.now().toString(),
            name: strategyName,
            triggers,
            actions,
            active: true,
            createdAt: Date.now()
        };

        const updated = [...savedStrategies, newStrategy];
        setSavedStrategies(updated);
        StorageService.saveStrategies(updated);
        setActiveTab('deployed');
        setStrategyName('');
        // Reset to default blocks
        setLogicBlocks([
            { id: Date.now().toString(), uiType: 'TRIGGER', metric: 'VIX', operator: '>', value: '25' },
            { id: (Date.now() + 1).toString(), uiType: 'ACTION', actionType: 'SCAN', target: 'Defensive Tech' }
        ]);
    };

    const handleDeleteStrategy = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedStrategies.filter(s => s.id !== id);
        setSavedStrategies(updated);
        StorageService.saveStrategies(updated);
    }

    const handleSaveThesis = () => {
        // Mock save - in real app would go to StorageService
        alert("Thesis updated.");
    };

    // --- SIMULATION LOGIC ---
    const handleTestStrategy = (strategy: UserStrategy) => {
        setSimulatingStrategy(strategy);
        setIsSimulating(true);
        setBattleResult(null);
        setBattleLog([]);
    };

    const runSimulation = async () => {
        if (!simulatingStrategy) return;
        setIsRunning(true);
        setBattleLog([`Initializing War Game Uplink...`, `Loading Strategy: ${simulatingStrategy.name}`]);

        await new Promise(r => setTimeout(r, 600));
        setBattleLog(prev => [...prev, `Syncing with live Market Clocks...`]);
        await new Promise(r => setTimeout(r, 600));

        const result = simulateWarGame(simulatingStrategy, clocks);

        for (const log of result.log) {
            setBattleLog(prev => [...prev, log]);
            await new Promise(r => setTimeout(r, 300));
        }

        setBattleResult(result);
        setIsRunning(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 flex items-center gap-3">
                        <Icon icon="code" className="text-orange-500 w-8 h-8" />
                        CREATOR MODE
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Design Strategies & Core Thesis</p>
                </div>
                <div className="flex gap-2">
                    <GlassButton
                        variant={activeTab === 'thesis' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('thesis')}
                    >
                        Master Thesis
                    </GlassButton>
                    <GlassButton
                        variant={activeTab === 'builder' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('builder')}
                    >
                        Strategy Builder
                    </GlassButton>
                    <GlassButton
                        variant={activeTab === 'deployed' ? 'primary' : 'glass'}
                        onClick={() => setActiveTab('deployed')}
                    >
                        Active Agents <span className="ml-2 bg-slate-800 px-1.5 rounded text-xs text-slate-400">{savedStrategies.length}</span>
                    </GlassButton>
                </div>
            </div>

            {/* Thesis Tab */}
            {activeTab === 'thesis' && (
                <div className="flex-1 relative z-10 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Icon icon="strategy" className="w-5 h-5 text-orange-400" />
                                CORE INVESTMENT THESIS (2025-2030)
                            </h2>
                            <textarea
                                value={thesis}
                                onChange={(e) => setThesis(e.target.value)}
                                className="w-full h-96 bg-slate-950 border border-slate-700 rounded-lg p-6 text-slate-300 font-mono text-sm focus:border-orange-500 focus:outline-none leading-relaxed resize-none"
                            />
                            <div className="flex justify-end mt-4">
                                <GlassButton variant="primary" onClick={handleSaveThesis}>SAVE THESIS</GlassButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    <div className={`absolute left-[-11px] top-1/2 w-4 h-4 rounded-full border-4 border-slate-950 ${block.uiType === 'TRIGGER' ? 'bg-blue-500' : 'bg-green-500'}`} />

                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 ml-8 hover:border-orange-500/50 transition-colors shadow-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${block.uiType === 'TRIGGER' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {block.uiType === 'TRIGGER' ? 'IF CONDITION DETECTED' : 'THEN EXECUTE ACTION'}
                                            </span>
                                            <button onClick={() => removeBlock(block.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                                                <Icon icon="close" className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            {block.uiType === 'TRIGGER' ? (
                                                <>
                                                    <select
                                                        value={block.metric}
                                                        onChange={(e) => handleUpdateBlock(block.id, { metric: e.target.value as TriggerMetric })}
                                                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                                    >
                                                        <option value="VIX">VIX (Volatility)</option>
                                                        <option value="RSI">RSI (Momentum)</option>
                                                        <option value="PRICE">Price</option>
                                                        <option value="DEFCON">DEFCON Level</option>
                                                        <option value="CHANGE_PCT">% Change</option>
                                                    </select>
                                                    <select
                                                        value={block.operator}
                                                        onChange={(e) => handleUpdateBlock(block.id, { operator: e.target.value as TriggerOperator })}
                                                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                                    >
                                                        <option value=">">GREATER THAN</option>
                                                        <option value="<">LESS THAN</option>
                                                        <option value="=">EQUALS</option>
                                                        <option value="CROSSES_ABOVE">CROSSES ABOVE</option>
                                                        <option value="CROSSES_BELOW">CROSSES BELOW</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={block.value}
                                                        onChange={(e) => handleUpdateBlock(block.id, { value: e.target.value })}
                                                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <select
                                                        value={block.actionType}
                                                        onChange={(e) => handleUpdateBlock(block.id, { actionType: e.target.value as ActionType })}
                                                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-green-500 outline-none"
                                                    >
                                                        <option value="SCAN">RUN SCAN</option>
                                                        <option value="ALERT">SEND ALERT</option>
                                                        <option value="REBALANCE">REALLOCATE</option>
                                                    </select>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="text"
                                                            value={block.target}
                                                            onChange={(e) => handleUpdateBlock(block.id, { target: e.target.value })}
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
                                            <Icon icon="chevron-down" className="text-slate-600 w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4 ml-8 pt-4">
                            <button onClick={() => addBlock('TRIGGER')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-dashed border-slate-600 text-slate-400 text-sm font-bold flex items-center gap-2 transition-colors">
                                <Icon icon="check" className="w-4 h-4" /> ADD CONDITION
                            </button>
                            <button onClick={() => addBlock('ACTION')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded border border-dashed border-slate-600 text-slate-400 text-sm font-bold flex items-center gap-2 transition-colors">
                                <Icon icon="check" className="w-4 h-4" /> ADD ACTION
                            </button>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <GlassButton variant="primary" size="lg" className="shadow-orange-900/20 shadow-xl" onClick={handleSaveStrategy}>
                                <span className="mr-2">INITIALIZE AGENT</span>
                                <Icon icon="bot" className="w-4 h-4" />
                            </GlassButton>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'deployed' && (
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {savedStrategies.map(agent => (
                                <div key={agent.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white font-mono">{agent.name}</h3>
                                            <span className="text-xs text-slate-500 font-mono">ID: {agent.id.substr(0, 8)}</span>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${agent.active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Triggers</span>
                                            <span className="text-orange-400">{agent.triggers.map(t => t.metric).join(', ')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Actions</span>
                                            <span className="text-white font-mono">{agent.actions.map(a => a.type).join(', ')}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteStrategy(agent.id, e)}
                                        className="absolute top-2 right-2 p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Icon icon="close" className="w-4 h-4" />
                                    </button>

                                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                                        <span className="text-xs text-gray-500">CREATED: {new Date(agent.createdAt).toLocaleDateString()}</span>
                                        <GlassButton size="sm" variant="glass" onClick={(e) => { e.stopPropagation(); handleTestStrategy(agent); }}>
                                            TEST STRATEGY
                                        </GlassButton>
                                    </div>
                                </div>
                            ))}

                            {savedStrategies.length === 0 && (
                                <div className="col-span-2 text-center py-20 border border-dashed border-slate-800 rounded-xl text-slate-500">
                                    <Icon icon="bot" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No active agents deployed.</p>
                                    <button onClick={() => setActiveTab('builder')} className="text-orange-400 mt-2 font-bold hover:underline">Create New Strategy</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SIMULATION MODAL */}
            {isSimulating && simulatingStrategy && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Icon icon="activity" className="text-cyan-500" />
                                WAR GAME SIMULATION
                            </h2>
                            <button onClick={() => setIsSimulating(false)} className="text-slate-500 hover:text-white"><Icon icon="close" /></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {!battleResult ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                        <div className="text-sm text-slate-400 mb-1">Target Strategy</div>
                                        <div className="text-xl font-bold text-white">{simulatingStrategy.name}</div>
                                        <div className="text-xs text-cyan-400 mt-2">Checking logical correlation with live market conditions...</div>
                                    </div>

                                    <div className="bg-black rounded-lg p-4 font-mono text-xs text-emerald-500 h-64 overflow-y-auto border border-slate-800 shadow-inner">
                                        {battleLog.length === 0 ? (
                                            <span className="text-slate-600 animate-pulse">Ready to initialize simulation...</span>
                                        ) : (
                                            battleLog.map((log, i) => <div key={i}>{'>'} {log}</div>)
                                        )}
                                        {isRunning && <div className="animate-pulse">{'>'} Processing...</div>}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <GlassButton variant="primary" onClick={runSimulation} disabled={isRunning}>
                                            {isRunning ? 'RUNNING...' : 'START SIMULATION'}
                                        </GlassButton>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 animate-fadeIn">
                                    <div className={`text-6xl mb-4 ${battleResult.outcome === 'VICTORY' ? 'text-emerald-500' : battleResult.outcome === 'DEFEAT' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {battleResult.outcome === 'VICTORY' ? '🏆' : battleResult.outcome === 'DEFEAT' ? '💀' : '⚖️'}
                                    </div>
                                    <h2 className={`text-4xl font-black uppercase mb-2 ${battleResult.outcome === 'VICTORY' ? 'text-emerald-500' : battleResult.outcome === 'DEFEAT' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {battleResult.outcome}
                                    </h2>
                                    <div className="text-xl font-mono text-white mb-6">
                                        PnL: <span className={battleResult.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>{battleResult.pnlPercent > 0 ? '+' : ''}{battleResult.pnlPercent}%</span>
                                        <span className="mx-4 text-slate-600">|</span>
                                        Alpha: <span className={battleResult.alpha >= 0 ? 'text-emerald-400' : 'text-red-400'}>{battleResult.alpha > 0 ? '+' : ''}{battleResult.alpha}</span>
                                    </div>
                                    <GlassButton to="#" onClick={() => setIsSimulating(false)} variant="primary" className="mx-auto">CLOSE SIMULATION</GlassButton>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
