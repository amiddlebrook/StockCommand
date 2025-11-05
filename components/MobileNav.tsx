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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-slate-800/50 backdrop-blur-lg flex justify-around items-center z-50 shadow-2xl">
            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`relative flex flex-col items-center justify-center text-xs py-3 w-full transition-all ${
                        activeView === item.view ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {activeView === item.view && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-12 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
                    )}
                    <Icon icon={item.icon} className={`w-6 h-6 mb-1 transition-transform ${activeView === item.view ? 'scale-110' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
