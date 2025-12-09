import React, { useState } from 'react';
import { Icon } from './Icon';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'payment'>('profile');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:bg-slate-800/50'}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'account' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:bg-slate-800/50'}`}
                    >
                        Account & PortfolioLink
                    </button>
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'payment' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:bg-slate-800/50'}`}
                    >
                        Billing & Payments
                    </button>
                </div>

                <div className="p-8 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                                    AM
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Avery Middlebrook</h3>
                                    <p className="text-gray-400">Pro Trader • Level 4 Access</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <input type="email" value="avery@example.com" disabled className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-gray-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                                    <input type="tel" value="+1 (555) 000-0000" disabled className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-gray-300" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                                <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                    <Icon icon="chart" className="w-4 h-4" />
                                    Active Portfolio Link
                                </h4>
                                <p className="text-gray-400 text-sm mb-4">Your account is connected to the primary data feed.</p>

                                <div className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
                                    <span className="font-mono text-gray-300">ID: PF-8829-XJ</span>
                                    <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">CONNECTED</span>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all">
                                Import Data from Brokerage
                            </button>
                            <button className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all">
                                Export Transaction History (CSV)
                            </button>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 bg-amber-500/20 text-amber-500 text-xs font-bold rounded-bl-xl">PRO PLAN</div>
                                <h4 className="text-lg font-bold text-white mb-1">StockCommand Pro</h4>
                                <p className="text-gray-400 text-sm mb-4">$49.99 / month</p>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Icon icon="check" className="w-4 h-4 text-emerald-400" /> Next billing date: Jan 14, 2026
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</label>
                                <div className="flex items-center gap-3 p-3 border border-slate-700 rounded-lg bg-slate-800/40">
                                    <div className="w-10 h-6 bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">VISA</div>
                                    <span className="font-mono text-sm text-gray-300">•••• 4242</span>
                                    <button className="ml-auto text-xs text-cyan-400 hover:underline">Edit</button>
                                </div>
                                <button className="w-full py-3 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg transition-all flex items-center justify-center gap-2">
                                    <Icon icon="message" className="w-4 h-4" /> Add New Card
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
