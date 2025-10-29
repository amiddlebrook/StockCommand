import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-black via-gray-950 to-black p-4 border-b border-gray-800/50 shadow-xl sticky top-0 z-10 backdrop-blur-sm">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg shadow-lg">
            <Icon icon="chart" className="w-6 h-6 text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-wider">
              StockBrain
            </h1>
            <p className="text-xs text-gray-500 tracking-wide">AI-Powered Financial Analysis</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
    </header>
  );
};