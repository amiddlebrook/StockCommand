import React, { useState, useEffect, useRef } from 'react';

interface ActivityEvent {
    id: string;
    timestamp: Date;
    type: 'ALERT' | 'INFO' | 'SUCCESS' | 'SIGNAL' | 'SYSTEM';
    message: string;
}

interface ActivityFeedProps {
    maxEvents?: number;
    autoScroll?: boolean;
}

// Simulated market events for demo
const EVENT_TEMPLATES = [
    { type: 'SIGNAL' as const, messages: ['Bullish divergence detected on SPY', 'RSI oversold condition on QQQ', 'MACD crossover on AAPL'] },
    { type: 'ALERT' as const, messages: ['VIX spike above 20', 'Unusual volume on TSLA', 'Earnings beat: NVDA +5%'] },
    { type: 'INFO' as const, messages: ['Market open in 30 min', 'Fed meeting scheduled', 'Options expiry Friday'] },
    { type: 'SUCCESS' as const, messages: ['Strategy deployed successfully', 'Portfolio rebalanced', 'Order filled: MSFT'] },
    { type: 'SYSTEM' as const, messages: ['Scanning 500 tickers...', 'Data sync complete', 'Regime analysis updated'] },
];

const TYPE_COLORS = {
    ALERT: { border: 'border-l-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
    INFO: { border: 'border-l-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    SUCCESS: { border: 'border-l-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
    SIGNAL: { border: 'border-l-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    SYSTEM: { border: 'border-l-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10' },
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    maxEvents = 30,
    autoScroll = true
}) => {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const feedRef = useRef<HTMLDivElement>(null);
    const eventIdRef = useRef(0);

    // Generate initial events
    useEffect(() => {
        const initialEvents: ActivityEvent[] = [];
        for (let i = 0; i < 8; i++) {
            const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
            const message = template.messages[Math.floor(Math.random() * template.messages.length)];
            initialEvents.push({
                id: `event-${eventIdRef.current++}`,
                timestamp: new Date(Date.now() - (8 - i) * 5000),
                type: template.type,
                message
            });
        }
        setEvents(initialEvents);
    }, []);

    // Simulate new events arriving
    useEffect(() => {
        const interval = setInterval(() => {
            const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
            const message = template.messages[Math.floor(Math.random() * template.messages.length)];

            setEvents(prev => {
                const newEvents = [...prev, {
                    id: `event-${eventIdRef.current++}`,
                    timestamp: new Date(),
                    type: template.type,
                    message
                }];
                // Trim to max events
                return newEvents.slice(-maxEvents);
            });
        }, 4000 + Math.random() * 3000); // Random interval 4-7s

        return () => clearInterval(interval);
    }, [maxEvents]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [events, autoScroll]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="glass-panel hud-brackets rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-xs text-cyan-400 font-medium tracking-wider">ACTIVITY FEED</span>
                </div>
                <span className="text-xs text-slate-500">{events.length} events</span>
            </div>

            <div
                ref={feedRef}
                className="h-64 overflow-y-auto scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
            >
                {events.map((event, index) => {
                    const colors = TYPE_COLORS[event.type];
                    const isNew = index === events.length - 1;

                    return (
                        <div
                            key={event.id}
                            className={`
                px-3 py-2 border-l-2 ${colors.border}
                ${isNew ? 'animate-fadeIn' : ''}
                hover:bg-slate-800/50 transition-colors
              `}
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-slate-500 font-mono shrink-0">
                                    [{formatTime(event.timestamp)}]
                                </span>
                                <span className={`text-xs font-medium shrink-0 ${colors.text}`}>
                                    {event.type}:
                                </span>
                                <span className="text-xs text-slate-300 leading-relaxed">
                                    {event.message}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Streaming live market events</span>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400">CONNECTED</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
