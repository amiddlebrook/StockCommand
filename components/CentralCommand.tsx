import React from 'react';
import { Icon } from './Icon';
import { TraditionalView } from './TraditionalView';
import { MarketClock } from '../lib/agent/types';

interface CentralCommandProps {
    activeMode?: string;
    status?: 'optimal' | 'warning' | 'critical';
    viewMode?: 'CHART' | 'SPATIAL';
    clocks?: MarketClock[];
    symbols?: string[];
    onAddSymbol?: (symbol: string) => void;
}

export const CentralCommand: React.FC<CentralCommandProps> = ({
    activeMode = 'READY',
    status = 'optimal',
    viewMode = 'SPATIAL',
    clocks = [],
    symbols = [],
    onAddSymbol = () => { }
}) => {
    const colorClass = status === 'optimal' ? 'text-cyan-400' : status === 'warning' ? 'text-orange-400' : 'text-red-500';
    const ringColor = status === 'optimal' ? 'border-cyan-500/30' : status === 'warning' ? 'border-orange-500/30' : 'border-red-500/30';

    // CHART VIEW (2D Charts)
    if (viewMode === 'CHART') {
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

    // SPATIAL VIEW (3D / Rings)
    return (
        <div className="relative flex items-center justify-center w-64 h-64 md:w-96 md:h-96 mx-auto my-8 animate-in zoom-in-95 duration-500">
            {/* Outer Ring - Static */}
            <div className={`absolute inset-0 rounded-full border-2 ${ringColor} opacity-20`}></div>

            {/* Middle Ring - Rotating */}
            <div className={`absolute inset-4 rounded-full border border-dashed ${ringColor} animate-spin-slow opacity-40`}></div>

            {/* Inner Ring - Reverse Rotating */}
            <div className={`absolute inset-12 rounded-full border-t-2 border-b-2 ${ringColor} animate-spin-reverse opacity-60`}></div>

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

            {/* Orbital Nodes */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 px-2 py-1 bg-slate-900 border border-cyan-900/50 text-[10px] text-cyan-500">
                STATUS
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 px-2 py-1 bg-slate-900 border border-cyan-900/50 text-[10px] text-cyan-500">
                SEQ
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 px-2 py-1 bg-slate-900 border border-cyan-900/50 text-[10px] text-cyan-500">
                DATA
            </div>
            <div className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 px-2 py-1 bg-slate-900 border border-cyan-900/50 text-[10px] text-cyan-500">
                GRID
            </div>
        </div>
    );
};
