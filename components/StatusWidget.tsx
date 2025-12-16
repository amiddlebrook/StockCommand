import React from 'react';
import { Icon } from './Icon';

export const StatusWidget: React.FC = () => {
    return (
        <div className="hud-panel p-4 rounded-lg w-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-orange-500 tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    SYSTEM STATUS
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">SYS-01</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-900 border border-slate-700 rounded flex items-center justify-center">
                    <Icon icon="activity" className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                    <div className="text-xl font-bold text-white tracking-widest">SYSTEM_OK</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">All Subsystems Nominal</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* CPU/Load Block */}
                <div className="bg-slate-900/50 p-3 border border-slate-800 relative">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>CPU_01</span>
                        <span>LOAD</span>
                    </div>
                    <div className="text-2xl font-mono text-cyan-400 mb-1">12%</div>
                    <div className="w-full h-1 bg-slate-800">
                        <div className="h-full bg-cyan-500 w-[12%] shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                    </div>
                </div>

                {/* Mem Block */}
                <div className="bg-slate-900/50 p-3 border border-slate-800 relative">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>MEM_ALLOC</span>
                        <span>4.2GB</span>
                    </div>
                    <div className="text-2xl font-mono text-cyan-400 mb-1">24%</div>
                    <div className="w-full h-1 bg-slate-800">
                        <div className="h-full bg-cyan-500 w-[24%] shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                    </div>
                </div>
            </div>

            <div className="mt-4 p-2 bg-black/40 border border-slate-800 font-mono text-[10px] text-slate-400 h-20 overflow-hidden relative">
                <div className="absolute top-1 right-1 px-1 bg-orange-600 text-black text-[9px] font-bold">LIVE_LOG</div>
                <div className="opacity-70">
                    <div>&gt; INIT_SEQUENCE_START</div>
                    <div>&gt; CHECKING_PERIPHERALS... OK</div>
                    <div>&gt; LOADING_KERNEL_MODULES... OK</div>
                    <div className="text-cyan-500">&gt; ESTABLISHING_UPLINK...</div>
                </div>
            </div>
        </div>
    );
};
