import React, { useState } from 'react';
import { Icon } from './Icon';
import { GlassButton } from './ui/GlassButton';

import { Leaderboard } from './social/Leaderboard';
import { CompetitionsList } from './social/CompetitionsList';
import { StrategyRegistry } from './social/StrategyRegistry';

interface Channel {
    id: string;
    name: string;
    type: 'text' | 'voice' | 'app';
    unread?: number;
}

interface User {
    id: string;
    name: string;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    avatar?: string;
}

interface Message {
    id: string;
    user: string;
    content: string;
    timestamp: number;
    role?: 'admin' | 'mod' | 'user';
}

export const SocialView: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState('global-trade');
    const [channels] = useState<Channel[]>([
        { id: 'leaderboard', name: 'Global Rankings', type: 'app' },
        { id: 'competitions', name: 'Competitions', type: 'app', unread: 3 },
        { id: 'strategy-registry', name: 'Strategy Registry', type: 'app' },
        { id: 'global-trade', name: 'global-trade', type: 'text' },
        { id: 'alpha-leaks', name: 'alpha-leaks', type: 'text', unread: 12 },
        { id: 'voice-general', name: 'General Voice', type: 'voice' }
    ]);

    const [friends] = useState<User[]>([
        { id: 'u1', name: 'Quant_Wizard', status: 'online' },
        { id: 'u2', name: 'Macro_Guru', status: 'dnd' },
        { id: 'u3', name: 'HedgeFundKilla', status: 'idle' },
        { id: 'u4', name: 'Alice_Algo', status: 'offline' }
    ]);

    const [messages, setMessages] = useState<Message[]>([
        { id: 'm1', user: 'Quant_Wizard', content: 'Anyone seeing the VIX divergence on the 5m?', timestamp: Date.now() - 1000 * 60 * 5, role: 'user' },
        { id: 'm2', user: 'Macro_Guru', content: 'Yeah, liquidity flush incoming. Positioning for a drop.', timestamp: Date.now() - 1000 * 60 * 2, role: 'mod' },
        { id: 'm3', user: 'System', content: 'COMPETITION ALERT: "Yield Curve Control" starts in 10 mins.', timestamp: Date.now(), role: 'admin' }
    ]);

    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, {
            id: Date.now().toString(),
            user: 'You',
            content: input,
            timestamp: Date.now(),
            role: 'user'
        }]);
        setInput('');
    };

    // Render Logic
    const renderMainContent = () => {
        if (activeChannel === 'leaderboard') return <Leaderboard />;
        if (activeChannel === 'competitions') return <CompetitionsList />;
        if (activeChannel === 'strategy-registry') return <StrategyRegistry />;


        // Default Chat View
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-900/30">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="group flex gap-4 hover:bg-slate-900/40 p-2 -mx-2 rounded transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-700 mt-1">
                                {msg.role === 'admin' ? (
                                    <Icon icon="bot" className="w-5 h-5 text-red-500" />
                                ) : (
                                    <span className="text-xs font-bold text-slate-400">{msg.user.substr(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className={`font-bold hover:underline cursor-pointer ${msg.role === 'admin' ? 'text-red-500' :
                                        msg.role === 'mod' ? 'text-green-400' : 'text-cyan-400'
                                        }`}>
                                        {msg.user}
                                    </span>
                                    {msg.role && msg.role !== 'user' && (
                                        <span className="bg-slate-800 text-[10px] px-1 rounded uppercase text-slate-400 font-bold">{msg.role}</span>
                                    )}
                                    <span className="text-[10px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-300 text-sm mt-0.5 leading-relaxed break-words">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="bg-slate-800/50 rounded-lg p-2 flex items-center gap-3 border border-slate-700 focus-within:border-cyan-500/50 transition-colors">
                        <button className="text-slate-400 hover:text-white transition-colors p-1"><Icon icon="plus" className="w-5 h-5" /></button>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Message #${activeChannel}`}
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500"
                        />
                        <div className="flex gap-2 text-slate-400">
                            <Icon icon="mic" className="w-5 h-5 hover:text-white cursor-pointer" />
                            <Icon icon="check" className="w-5 h-5 hover:text-white cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex w-full h-full bg-slate-900 border-t border-slate-800 relative z-10 overflow-hidden">

            {/* LEFT SIDEBAR: CHANNELS */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center shadow-lg bg-slate-900/50">
                    <h2 className="font-bold text-slate-200 tracking-wider">NET_COMMS</h2>
                    <Icon icon="activity" className="text-cyan-500 w-4 h-4" />
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                    {/* CHANNELS */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 flex justify-between group cursor-pointer hover:text-slate-300">
                            CHANNELS <Icon icon="plus" className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </h3>
                        <div className="space-y-0.5">
                            {channels.map(channel => (
                                <div
                                    key={channel.id}
                                    onClick={() => setActiveChannel(channel.id)}
                                    className={`
                                        flex items-center px-2 py-1.5 rounded cursor-pointer group transition-colors
                                        ${activeChannel === channel.id ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                                    `}
                                >
                                    <Icon icon={channel.type === 'voice' ? 'mic' : 'check'} className="w-4 h-4 mr-2 opacity-50" />
                                    <span className="truncate flex-1">{channel.name}</span>
                                    {channel.unread && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">{channel.unread}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DIRECT MESSAGES */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 flex justify-between group cursor-pointer hover:text-slate-300">
                            DIRECT MESSAGES <Icon icon="plus" className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </h3>
                        <div className="space-y-0.5">
                            {friends.map(friend => (
                                <div key={friend.id} className="flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-slate-800/50 group transition-colors">
                                    <div className="relative mr-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                                            {friend.name.substr(0, 2).toUpperCase()}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 
                                            ${friend.status === 'online' ? 'bg-green-500' :
                                                friend.status === 'idle' ? 'bg-amber-500' :
                                                    friend.status === 'dnd' ? 'bg-red-500' : 'bg-slate-500'}`}
                                        />
                                    </div>
                                    <span className={`text-sm group-hover:text-cyan-400 transition-colors ${friend.status === 'offline' ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {friend.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center">
                        <Icon icon="user" className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">Operative_7A</div>
                        <div className="text-[10px] text-slate-500 truncate">#8394 • Online</div>
                    </div>
                    <Icon icon="check" className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            {/* MAIN CONTENT AREA */}
            {renderMainContent()}

            {/* RIGHT SIDEBAR: MEMBER LIST (Optional, Hidden on small screens) */}
            <div className="w-60 bg-slate-950 border-l border-slate-800 hidden xl:flex flex-col p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">ONLINE — {friends.length}</h3>
                <div className="space-y-3">
                    {friends.map(user => (
                        <div key={user.id} className="flex items-center gap-3 opacity-80 hover:opacity-100 cursor-pointer">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-700">
                                    {user.name.substr(0, 2).toUpperCase()}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 
                                            ${user.status === 'online' ? 'bg-green-500' :
                                        user.status === 'idle' ? 'bg-amber-500' :
                                            user.status === 'dnd' ? 'bg-red-500' : 'bg-slate-500'}`}
                                />
                            </div>
                            <div>
                                <div className={`text-sm font-bold ${user.name === 'Admin' ? 'text-red-500' : 'text-slate-300'
                                    }`}>{user.name}</div>
                                <div className="text-[10px] text-slate-500 italic">Playing Market Close</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
