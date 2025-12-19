import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';
import { ModelSelector } from './ModelSelector';
import { SystemHealth } from './SystemHealth';
import { CreditsService, CREDIT_COSTS } from '../lib/credits';

export const SettingsView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'GENERAL' | 'MODELS' | 'OPTIMIZER' | 'HEALTH' | 'CREDITS' | 'BILLING'>('MODELS');
    const [isPro, setIsPro] = useState(false); // Mock User State
    const [creditBalance, setCreditBalance] = useState(0);
    const [creditHistory, setCreditHistory] = useState<any[]>([]);

    // Load credits on mount
    useEffect(() => {
        const balance = CreditsService.loadBalance();
        setCreditBalance(balance.credits);
        setCreditHistory(CreditsService.getHistory(10));
    }, []);

    // Mobile Navigation State
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);

    // Mock Settings State
    const [settings, setSettings] = useState({
        appName: 'STOCK_COMMAND // V2.2',
        timezone: 'UTC-5 (EST)',
        models: {
            analysis: 'claude-3-5-sonnet',
            chat: 'gemini-1-5-flash',
            optimization: 'gpt-4o',
            reporting: 'claude-3-5-sonnet',
        },
        optimizer: {
            autoApply: false,
            budget: 50,
            maxGenerations: 100
        }
    });

    const NAV_ITEMS = [
        { id: 'GENERAL', label: 'General', icon: 'settings' },
        { id: 'MODELS', label: 'Default Models', icon: 'cpu' },
        { id: 'OPTIMIZER', label: 'Agent Optimizer', icon: 'zap' },
        { id: 'HEALTH', label: 'System Health', icon: 'activity' },
        { id: 'CREDITS', label: 'Credits & Usage', icon: 'zap' },
        { id: 'BILLING', label: 'Plan & Billing', icon: 'credit-card' },
    ];

    const handleNavClick = (id: string) => {
        setActiveSection(id as any);
        setShowMobileSidebar(false);
    };

    return (
        <div className="flex-1 h-full bg-slate-950 flex overflow-hidden relative">

            {/* 1. SIDEBAR (Responsive) */}
            <div className={`
                bg-slate-900/50 border-r border-slate-800 flex-col shrink-0 z-20 
                md:flex md:w-64
                ${showMobileSidebar ? 'flex w-full absolute inset-0 bg-slate-950 md:static md:bg-transparent' : 'hidden'}
            `}>
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Icon icon="settings" className="text-cyan-500 w-5 h-5" />
                        SETTINGS
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">System Configuration</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}
                                `}
                            >
                                <Icon icon={item.icon as any} className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                                {item.label}
                                {/* Mobile Chevron */}
                                <div className="ml-auto md:hidden">
                                    <Icon icon="chevron-right" className="w-4 h-4 text-slate-600" />
                                </div>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className={`p-4 rounded-xl border ${isPro ? 'bg-gradient-to-br from-amber-900/20 to-amber-900/5 border-amber-500/30' : 'bg-slate-900 border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Icon icon="award" className={isPro ? "text-amber-500" : "text-slate-400"} />
                            <span className={`text-xs font-bold tracking-wider ${isPro ? "text-amber-500" : "text-slate-400"}`}>
                                {isPro ? 'PRO PLAN' : 'FREE PLAN'}
                            </span>
                        </div>
                        {!isPro && (
                            <button
                                onClick={() => setIsPro(true)} // Toggle for Demo
                                className="w-full mt-2 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-xs rounded shadow-lg transition-all"
                            >
                                UPGRADE TO PRO
                            </button>
                        )}
                        {isPro && <div className="text-[10px] text-amber-500/60 mt-1 font-mono">Next billing: Dec 31</div>}
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className={`flex-1 overflow-y-auto bg-slate-950 relative md:block ${showMobileSidebar ? 'hidden' : 'block'}`}>
                <div className="max-w-5xl mx-auto p-4 md:p-8">

                    {/* Header for Section */}
                    <div className="mb-8 flex items-center gap-4">
                        {/* Mobile Back Button */}
                        <button
                            onClick={() => setShowMobileSidebar(true)}
                            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                        >
                            <Icon icon="arrow-left" className="w-5 h-5" />
                        </button>

                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">{NAV_ITEMS.find(n => n.id === activeSection)?.label}</h1>
                            <div className="h-1 w-20 bg-cyan-500 rounded-full"></div>
                        </div>
                    </div>

                    {activeSection === 'GENERAL' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Name</label>
                                    <input type="text" value={settings.appName} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
                                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200">
                                        <option>UTC-5 (EST)</option>
                                        <option>UTC-8 (PST)</option>
                                        <option>UTC (GMT)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'MODELS' && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800 mb-6">
                                <p className="text-sm text-slate-400">
                                    Configure specific AI models for different agentic tasks.
                                    <span className="text-amber-500 font-bold ml-2">Pro Plan required for advanced models.</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <ModelSelector
                                    taskName="Code Generation / Logic"
                                    description="The brain used for writing complex strategies and analyzing code structure."
                                    selectedModelId={settings.models.analysis}
                                    isLocked={!isPro}
                                    onSelect={(id) => setSettings({ ...settings, models: { ...settings.models, analysis: id } })}
                                />
                                <ModelSelector
                                    taskName="Chat & Interaction"
                                    description="The conversational model used for the main Command Center chat interface."
                                    selectedModelId={settings.models.chat}
                                    isLocked={false} // Chat is free
                                    onSelect={(id) => setSettings({ ...settings, models: { ...settings.models, chat: id } })}
                                />
                                <ModelSelector
                                    taskName="Strategy Optimizer"
                                    customIcon="zap"
                                    description="The optimization engine that iterates and backtests strategies in the background."
                                    selectedModelId={settings.models.optimization}
                                    isLocked={!isPro}
                                    onSelect={(id) => setSettings({ ...settings, models: { ...settings.models, optimization: id } })}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'OPTIMIZER' && (
                        <div className="space-y-6">
                            {!isPro ? (
                                <div className="flex flex-col items-center justify-center p-12 border border-slate-800 rounded-2xl bg-slate-900/20 text-center">
                                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                                        <Icon icon="lock" className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Pro Feature: Automated Optimization</h3>
                                    <p className="text-slate-400 max-w-md mb-6">
                                        Upgrade to Pro to enable the automated optimization engine. The agent will run thousands of backtests to improve your strategies automatically.
                                    </p>
                                    <button onClick={() => setIsPro(true)} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg shadow-lg transition-all">
                                        See Demo (Enable Pro)
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Pro Content */}
                                    <div className="p-6 bg-gradient-to-r from-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                                <Icon icon="zap" className="w-5 h-5" />
                                                OPTIMIZER ACTIVE
                                            </h3>
                                            <p className="text-sm text-emerald-500/60 mt-1">Optimization service is running in background worker.</p>
                                        </div>
                                        <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Monthly Budget Limit</label>
                                            <input type="range" min="10" max="500" value={settings.optimizer.budget} onChange={(e) => setSettings({ ...settings, optimizer: { ...settings.optimizer, budget: parseInt(e.target.value) } })} className="w-full accent-cyan-500" />
                                            <div className="flex justify-between text-xs font-mono text-cyan-400">
                                                <span>$10</span>
                                                <span className="font-bold">${settings.optimizer.budget}.00</span>
                                                <span>$500</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Max Iterations / Day</label>
                                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200">
                                                <option>50 Iterations (Slow)</option>
                                                <option>100 Iterations (Balanced)</option>
                                                <option>500 Iterations (Turbo)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'HEALTH' && (
                        <SystemHealth />
                    )}

                    {activeSection === 'CREDITS' && (
                        <div className="space-y-6">
                            {/* Credit Balance Card */}
                            <div className="p-6 bg-gradient-to-r from-amber-900/20 to-slate-900 border border-amber-500/30 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                                            <Icon icon="zap" className="w-5 h-5" />
                                            CREDIT BALANCE
                                        </h3>
                                        <p className="text-sm text-amber-500/60 mt-1">Available for API operations</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-amber-400 font-mono">{creditBalance.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500">= ${(creditBalance * 0.0001).toFixed(2)} USD (actual API costs)</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        CreditsService.addCredits(500, 'Demo Purchase');
                                        setCreditBalance(CreditsService.loadBalance().credits);
                                        setCreditHistory(CreditsService.getHistory(10));
                                    }}
                                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded transition-all"
                                >
                                    + Add 500 Credits (Demo)
                                </button>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Credit Cost Breakdown</h3>
                                <p className="text-xs text-slate-500 mb-4">1 credit = $0.0001 USD. Credits represent the actual cost of each API operation. Platform margin is applied only at purchase.</p>

                                <div className="space-y-4">
                                    {/* Data Sync */}
                                    <div>
                                        <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Data Sync Operations</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Ticker Quote</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.TICKER_QUOTE_SYNC} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Full Ticker Sync</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.TICKER_FULL_SYNC} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Clock Sync</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.MARKET_CLOCK_SYNC} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">All Clocks Refresh</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.GLOBAL_CLOCKS_REFRESH} cr</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent Operations */}
                                    <div>
                                        <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Agent Operations</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Chat Message</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.AGENT_CHAT_MESSAGE} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Ticker Scan</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.AGENT_SCAN_TICKER} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Sector Scan</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.AGENT_SCAN_SECTOR} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Full Market Scan</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.AGENT_SCAN_FULL} cr</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Premium */}
                                    <div>
                                        <h4 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Premium Operations</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Portfolio Report</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.PORTFOLIO_REPORT} cr</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                                                <span className="text-xs text-slate-400">Strategy Backtest</span>
                                                <span className="text-xs font-mono text-amber-400">{CREDIT_COSTS.STRATEGY_BACKTEST} cr</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Usage */}
                            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Recent Usage</h3>
                                {creditHistory.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-4">No recent transactions</p>
                                ) : (
                                    <div className="space-y-2">
                                        {creditHistory.slice(0, 5).map((txn) => (
                                            <div key={txn.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="zap" className="w-3 h-3 text-amber-400" />
                                                    <span className="text-xs text-slate-400">{txn.type.replace(/_/g, ' ')}</span>
                                                    {txn.target && <span className="text-xs text-slate-600">({txn.target})</span>}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs font-mono ${txn.amount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {txn.amount > 0 ? `-${txn.amount}` : `+${Math.abs(txn.amount)}`} cr
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'BILLING' && (
                        <div className="text-center py-20">
                            <Icon icon="credit-card" className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                            <h3 className="text-slate-500 font-bold">Billing Portal Integration</h3>
                            <p className="text-slate-600 text-sm mt-2">Connect Stripe to manage your subscription.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
