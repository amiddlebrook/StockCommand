import React from 'react';
import { Icon } from './Icon';

export const StatusWidget: React.FC = () => {
    return (
        <div className="w-full h-full p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-900/20">
                <span className="text-xs font-bold text-orange-500 tracking-wider">SYSTEM_VITALS</span>
                <span className="text-[9px] text-slate-600">ID: N-72</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* CPU */}
                <div className="bg-slate-900/40 p-2 border-l-2 border-cyan-500/50">
                    <div className="text-[9px] text-slate-500 uppercase">Proc_Load</div>
                    <div className="text-lg font-mono text-cyan-300">12%</div>
                </div>
                {/* MEM */}
                <div className="bg-slate-900/40 p-2 border-l-2 border-cyan-500/50">
                    <div className="text-[9px] text-slate-500 uppercase">Mem_Alloc</div>
                    <div className="text-lg font-mono text-cyan-300">24%</div>
                </div>
            </div>

            <div className="flex-1 bg-black/20 p-2 text-[10px] font-mono text-slate-400 overflow-hidden relative border-t border-slate-800">
                <div className="absolute top-1 right-1 px-1 bg-orange-600 text-black text-[9px] font-bold">LIVE_LOG</div>
                <div className="opacity-70">
                    <div>&gt; KERNEL_INIT................[OK]</div>
                    <div>&gt; PERIPHERAL_CHECK...........[OK]</div>
                    <div className="text-cyan-600">&gt; UPLINK_ESTABLISHED.........[OK]</div>
                    <div>&gt; AWAITING_INPUT..............._</div>
                </div>
            </div>
        </div>
    );
};
