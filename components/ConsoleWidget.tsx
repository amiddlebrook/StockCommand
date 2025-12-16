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
        <div className="h-full w-full flex flex-col bg-slate-950/20">
            {/* Header (Terminal Style) */}
            <div className="flex-none h-8 flex items-center justify-between px-4 bg-slate-900/40 border-b border-cyan-900/30">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-cyan-600 font-mono tracking-widest uppercase">Console_Output</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono">
                    <span className="text-green-500 mr-2">●</span>CONNECTED
                </div>
            </div>

            {/* Terminal Output */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {/* Label */}
                            <div className="text-[9px] text-slate-600 mb-0.5 font-bold uppercase tracking-wide">
                                {msg.role === 'user' ? 'CMD_IN >>' : 'SYS_OUT >>'}
                            </div>
                            {/* Message Block */}
                            <div className={`p-2 border-l-2 ${msg.role === 'user'
                                ? 'border-cyan-500 bg-cyan-900/10 text-cyan-100'
                                : 'border-slate-600 bg-slate-900/40 text-slate-300'
                                }`}>
                                {msg.content || (msg.isLoading ? <span className="animate-pulse">Analyzing...</span> : '')}
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

            {/* Input Area (Flush Bottom) */}
            <div className="p-3 bg-slate-900/30 border-t border-cyan-900/30">
                <ChatInput
                    onSend={onSendMessage}
                    isLoading={isLoading}
                    isRecording={isRecording}
                    onStartRecording={onStartRecording}
                    onStopRecording={onStopRecording}
                />
            </div>
        </div>
    );
};
