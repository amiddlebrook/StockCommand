import React from 'react';
import { Icon } from './Icon';

// Add onOpenProfile to Props
interface HeaderProps {
  activeTab: 'command-center' | 'portfolio';
  onTabChange: (tab: 'command-center' | 'portfolio') => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onOpenProfile }) => {
  return (
    <header className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/50 backdrop-blur-lg sticky top-0 z-50 shadow-2xl">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 animate-gradient" />

      <div className="relative px-4 py-4 md:px-6">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              {/* Logo with glow effect */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-cyan-600 to-purple-700 rounded-lg shadow-lg">
                  <Icon icon="bot" className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col cursor-pointer" onClick={() => onTabChange('command-center')}>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                  StockCommand
                </h1>
                <p className="text-xs text-gray-500 tracking-wider hidden sm:block">AI-Powered Market Intelligence</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
              <button
                onClick={() => onTabChange('command-center')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'command-center'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
              >
                Command Center
              </button>
              <button
                onClick={() => onTabChange('portfolio')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'portfolio'
                    ? 'bg-slate-800 text-purple-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
              >
                Portfolio
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
              <span className="text-xs text-gray-400 font-medium">LIVE</span>
            </div>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/20 transition-all transform hover:scale-105"
            >
              AM
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
