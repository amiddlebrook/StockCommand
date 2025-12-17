import React from 'react';
import { Icon } from './Icon';

interface HealthCheck {
    id: string;
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE';
    latency: number;
    uptime: string;
}

const SYSTEMS: HealthCheck[] = [
    { id: 'opt-1', name: 'Strategy Optimizer', status: 'UP', latency: 45, uptime: '99.9%' },
    { id: 'api-1', name: 'Market Data Stream (FMP)', status: 'UP', latency: 120, uptime: '98.5%' },
    { id: 'auth-1', name: 'Authentication (Clerk/D1)', status: 'UP', latency: 85, uptime: '100%' },
    { id: 'db-1', name: 'Vector Database (Pinecone)', status: 'UP', latency: 210, uptime: '99.1%' },
    { id: 'exec-1', name: 'Trade Executor', status: 'maintenance' as any, latency: 0, uptime: '0%' }, // Mock maintenance
];

export const SystemHealth: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Global Status Banner */}
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                    <Icon icon="check" className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-400">ALL SYSTEMS OPERATIONAL</h3>
                    <p className="text-sm text-emerald-400/70 mt-1">
                        Optimization engine active. Last update cycle: 30s ago.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SYSTEMS.map(sys => {
                    const isUp = sys.status === 'UP';
                    const isMaint = sys.status === ('maintenance' as any);
                    const colorClass = isUp ? 'text-emerald-400' : isMaint ? 'text-amber-500' : 'text-red-500';
                    const bgClass = isUp ? 'bg-emerald-500' : isMaint ? 'bg-amber-500' : 'bg-red-500';
                    const borderClass = isUp ? 'border-emerald-500' : isMaint ? 'border-amber-500' : 'border-red-500';

                    return (
                        <div key={sys.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-600 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <h4 className="font-bold text-slate-200 text-sm">{sys.name}</h4>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colorClass} ${borderClass} border-opacity-30 bg-opacity-10 ${bgClass} bg-opacity-5`}>
                                    {sys.status}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                                <span>LATENCY: {sys.latency}ms</span>
                                <span>UP: {sys.uptime}</span>
                            </div>

                            {/* Mini Sparkline (Mock) */}
                            <div className="h-1 w-full bg-slate-800 mt-3 rounded-full overflow-hidden">
                                <div className={`h-full ${bgClass}`} style={{ width: isUp ? '100%' : '0%' }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
