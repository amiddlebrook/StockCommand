import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
    { name: '00', value: 4000 },
    { name: '01', value: 3000 },
    { name: '02', value: 5000 },
    { name: '03', value: 2780 },
    { name: '04', value: 1890 },
    { name: '05', value: 2390 },
    { name: '06', value: 3490 },
    { name: '07', value: 4000 },
    { name: '08', value: 3000 },
    { name: '09', value: 5000 },
    { name: '10', value: 2780 },
    { name: '11', value: 6890 },
    { name: '12', value: 3490 },
];

export const MetricsAnalytics: React.FC = () => {
    return (
        <div className="hud-panel p-4 rounded-lg w-full h-full flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-cyan-500 tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    METRICS & ANALYTICS
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">MTR-X2</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900/50 p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Peak Throughput</div>
                    <div className="text-xl font-mono text-white">84.2 <span className="text-sm text-slate-400">MB/s</span></div>
                </div>
                <div className="bg-slate-900/50 p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Error Rate</div>
                    <div className="text-xl font-mono text-orange-500">0.04%</div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[150px] relative">
                <div className="absolute top-0 left-0 px-1 bg-slate-800 text-[9px] text-slate-300 z-10">REALTIME_TELEMETRY</div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155' }}
                            itemStyle={{ color: '#f97316' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
