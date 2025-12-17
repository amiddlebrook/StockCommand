import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

export const SettingsView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'GENERAL' | 'API' | 'NOTIFICATIONS' | 'APPEARANCE'>('GENERAL');

    // Mock State for Settings
    const [settings, setSettings] = useState({
        appName: 'STOCK_COMMAND // V2.2',
        timezone: 'UTC-5 (EST)',
        retroMode: true,
        highContrast: false,
        notifications: {
            priceAlerts: true,
            newsFlashes: true,
            strategySignals: false
        },
        apiKeys: {
            gemini: '**********************',
            fmp: '**********************',
            polygon: '**********************'
        }
    });

    const toggleNotification = (key: keyof typeof settings.notifications) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
        }));
    };

    return (
        <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

            {/* Header */}
            <div className="p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur z-10">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Icon icon="settings" className="text-slate-400 w-8 h-8" />
                    SYSTEM CONFIGURATION
                </h2>
                <p className="text-slate-400 text-sm mt-2 font-mono">Global Parameters & secure connection settings</p>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-64 border-b md:border-r md:order-b-0 border-slate-800 bg-slate-900/30 p-2 md:p-4 flex md:flex-col gap-2 md:gap-0 md:space-y-2 overflow-x-auto md:overflow-visible shrink-0 no-scrollbar">
                    {['GENERAL', 'API', 'NOTIFICATIONS', 'APPEARANCE'].map((section: any) => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`
                                whitespace-nowrap px-4 py-2 md:py-3 rounded-lg font-bold text-xs md:text-sm transition-all md:w-full md:text-left
                                ${activeSection === section
                                    ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'}
                            `}
                        >
                            {section}
                        </button>
                    ))}

                    <div className="md:pt-8 md:mt-8 md:border-t md:border-slate-800 ml-auto md:ml-0 pl-4 md:pl-0 border-l md:border-l-0 border-slate-800 md:w-full">
                        <button className="md:w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-2 whitespace-nowrap">
                            <Icon icon="trash" className="w-3 h-3" />
                            <span className="hidden md:inline">RESET ALL DATA</span>
                            <span className="md:hidden">RESET</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl">

                    {activeSection === 'GENERAL' && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-400">APPLICATION NAME</label>
                                <input
                                    type="text"
                                    value={settings.appName}
                                    readOnly
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-200 font-mono focus:border-cyan-500 outline-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-400">DEFAULT TIMEZONE</label>
                                <select className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-200 font-mono focus:border-cyan-500 outline-none">
                                    <option>UTC-5 (EST)</option>
                                    <option>UTC-8 (PST)</option>
                                    <option>UTC (GMT)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeSection === 'API' && (
                        <div className="space-y-8">
                            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-start gap-3">
                                <Icon icon="alert" className="text-amber-500 w-5 h-5 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-amber-500 text-sm">SECURE STORAGE</h4>
                                    <p className="text-amber-400/80 text-xs mt-1">Keys are stored locally in your browser's secure storage. They are never transmitted to our servers.</p>
                                </div>
                            </div>

                            {['gemini', 'fmp', 'polygon'].map(provider => (
                                <div key={provider} className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-400 uppercase">{provider} API KEY</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={settings.apiKeys[provider as keyof typeof settings.apiKeys]}
                                            readOnly
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 text-slate-200 font-mono tracking-widest focus:border-cyan-500 outline-none"
                                        />
                                        <GlassButton variant="glass" className="w-24">EDIT</GlassButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeSection === 'NOTIFICATIONS' && (
                        <div className="space-y-6">
                            {Object.entries(settings.notifications).map(([key, enabled]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                                    <div>
                                        <h4 className="font-bold text-slate-200 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                        <p className="text-xs text-slate-500 mt-1">Receive alerts via system tray</p>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification(key as any)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-cyan-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeSection === 'APPEARANCE' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-slate-200">RETRO CRT EFFECTS</h4>
                                    <p className="text-xs text-slate-500 mt-1">Simulate scanlines and chromatic aberration</p>
                                </div>
                                <button className="w-12 h-6 rounded-full relative bg-cyan-600">
                                    <div className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
