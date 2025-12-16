import React from 'react';
import { Icon } from './Icon';

interface MobileNavProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'command-center', label: 'Command', icon: 'terminal' },
        { id: 'portfolio', label: 'Portfolio', icon: 'portfolio' },
        { id: 'market-clocks', label: 'Clocks', icon: 'chart' },
        { id: 'features', label: 'Features', icon: 'search' },
    ] as const;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 border-t border-slate-800 backdrop-blur-lg flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] safe-area-bottom">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex flex-col items-center justify-center py-3 w-full transition-all active:scale-95 ${activeTab === item.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    {activeTab === item.id && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] rounded-full" />
                    )}
                    <Icon icon={item.icon} className={`w-5 h-5 mb-1 transition-transform duration-300 ${activeTab === item.id ? '-translate-y-0.5' : ''}`} />
                    <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
