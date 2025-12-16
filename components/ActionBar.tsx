import React from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

interface ActionBarProps {
    onOpenCommandPalette: () => void;
    onNavigate: (tab: string) => void;
    onRunScan: () => void;
    isScanning: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
    onOpenCommandPalette,
    onNavigate,
    onRunScan,
    isScanning
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-700/50 px-4 py-2">
            <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
                {/* Left: Quick Actions */}
                <div className="flex items-center gap-2">
                    <GlassButton
                        size="sm"
                        variant="glass"
                        className="h-9 gap-2"
                        onClick={onOpenCommandPalette}
                    >
                        <Icon icon="search" className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Search</span>
                        <div className="hidden sm:flex items-center gap-0.5 ml-1">
                            <kbd className="px-1 py-0.5 bg-slate-800/80 rounded text-[9px] text-slate-400 border border-slate-700">⌘K</kbd>
                        </div>
                    </GlassButton>

                    <div className="w-px h-6 bg-slate-700/50 mx-1" />

                    <GlassButton
                        size="sm"
                        variant="glass"
                        className="h-9 gap-2"
                        onClick={() => onNavigate('command-center')}
                    >
                        <Icon icon="terminal" className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline text-[11px]">Command</span>
                    </GlassButton>

                    <GlassButton
                        size="sm"
                        variant="glass"
                        className="h-9 gap-2"
                        onClick={() => onNavigate('creator')}
                    >
                        <Icon icon="settings" className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline text-[11px]">Forge</span>
                    </GlassButton>

                    <GlassButton
                        size="sm"
                        variant="glass"
                        className="h-9 gap-2"
                        onClick={() => onNavigate('competitions')}
                    >
                        <Icon icon="trophy" className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline text-[11px]">War Room</span>
                    </GlassButton>
                </div>

                {/* Center: Agent Scan Button */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <button
                        onClick={onRunScan}
                        disabled={isScanning}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs tracking-wider transition-all ${isScanning
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-wait'
                                : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40'
                            }`}
                    >
                        <Icon icon={isScanning ? 'loader' : 'radar'} className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? 'SCANNING...' : 'RUN SCAN'}
                    </button>
                </div>

                {/* Right: Status & Info */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        <span className="text-emerald-400 font-mono">LIVE</span>
                    </div>

                    <div className="w-px h-6 bg-slate-700/50" />

                    <div className="text-[10px] text-slate-500 font-mono hidden md:block">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    );
};
