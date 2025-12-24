import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

// Types for notifications and messages
export interface AgentNotification {
    id: string;
    type: 'alert' | 'processed' | 'insight' | 'warning';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actionTarget?: string; // Symbol, clock code, or view to navigate to
}

export interface AgentMessage {
    id: string;
    from: 'quant' | 'sentinel' | 'macro' | 'optimizer' | 'system';
    subject: string;
    preview: string;
    content: string;
    timestamp: number;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
}

interface NotificationCenterProps {
    notifications: AgentNotification[];
    messages: AgentMessage[];
    onNotificationClick: (notification: AgentNotification) => void;
    onMessageClick: (message: AgentMessage) => void;
    onClearNotifications: () => void;
    onClearMessages: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    messages,
    onNotificationClick,
    onMessageClick,
    onClearNotifications,
    onClearMessages
}) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);

    const unreadNotifications = notifications.filter(n => !n.read).length;
    const unreadMessages = messages.filter(m => !m.read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.notification-center')) {
                setIsNotificationsOpen(false);
                setIsMessagesOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const getNotificationIcon = (type: AgentNotification['type']) => {
        switch (type) {
            case 'alert': return '⚡';
            case 'processed': return '✅';
            case 'insight': return '💡';
            case 'warning': return '⚠️';
        }
    };

    const getAgentColor = (from: AgentMessage['from']) => {
        switch (from) {
            case 'quant': return 'text-cyan-400';
            case 'sentinel': return 'text-orange-400';
            case 'macro': return 'text-purple-400';
            case 'optimizer': return 'text-emerald-400';
            case 'system': return 'text-gray-400';
        }
    };

    return (
        <div className="notification-center flex items-center gap-2">
            {/* Notifications Bell */}
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setIsMessagesOpen(false);
                    }}
                    className="relative p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all group"
                    title="Notifications"
                >
                    <Icon icon="bell" className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                    )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                    <div className="absolute right-0 top-12 w-80 max-h-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                            <h3 className="font-semibold text-sm text-white">Notifications</h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={onClearNotifications}
                                    className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="overflow-y-auto max-h-72">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No notifications
                                </div>
                            ) : (
                                notifications.slice(0, 10).map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => onNotificationClick(notification)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800 ${!notification.read ? 'bg-slate-800/30' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                                                        {notification.title}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-1">{notification.message}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Mailbox */}
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMessagesOpen(!isMessagesOpen);
                        setIsNotificationsOpen(false);
                    }}
                    className="relative p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all group"
                    title="Agent Messages"
                >
                    <Icon icon="mail" className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                    )}
                </button>

                {/* Messages Dropdown */}
                {isMessagesOpen && (
                    <div className="absolute right-0 top-12 w-96 max-h-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                            <h3 className="font-semibold text-sm text-white">Agent Messages</h3>
                            {messages.length > 0 && (
                                <button
                                    onClick={onClearMessages}
                                    className="text-xs text-gray-400 hover:text-purple-400 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="overflow-y-auto max-h-72">
                            {messages.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No messages from agents
                                </div>
                            ) : (
                                messages.slice(0, 10).map(message => (
                                    <button
                                        key={message.id}
                                        onClick={() => onMessageClick(message)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800 ${!message.read ? 'bg-slate-800/30' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold ${getAgentColor(message.from)}`}>
                                                {message.from.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-medium ${message.read ? 'text-gray-400' : 'text-white'}`}>
                                                        {message.subject}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-1">{message.preview}</p>
                                                {message.priority === 'high' && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                                                        High Priority
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
