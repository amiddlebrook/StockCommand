import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface HealthCheck {
    id: string;
    name: string;
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE';
    latency: number;
    uptime: string;
}

// Default system definitions for display
const SYSTEM_DEFINITIONS: HealthCheck[] = [
    { id: 'opt-1', name: 'Strategy Optimizer', status: 'UP', latency: 42, uptime: '99.9%' },
    { id: 'api-1', name: 'Market Data Stream', status: 'UP', latency: 85, uptime: '99.5%' },
    { id: 'auth-1', name: 'Authentication', status: 'UP', latency: 35, uptime: '100%' },
    { id: 'db-1', name: 'Database (D1/KV)', status: 'UP', latency: 15, uptime: '100%' },
    { id: 'exec-1', name: 'Trade Executor', status: 'UP', latency: 55, uptime: '99.9%' },
];

export const SystemHealth: React.FC = () => {
    // In future, this can be passed via props from App.tsx knowing real connection state
    const [systems] = useState<HealthCheck[]>(SYSTEM_DEFINITIONS);

    // Derived overall status
    const overallStatus = 'operational';

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'UP': return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500' };
            case 'DOWN': return { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500' };
            case 'DEGRADED':
            case 'MAINTENANCE': return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500' };
            default: return { text: 'text-slate-400', bg: 'bg-slate-500', border: 'border-slate-500' };
        }
    };

    return (
        <div className="space-y-6">
            {/* Global Status Banner */}
            <div className={`rounded-lg p-6 flex items-center gap-4 bg-emerald-900/20 border border-emerald-500/30`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/20`}>
                    <Icon icon="check" className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-400">ALL SYSTEMS OPERATIONAL</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Last checked: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map(sys => {
                    const colors = getStatusColors(sys.status);

                    return (
                        <div key={sys.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-600 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <h4 className="font-bold text-slate-200 text-sm">{sys.name}</h4>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors.text} ${colors.border} border-opacity-30 bg-opacity-10 ${colors.bg} bg-opacity-5`}>
                                    {sys.status}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                                <span>LATENCY: {sys.latency}ms</span>
                                <span>UP: {sys.uptime}</span>
                            </div>

                            {/* Status Bar */}
                            <div className="h-1 w-full bg-slate-800 mt-3 rounded-full overflow-hidden">
                                <div className={`h-full ${colors.bg}`} style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
