import React from 'react';
import { MarketClock } from '../lib/agent/types';

interface NetworkTopologyProps {
    nodes?: MarketClock[];
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({ nodes = [] }) => {
    return (
        <div className="hud-panel p-4 rounded-lg w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-cyan-500 tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    NETWORK TOPOLOGY
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">NET-R4</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                            <th className="pb-2 pl-2">NODE ID</th>
                            <th className="pb-2">REGION</th>
                            <th className="pb-2 text-right">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                        {nodes.length > 0 ? nodes.map((node) => (
                            <tr key={node.code} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                                <td className="py-2 pl-2 text-cyan-400 font-bold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-cyan-600"></span>
                                    {node.code}
                                </td>
                                <td className="py-2 text-slate-400">US-EAST</td> {/* Placeholder region */}
                                <td className="py-2 text-right pr-1">
                                    {node.status === 'green' && <span className="inline-block w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>}
                                    {node.status === 'yellow' && <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></span>}
                                    {node.status === 'red' && <span className="inline-block w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>}
                                    {node.status === 'gray' && <span className="inline-block w-2 h-2 rounded-full bg-slate-500"></span>}
                                </td>
                            </tr>
                        )) : (
                            <tr className="text-center text-slate-500 italic">
                                <td colSpan={3} className="py-4">Scanning Network...</td>
                            </tr>
                        )}

                        {/* Mock Rows if empty */}
                        {nodes.length === 0 && Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-slate-800/50 opacity-40">
                                <td className="py-2 pl-2 text-slate-500">N-{10 + i}</td>
                                <td className="py-2 text-slate-600">OFFLINE</td>
                                <td className="py-2 text-right pr-1"><span className="inline-block w-2 h-2 rounded-full bg-slate-800"></span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
