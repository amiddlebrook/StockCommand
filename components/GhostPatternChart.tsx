import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GhostPatternData } from '../types';
import { Icon } from './Icon';

interface GhostPatternChartProps {
  id: string;
  data: GhostPatternData;
  onRemove: (id: string) => void;
}

export const GhostPatternChart: React.FC<GhostPatternChartProps> = ({ id, data, onRemove }) => {
  return (
    <div className="bg-black border border-gray-800 h-96">
       <header className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-purple-300 tracking-wider">GHOST PATTERN ANALYSIS</h3>
        <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs text-gray-400">Type: {data.patternType} / Score: <span className="font-bold text-purple-300">{data.score.toFixed(2)}</span></p>
            </div>
            <button onClick={() => onRemove(id)} className="text-gray-500 hover:text-white">
                <Icon icon="close" className="w-4 h-4" />
            </button>
        </div>
      </header>
       <div className="p-4 h-[calc(100%-53px)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.correlation} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" strokeOpacity={0.3}/>
            <XAxis dataKey="x" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568', fontSize: '12px' }} cursor={{stroke: '#a78bfa', strokeWidth: 1}}/>
            <Legend wrapperStyle={{fontSize: '12px'}}/>
            <Line type="monotone" dataKey="y" stroke="#a78bfa" name="Correlation" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};
