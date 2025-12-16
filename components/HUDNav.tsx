import React, { useState } from 'react';
import { Icon } from './Icon';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    shortcut?: string;
}

interface HUDNavProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    marketStatus?: 'bullish' | 'bearish' | 'neutral';
    activeJobsCount?: number;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'command-center', label: 'COMMAND', icon: 'terminal', shortcut: '1' },
    { id: 'portfolio', label: 'PORTFOLIO', icon: 'briefcase', shortcut: '2' },
    { id: 'market-clocks', label: 'CLOCKS', icon: 'clock', shortcut: '3' },
    { id: 'competitions', label: 'ARENA', icon: 'trophy', shortcut: '4' },
    { id: 'creator', label: 'FORGE', icon: 'code', shortcut: '5' },
];

export const HUDNav: React.FC<HUDNavProps> = ({
    activeTab,
    onNavigate,
    marketStatus = 'neutral',
    activeJobsCount = 0
}) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const statusColor = {
        bullish: 'from-green-500 to-emerald-500',
        bearish: 'from-red-500 to-rose-500',
        neutral: 'from-cyan-500 to-blue-500'
    }[marketStatus];

    const statusGlow = {
        bullish: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
        bearish: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
        neutral: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]'
    }[marketStatus];

    return (
        <div className="fixed left-0 top-0 h-screen w-16 z-50 flex flex-col items-center py-4 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/50">

            {/* Logo / Status Indicator */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusColor} ${statusGlow} flex items-center justify-center mb-6 transition-all duration-500`}>
                <Icon icon="bot" className="w-5 h-5 text-white" />
            </div>

            {/* Divider */}
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const isHovered = hoveredItem === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                transition-all duration-300 group
                ${isActive
                                    ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                }
              `}
                            title={`${item.label} (${item.shortcut})`}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                            )}

                            <Icon icon={item.icon as any} className="w-5 h-5" />

                            {/* Tooltip */}
                            <div className={`
                absolute left-full ml-3 px-3 py-2 rounded-lg
                bg-slate-900/95 backdrop-blur-sm border border-slate-700/50
                shadow-xl whitespace-nowrap pointer-events-none
                transition-all duration-200
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
              `}>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-white">{item.label}</span>
                                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
                                        {item.shortcut}
                                    </kbd>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="flex flex-col items-center gap-3">
                {/* Active Jobs Indicator */}
                {activeJobsCount > 0 && (
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
                            <Icon icon="loader" className="w-5 h-5 text-amber-400 animate-spin" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center text-black">
                            {activeJobsCount}
                        </span>
                    </div>
                )}

                {/* Divider */}
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

                {/* Command Palette Trigger */}
                <button
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                        window.dispatchEvent(event);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all border border-slate-700/50"
                    title="Command Palette (⌘K)"
                >
                    <Icon icon="search" className="w-4 h-4" />
                </button>

                {/* Settings/Profile */}
                <button
                    className="w-10 h-10 rounded-xl hover:bg-slate-800/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
                    title="Settings"
                >
                    <Icon icon="settings" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default HUDNav;
