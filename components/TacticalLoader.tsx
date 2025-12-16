import React, { useState, useEffect } from 'react';

const STEPS = [
    "INITIALIZING_NEURAL_LINK",
    "DECRYPTING_MARKET_FLOW",
    "TRIANGULATING_ALPHA_VECTORS",
    "ANALYZING_DARK_POOL_SIGS",
    "SYNTHESIZING_STRATEGIC_OUTPUT",
    "FINALIZING_REPORT"
];

export const TacticalLoader: React.FC = () => {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex(prev => (prev + 1) % STEPS.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-4 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                <span className="font-mono text-xs text-cyan-500 tracking-[0.2em] animate-pulse">
                    {STEPS[stepIndex]}...
                </span>
            </div>
            <div className="h-0.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 animate-progress origin-left" style={{ animationDuration: '2s' }} />
            </div>
        </div>
    );
};
