import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './Icon';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: string) => void;
    onSearch: (query: string) => void;
}

interface CommandItem {
    id: string;
    label: string;
    description: string;
    icon: string;
    action: () => void;
    category: 'navigation' | 'action' | 'ticker';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onSearch
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Define available commands
    const commands: CommandItem[] = [
        // Navigation
        { id: 'nav-command', label: 'Command Center', description: 'Main dashboard', icon: 'terminal', action: () => onNavigate('command-center'), category: 'navigation' },
        { id: 'nav-creator', label: 'Strategy Forge', description: 'Build & test strategies', icon: 'settings', action: () => onNavigate('creator'), category: 'navigation' },
        { id: 'nav-intel', label: 'Intelligence Panel', description: 'Market clocks & library', icon: 'radar', action: () => onNavigate('market-clocks'), category: 'navigation' },
        { id: 'nav-competitions', label: 'War Room', description: 'Competitions & leaderboards', icon: 'trophy', action: () => onNavigate('competitions'), category: 'navigation' },
        { id: 'nav-portfolio', label: 'Portfolio', description: 'Asset allocation', icon: 'pie-chart', action: () => onNavigate('portfolio'), category: 'navigation' },
        // Actions
        { id: 'act-scan', label: 'Run Agent Scan', description: 'Execute market analysis', icon: 'play', action: () => { onSearch('scan'); onClose(); }, category: 'action' },
        { id: 'act-report', label: 'Generate Report', description: 'Portfolio summary', icon: 'file-text', action: () => { onSearch('report'); onClose(); }, category: 'action' },
    ];

    // Filter commands based on query
    const filteredCommands = query
        ? commands.filter(cmd =>
            cmd.label.toLowerCase().includes(query.toLowerCase()) ||
            cmd.description.toLowerCase().includes(query.toLowerCase())
        )
        : commands;

    // Dynamic Ticker Detection
    const tickerMatch = query.toUpperCase().match(/^[A-Z]{1,5}$/);
    if (tickerMatch && query.length > 1) {
        const ticker = tickerMatch[0];
        // Check if scanning this ticker is already an option? No, just add it.
        const dynamicCommand: CommandItem = {
            id: `scan-${ticker}`,
            label: `Analyze $${ticker}`,
            description: `Run full agent analysis on ${ticker}`,
            icon: 'crosshair', // Use a distinct icon
            action: () => { onSearch(`scan ${ticker}`); onClose(); },
            category: 'ticker'
        };

        // Add to TOP of list
        filteredCommands.unshift(dynamicCommand);
    }

    // Group by category
    const tickerCommands = filteredCommands.filter(c => c.category === 'ticker');
    const navigationCommands = filteredCommands.filter(c => c.category === 'navigation');
    const actionCommands = filteredCommands.filter(c => c.category === 'action');

    // Handle keyboard navigation
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    }, [filteredCommands, selectedIndex, onClose]);

    // Global keyboard shortcut listener
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

            {/* Palette Container */}
            <div
                className="relative w-full max-w-xl glass-panel hud-brackets rounded-lg shadow-2xl overflow-hidden animate-fadeIn"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
                    <Icon icon="search" className="w-5 h-5 text-cyan-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands, tickers, or strategies..."
                        className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                    />
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">⌘</kbd>
                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">K</kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {/* Ticker Section */}
                    {tickerCommands.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-1.5 text-[10px] text-cyan-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                <Icon icon="zap" className="w-3 h-3" />
                                Instant Analysis
                            </div>
                            {tickerCommands.map((cmd) => {
                                const globalIdx = filteredCommands.indexOf(cmd);
                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={() => { cmd.action(); onClose(); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${globalIdx === selectedIndex
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                            : 'hover:bg-slate-800/50 text-slate-300'
                                            }`}
                                    >
                                        <Icon icon={cmd.icon as any} className="w-4 h-4" />
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-bold">{cmd.label}</div>
                                            <div className="text-[10px] text-cyan-500/70">{cmd.description}</div>
                                        </div>
                                        {globalIdx === selectedIndex && (
                                            <div className="text-[10px] text-slate-500">↵</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {/* Navigation Section */}
                    {navigationCommands.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                Navigation
                            </div>
                            {navigationCommands.map((cmd, idx) => {
                                const globalIdx = filteredCommands.indexOf(cmd);
                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={() => { cmd.action(); onClose(); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${globalIdx === selectedIndex
                                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                            : 'hover:bg-slate-800/50 text-slate-300'
                                            }`}
                                    >
                                        <Icon icon={cmd.icon} className="w-4 h-4" />
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">{cmd.label}</div>
                                            <div className="text-[10px] text-slate-500">{cmd.description}</div>
                                        </div>
                                        {globalIdx === selectedIndex && (
                                            <div className="text-[10px] text-slate-500">↵</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Actions Section */}
                    {actionCommands.length > 0 && (
                        <div className="mb-2">
                            <div className="px-3 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                Actions
                            </div>
                            {actionCommands.map((cmd) => {
                                const globalIdx = filteredCommands.indexOf(cmd);
                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={() => { cmd.action(); onClose(); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${globalIdx === selectedIndex
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                            : 'hover:bg-slate-800/50 text-slate-300'
                                            }`}
                                    >
                                        <Icon icon={cmd.icon} className="w-4 h-4" />
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">{cmd.label}</div>
                                            <div className="text-[10px] text-slate-500">{cmd.description}</div>
                                        </div>
                                        {globalIdx === selectedIndex && (
                                            <div className="text-[10px] text-slate-500">↵</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* No Results */}
                    {filteredCommands.length === 0 && (
                        <div className="p-6 text-center">
                            <Icon icon="search" className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                            <p className="text-sm text-slate-500">No commands found for "{query}"</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700/50 bg-slate-950/50 text-[10px] text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-slate-800 rounded">↑↓</kbd> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-slate-800 rounded">↵</kbd> Select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-slate-800 rounded">Esc</kbd> Close
                    </span>
                </div>
            </div>
        </div>
    );
};
