import React from 'react';
import { Icon } from './Icon';

interface QuickActionsProps {
    onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
    const actions = [
        { label: 'Liquidity Check', icon: 'zap', action: 'LIQUIDITY_CHECK' },
        { label: 'Divergence Scan', icon: 'activity', action: 'DIVERGENCE_SCAN' },
        { label: 'Portfolio Report', icon: 'file-text', action: 'PORTFOLIO_REPORT' },
        { label: 'Market Vitals', icon: 'bar-chart', action: 'MARKET_VITALS' },
    ];

    return (
        <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide">
            {actions.map((act) => (
                <button
                    key={act.action}
                    onClick={() => onAction(act.action)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 hover:text-cyan-400 border border-slate-700 rounded-full text-xs font-medium text-gray-400 transition-all whitespace-nowrap"
                >
                    <Icon icon={act.icon as any} className="w-3 h-3" />
                    {act.label}
                </button>
            ))}
        </div>
    );
};
