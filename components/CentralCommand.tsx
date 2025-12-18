import React, { useState } from 'react';
import { Icon } from './Icon';
import { TraditionalView } from './TraditionalView';
import { MarketClock } from '../lib/agent/types';

// Navigation items for SPATIAL HUD (same as sidebar)
const SPATIAL_NAV_ITEMS = [
    { id: 'command-center', label: 'DASHBOARD', icon: 'terminal', angle: 0 },
    { id: 'portfolio', label: 'PORTFOLIO', icon: 'briefcase', angle: 40 },
    { id: 'trade', label: 'TRADE', icon: 'chart', angle: 80 },
    { id: 'market-clocks', label: 'MARKETS', icon: 'clock', angle: 120 },
    { id: 'competitions', label: 'COMPETE', icon: 'trophy', angle: 160 },
    { id: 'comms', label: 'COMMS', icon: 'message', angle: 200 },
    { id: 'news', label: 'NEWS', icon: 'activity', angle: 240 },
    { id: 'creator', label: 'CREATOR', icon: 'code', angle: 280 },
    { id: 'settings', label: 'SYSTEM', icon: 'settings', angle: 320 },
];

interface CentralCommandProps {
    activeMode?: string;
    status?: 'optimal' | 'warning' | 'critical';
    viewMode?: 'DATA' | 'ARENA';
    activeTab?: string;
    onNavigate?: (tab: string) => void;
    clocks?: MarketClock[];
    symbols?: string[];
    onAddSymbol?: (symbol: string) => void;
}

export const CentralCommand: React.FC<CentralCommandProps> = ({
    activeMode = 'READY',
    status = 'optimal',
    viewMode = 'ARENA',
    activeTab = 'command-center',
    onNavigate = () => { },
    clocks = [],
    symbols = [],
    onAddSymbol = () => { }
}) => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const colorClass = status === 'optimal' ? 'text-cyan-400' : status === 'warning' ? 'text-orange-400' : 'text-red-500';
    const ringColor = status === 'optimal' ? 'border-cyan-500/30' : status === 'warning' ? 'border-orange-500/30' : 'border-red-500/30';

    // DATA VIEW (2D Charts)
    if (viewMode === 'DATA') {
        return (
            <div className="w-full h-full animate-in fade-in duration-500">
                <TraditionalView
                    clocks={clocks}
                    symbols={symbols}
                    onAddSymbol={onAddSymbol}
                />
            </div>
        );
    }

    // SPATIAL VIEW (HUD Navigation)
    const orbitRadius = 180;

    return (
        <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
            {/* Outer Ring - Static */}
            <div className={`absolute w-[400px] h-[400px] rounded-full border-2 ${ringColor} opacity-20`}></div>

            {/* Middle Ring - Rotating */}
            <div className={`absolute w-[350px] h-[350px] rounded-full border border-dashed ${ringColor} animate-spin-slow opacity-40`}></div>

            {/* Inner Ring - Reverse Rotating */}
            <div className={`absolute w-[280px] h-[280px] rounded-full border-t-2 border-b-2 ${ringColor} animate-spin-reverse opacity-60`}></div>

            {/* Core Interface */}
            <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-slate-950/80 rounded-full w-40 h-40 backdrop-blur-sm border border-cyan-900/50 shadow-2xl">
                <div className={`text-3xl font-bold tracking-widest hud-text-glow ${colorClass}`}>
                    {activeMode}
                </div>
                <div className="text-xs text-slate-400 mt-2 tracking-widest uppercase">System Active</div>

                {/* Decorative dots */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-500 rounded-full"></div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-500 rounded-full"></div>
            </div>

            {/* Orbital Navigation Nodes */}
            {SPATIAL_NAV_ITEMS.map((item) => {
                const radians = (item.angle * Math.PI) / 180;
                const x = Math.cos(radians) * orbitRadius;
                const y = Math.sin(radians) * orbitRadius;
                const isActive = activeTab === item.id;
                const isHovered = hoveredNode === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        onMouseEnter={() => setHoveredNode(item.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className={`
                            absolute z-20 flex flex-col items-center justify-center
                            w-14 h-14 rounded-full transition-all duration-300 cursor-pointer
                            ${isActive
                                ? 'bg-cyan-900/60 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110'
                                : 'bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80'}
                        `}
                        style={{
                            transform: `translate(${x}px, ${y}px) ${isActive ? 'scale(1.1)' : ''}`,
                        }}
                        title={item.label}
                    >
                        <Icon icon={item.icon as any} className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />

                        {/* Label (visible on hover or active) */}
                        <span className={`
                            absolute -bottom-6 text-[9px] font-mono uppercase tracking-wider whitespace-nowrap
                            transition-opacity duration-200
                            ${isActive ? 'text-cyan-400 opacity-100' : isHovered ? 'text-slate-300 opacity-100' : 'opacity-0'}
                        `}>
                            {item.label}
                        </span>

                        {/* Pulse effect for active */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-30"></div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
