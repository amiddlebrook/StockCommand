
import React, { useState } from 'react';
import { Icon } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, X } from 'lucide-react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, login, register, logout, loginWithGoogle } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'payment'>('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Auth State
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    if (!isOpen) return null;

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setIsLoading(true);
        try {
            if (isLoginView) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            // User state updates automatically via context
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Add priceId here if multiple plans
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err: any) {
            alert("Subscription failed: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Unauthenticated View
    if (!user) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-semibold text-white">
                                {isLoginView ? 'Welcome Back' : 'Join StockCommand'}
                            </h2>
                            <p className="text-zinc-400 text-sm mt-2">
                                {isLoginView ? 'Sign in to access your dashboard' : 'Create an account to track your portfolio'}
                            </p>
                        </div>

                        {authError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded">
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded focus:outline-none focus:border-cyan-500 text-zinc-100"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded focus:outline-none focus:border-cyan-500 text-zinc-100"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <div className="mt-6 relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900 text-slate-500">Or continue with</span></div>
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black font-medium rounded hover:bg-slate-200 transition-colors">
                                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.01 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                Google
                            </button>
                        </div>

                        <div className="mt-6 text-center text-sm text-zinc-400">
                            {isLoginView ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setIsLoginView(!isLoginView)} className="text-cyan-400 hover:text-cyan-300 font-medium">
                                {isLoginView ? 'Sign up' : 'Log in'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated View
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
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
                        Account
                    </button>
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'payment' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:bg-slate-800/50'}`}
                    >
                        Subscription
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{user.name || 'Trader'}</h3>
                                    <p className="text-gray-400">{user.email}</p>
                                    <p className="text-xs text-cyan-500 mt-1">Free Plan (Upgrade for Pro)</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <button onClick={() => { logout(); onClose(); }} className="px-4 py-2 border border-red-900/50 text-red-500 hover:bg-red-900/20 rounded transition-colors text-sm font-bold">
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <h3 className="text-white font-bold mb-2">Account ID</h3>
                                <p className="font-mono text-gray-400 text-sm">{user.id}</p>
                            </div>
                            <p className="text-sm text-gray-500">More account settings coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 bg-amber-500/20 text-amber-500 text-xs font-bold rounded-bl-xl">PRO</div>
                                <h4 className="text-lg font-bold text-white mb-1">StockCommand Pro</h4>
                                <p className="text-gray-400 text-sm mb-4">$49.99 / month</p>
                                <ul className="space-y-2 mb-6">
                                    <li className="text-sm text-gray-300 flex gap-2"><Icon icon="check" className="w-4 h-4 text-cyan-400" /> Unlimited AI Scans</li>
                                    <li className="text-sm text-gray-300 flex gap-2"><Icon icon="check" className="w-4 h-4 text-cyan-400" /> Real-time Market Clock Data</li>
                                    <li className="text-sm text-gray-300 flex gap-2"><Icon icon="check" className="w-4 h-4 text-cyan-400" /> Advanced Portfolio Analysis</li>
                                </ul>

                                <button
                                    onClick={handleSubscribe}
                                    disabled={isLoading}
                                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded shadow-lg shadow-orange-900/20 transition-all"
                                >
                                    {isLoading ? 'Redirecting to Stripe...' : 'Upgrade Now'}
                                </button>
                            </div>
                            <p className="text-xs text-center text-gray-500">Secure payments via Stripe. Cancel anytime.</p>
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
