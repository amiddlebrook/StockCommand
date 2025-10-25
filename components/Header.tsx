import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-black p-3 border-b border-gray-800 shadow-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-cyan-600 to-purple-700">
          <Icon icon="bot" className="w-5 h-5 text-white"/>
        </div>
        <h1 className="text-lg font-bold text-gray-200 tracking-widest uppercase">
          AI Stock Terminal
        </h1>
      </div>
    </header>
  );
};