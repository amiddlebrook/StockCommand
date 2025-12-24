import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface CalendarEvent {
    date: string;
    time: string;
    type: 'fed' | 'earnings' | 'economic';
    title: string;
    impact: 'high' | 'medium' | 'low';
}

interface CalendarViewProps { }

export const CalendarView: React.FC<CalendarViewProps> = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/calendar');
                if (res.ok) {
                    const data = await res.json() as CalendarEvent[];
                    setEvents(Array.isArray(data) ? data : []);
                } else {
                    setEvents([]);
                }
            } catch (e) {
                console.warn('Calendar fetch error:', e);
                setEvents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'fed': return 'building';
            case 'earnings': return 'chart';
            case 'economic': return 'activity';
            default: return 'calendar';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'fed': return 'text-purple-400 bg-purple-900/30 border-purple-500/30';
            case 'earnings': return 'text-cyan-400 bg-cyan-900/30 border-cyan-500/30';
            case 'economic': return 'text-amber-400 bg-amber-900/30 border-amber-500/30';
            default: return 'text-slate-400 bg-slate-900/30 border-slate-500/30';
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-amber-400';
            case 'low': return 'text-green-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon icon="calendar" className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold tracking-wide">ECONOMIC CALENDAR</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm rounded-lg transition-colors">
                        This Week
                    </button>
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm rounded-lg transition-colors">
                        This Month
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="text-slate-400">Fed/Central Bank</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                    <span className="text-slate-400">Earnings</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-400">Economic Data</span>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm text-slate-400 font-mono">Loading calendar events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Icon icon="calendar" className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">No Upcoming Events</h3>
                        <p className="text-sm text-slate-500">Economic calendar events will appear here when available</p>
                    </div>
                ) : (
                    events.map((event, idx) => (
                        <div key={idx} className={`p-4 border rounded-lg ${getTypeColor(event.type)} transition-all hover:scale-[1.01]`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase">{event.date.split(' ')[0]}</div>
                                        <div className="text-lg font-bold">{event.date.split(' ')[1]}</div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-700"></div>
                                    <div>
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-sm text-slate-400">{event.time} ET</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs uppercase font-mono ${getImpactColor(event.impact)}`}>
                                        {event.impact} impact
                                    </span>
                                    <Icon icon={getTypeIcon(event.type) as any} className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
