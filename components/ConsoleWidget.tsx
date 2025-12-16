import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType } from '../types';
import { Icon } from './Icon';

interface ConsoleWidgetProps {
    messages: ChatMessageType[];
    onSendMessage: (message: string, image?: File) => void;
    isLoading: boolean;
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
}

export const ConsoleWidget: React.FC<ConsoleWidgetProps> = ({
    messages,
    onSendMessage,
    isLoading,
    isRecording,
    onStartRecording,
    onStopRecording
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of console
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="hud-panel w-full h-full flex flex-col rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Icon icon="terminal" className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Console // Uplink</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    SECURE_CONN_EST
                </div>
            </div>

            {/* Terminal Output */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-black/20"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className={`group ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block max-w-[85%] ${msg.role === 'user'
                                ? 'text-cyan-100'
                                : 'text-slate-300'
                            }`}>
                            <div className="text-[10px] text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {msg.role === 'user' ? '>> CMD_IN' : '>> SYS_OUT'}
                            </div>
                            <div className={`p-2 border-l-2 ${msg.role === 'user'
                                    ? 'border-cyan-500 bg-cyan-900/10'
                                    : 'border-slate-600 bg-slate-800/10'
                                }`}>
                                {msg.content || (msg.isLoading ? <span className="animate-pulse">...</span> : '')}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="text-left">
                        <span className="text-cyan-500 text-xs animate-pulse">_ PROCESSING REQUEST...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-900/50">
                <ChatInput
                    onSend={onSendMessage}
                    isLoading={isLoading}
                    isRecording={isRecording}
                    onStartRecording={onStartRecording}
                    onStopRecording={onStopRecording}
                // Overriding styles via parent class if needed, or we might need to modify ChatInput to accept className
                // For now, wrapping or accepting default styles.
                />
            </div>
        </div>
    );
};
