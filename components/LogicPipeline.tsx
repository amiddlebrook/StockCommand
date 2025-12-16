import React from 'react';
import { Icon } from './Icon';

interface Step {
    id: string;
    label: string;
    subtext?: string;
    status: 'pending' | 'processing' | 'complete' | 'failed';
}

interface LogicPipelineProps {
    steps?: Step[];
}

const DEFAULT_STEPS: Step[] = [
    { id: '01', label: 'INPUT_STREAM', subtext: 'Monitoring...', status: 'complete' },
    { id: '02', label: 'NORMALIZE', subtext: 'Data verified', status: 'complete' },
    { id: '03', label: 'INFERENCE_ENGINE', subtext: 'Analyzing patterns...', status: 'processing' },
    { id: '04', label: 'OUTPUT_BUFFER', subtext: 'Waiting for result', status: 'pending' },
];

export const LogicPipeline: React.FC<LogicPipelineProps> = ({ steps = DEFAULT_STEPS }) => {
    return (
        <div className="hud-panel p-4 rounded-lg w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-cyan-500 tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    LOGIC PIPELINE
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">LCC-99</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {steps.map((step) => {
                    const isActive = step.status === 'processing';
                    const isDone = step.status === 'complete';

                    return (
                        <div
                            key={step.id}
                            className={`relative p-3 border transition-all duration-300 ${isActive
                                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                    : isDone
                                        ? 'bg-slate-900/50 border-cyan-900/30 opacity-70'
                                        : 'bg-slate-900/20 border-slate-800 opacity-50'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute right-3 top-3">
                                    <Icon icon="loader" className="w-4 h-4 text-cyan-400 animate-spin" />
                                </div>
                            )}
                            {isDone && (
                                <div className="absolute right-3 top-3">
                                    <Icon icon="check" className="w-4 h-4 text-cyan-600" />
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-6 h-6 flex items-center justify-center border rounded ${isActive ? 'border-cyan-400 text-cyan-400' : 'border-slate-700 text-slate-700'
                                    }`}>
                                    <Icon icon={isDone ? 'check' : isActive ? 'cpu' : 'circle'} className="w-3 h-3" />
                                </div>

                                <div>
                                    <div className="text-[10px] text-slate-500 mb-0.5">STEP_{step.id}</div>
                                    <div className={`text-sm font-bold tracking-wide ${isActive ? 'text-white hud-text-glow' : 'text-slate-300'}`}>
                                        {step.label}
                                    </div>
                                    {step.subtext && (
                                        <div className="text-xs text-slate-400 mt-1 font-mono">
                                            &gt; {step.subtext}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
