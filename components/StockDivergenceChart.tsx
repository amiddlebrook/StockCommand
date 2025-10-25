import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DivergenceData } from '../types';
import { Icon } from './Icon';

interface StockDivergenceChartProps {
  id: string;
  data: DivergenceData[];
  onRemove: (id: string) => void;
}

export const StockDivergenceChart: React.FC<StockDivergenceChartProps> = ({ id, data, onRemove }) => {
  return (
    <div className="bg-black border border-gray-800 h-96">
      <header className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-cyan-300 tracking-wider">DIVERGENCE ANALYSIS</h3>
        <button onClick={() => onRemove(id)} className="text-gray-500 hover:text-white">
            <Icon icon="close" className="w-4 h-4" />
        </button>
      </header>
      <div className="p-4 h-[calc(100%-53px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.3} />
            <XAxis dataKey="timeframe" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568', fontSize: '12px' }} cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} />
            <Legend wrapperStyle={{fontSize: '12px'}} />
            <Bar dataKey="bullish" fill="#48BB78" name="Bullish" />
            <Bar dataKey="bearish" fill="#F56565" name="Bearish" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};