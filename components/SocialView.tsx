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

interface Message {
    id: string;
    user: string;
    content: string;
    timestamp: number;
    role?: 'admin' | 'mod' | 'user';
}

interface SocialViewProps {
    // Messages come from agent analysis or user input, passed via props
    recentMessages?: Message[];
}

export const SocialView: React.FC<SocialViewProps> = ({ recentMessages = [] }) => {
    const [activeChannel, setActiveChannel] = useState('global-trade');

    // Static channels (navigation items)
    const channels: Channel[] = [
        { id: 'leaderboard', name: 'Global Rankings', type: 'app' },
        { id: 'competitions', name: 'Competitions', type: 'app' },
        { id: 'strategy-registry', name: 'Strategy Registry', type: 'app' },
        { id: 'global-trade', name: 'global-trade', type: 'text' },
        { id: 'alpha-leaks', name: 'alpha-leaks', type: 'text' },
    ];

    const [messages, setMessages] = useState<Message[]>(recentMessages);
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
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon icon="message-circle" className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No messages yet</p>
                            <p className="text-xs text-slate-600 mt-1">Start a conversation</p>
                        </div>
                    ) : (
                        messages.map(msg => (
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
                        ))
                    )}
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
                        <button onClick={handleSend} className="text-slate-400 hover:text-white">
                            <Icon icon="send" className="w-5 h-5" />
                        </button>
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
                        <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">CHANNELS</h3>
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
                </div>

                <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center">
                        <Icon icon="user" className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">Guest</div>
                        <div className="text-[10px] text-slate-500 truncate">Local Mode</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {renderMainContent()}
        </div>
    );
};
