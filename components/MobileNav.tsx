import React from 'react';
import { Icon } from './Icon';

type MobileView = 'toolbox' | 'dashboard' | 'chat';

interface MobileNavProps {
    activeView: MobileView;
    setActiveView: (view: MobileView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: MobileView; label: string; icon: 'search' | 'chart' | 'bot' }[] = [
        { view: 'toolbox', label: 'Toolbox', icon: 'search' },
        { view: 'dashboard', label: 'Dashboard', icon: 'chart' },
        { view: 'chat', label: 'Chat', icon: 'bot' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex justify-around items-center z-20">
            {navItems.map(item => (
                <button 
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`flex flex-col items-center justify-center text-xs p-2 w-full transition-colors ${
                        activeView === item.view ? 'text-cyan-400 bg-gray-900' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    <Icon icon={item.icon} className="w-6 h-6 mb-1" />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
