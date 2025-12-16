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
    { id: 'command-center', label: 'DASHBOARD', icon: 'terminal', shortcut: '1' },
    { id: 'portfolio', label: 'PORTFOLIO', icon: 'briefcase', shortcut: '2' },
    { id: 'market-clocks', label: 'MARKET DATA', icon: 'clock', shortcut: '3' },
    { id: 'competitions', label: 'COMPETITIONS', icon: 'trophy', shortcut: '4' },
    { id: 'comms', label: 'COMMS', icon: 'message', shortcut: '5' },
    { id: 'news', label: 'NEWS', icon: 'activity', shortcut: '6' },
    { id: 'creator', label: 'CREATOR', icon: 'code', shortcut: '7' },
    { id: 'settings', label: 'SYSTEM', icon: 'settings', shortcut: '8' },
];

export const HUDNav: React.FC<HUDNavProps> = ({
    activeTab,
    onNavigate,
    marketStatus = 'neutral',
    activeJobsCount = 0
}) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
        <div className="fixed left-0 top-0 h-screen w-16 z-50 flex flex-col items-center py-4 bg-slate-950 border-r border-slate-800/80">
            {/* Logo / Status Indicator */}
            <div
                className="w-10 h-10 border border-cyan-500/30 flex items-center justify-center mb-6 relative group cursor-pointer"
                onClick={() => onNavigate('command-center')}
                title="Return to Dashboard"
            >
                <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors"></div>
                <Icon icon="bot" className="w-5 h-5 text-cyan-400" />

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-4 w-full px-2">
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
                                relative w-full aspect-square flex items-center justify-center
                                transition-all duration-200 group border
                                ${isActive
                                    ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                    : 'bg-transparent border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                }
                            `}
                            title={`${item.label} (${item.shortcut})`}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500" />
                            )}

                            <Icon icon={item.icon as any} className="w-5 h-5" />

                            {/* Tooltip */}
                            <div className={`
                                absolute left-full ml-4 px-3 py-1
                                bg-slate-900 border border-slate-700
                                text-xs font-mono text-cyan-400 whitespace-nowrap pointer-events-none
                                transition-all duration-200 z-50
                                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                            `}>
                                {item.label}
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="flex flex-col items-center gap-3 w-full px-2">
                {activeJobsCount > 0 && (
                    <div className="relative w-full aspect-square flex items-center justify-center border border-amber-500/50 bg-amber-900/10">
                        <Icon icon="loader" className="w-4 h-4 text-amber-500 animate-spin" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 text-[8px] flex items-center justify-center text-black font-bold">
                            {activeJobsCount}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                        window.dispatchEvent(event);
                    }}
                    className="w-full aspect-square flex items-center justify-center border border-slate-800 hover:border-cyan-500/30 text-slate-500 hover:text-cyan-400 transition-colors"
                >
                    <Icon icon="search" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default HUDNav;
