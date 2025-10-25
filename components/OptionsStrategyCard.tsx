import React from 'react';
import { OptionsStrategy } from '../types';
import { Icon } from './Icon';

interface OptionsStrategyCardProps {
  id: string;
  data: OptionsStrategy;
  onRemove: (id: string) => void;
}

export const OptionsStrategyCard: React.FC<OptionsStrategyCardProps> = ({ id, data, onRemove }) => {
  return (
    <div className="bg-black border border-gray-800">
        <header className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-yellow-300 tracking-wider flex items-center gap-2">
                <Icon icon="strategy" className="w-4 h-4" />
                <span>OPTIONS STRATEGY</span>
            </h3>
            <button onClick={() => onRemove(id)} className="text-gray-500 hover:text-white">
                <Icon icon="close" className="w-4 h-4" />
            </button>
        </header>
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <p className="text-xs text-gray-400 uppercase">Strategy</p>
                <p className="text-md font-bold">{data.strategyName} on {data.symbol}</p>
                </div>
                <div>
                <p className="text-xs text-gray-400 uppercase">Profit Probability</p>
                <p className="text-md font-bold text-green-400">{(data.probabilityOfProfit * 100).toFixed(2)}%</p>
                </div>
                <div>
                <p className="text-xs text-gray-400 uppercase">Expected Move</p>
                <p className="text-md font-bold">{data.expectedMove}</p>
                </div>
                <div>
                <p className="text-xs text-gray-400 uppercase">Breakeven Points</p>
                <p className="text-md font-bold">{data.breakevenPoints.join(', ')}</p>
                </div>
            </div>
        </div>
    </div>
  );
};