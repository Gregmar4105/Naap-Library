import { Megaphone, MessageSquare, Info, CalendarDays, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function AnnouncementsPanel() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const year = new Date().getFullYear();
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
                if (res.ok) setHolidays(await res.json());
            } catch (error) {}
        };
        const fetchNotes = async () => {
            try {
                const res = await fetch('/api/calendar-notes');
                if (res.ok) setNotes(await res.json());
            } catch (error) {}
        };
        fetchHolidays();
        fetchNotes();
        
        const interval = setInterval(fetchNotes, 5000);
        return () => clearInterval(interval);
    }, []);

    const getFormattedDateStr = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const todayDateStr = getFormattedDateStr(todayDate);
    
    const twoWeeksFromNow = new Date(todayDate);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const twoWeeksFromNowStr = getFormattedDateStr(twoWeeksFromNow);

    // Today's Notes for "Today's Schedule"
    const todayNotes = notes.filter(n => n.date.startsWith(todayDateStr)).sort((a, b) => {
        if (!a.time) return -1;
        if (!b.time) return 1;
        return a.time.localeCompare(b.time);
    });

    // Upcoming Holidays for "General Bulletins" (Next 2 weeks)
    const upcomingHolidays = holidays.filter(h => h.date >= todayDateStr && h.date <= twoWeeksFromNowStr).sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div className="space-y-4 p-4">
            
            {/* Calendar Driven Today's Announcements */}
            {todayNotes.length > 0 && (
                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <CalendarDays className="h-4 w-4 text-[#024495]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#024495]">Today's Schedule</h4>
                    </div>

                    {todayNotes.map(note => (
                        <div
                            key={`note-${note.id}`}
                            className="group relative flex flex-col gap-1 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:bg-accent/50"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#024495]" />
                                    <h4 className="text-sm font-semibold">Scheduled Event</h4>
                                </div>
                                {note.time && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#024495] whitespace-nowrap bg-blue-50 px-1.5 py-0.5 rounded">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(note.time)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {note.note}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                    Calendar
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* General System Announcements */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Bulletins</h4>
                </div>
                
                {upcomingHolidays.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No upcoming holidays scheduled.</p>
                ) : (
                    upcomingHolidays.map((holiday) => {
                        const displayDate = new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        
                        return (
                            <div
                                key={holiday.date}
                                className="group relative flex flex-col gap-1 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:bg-accent/50"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-amber-500" />
                                        <h4 className="text-sm font-semibold">{holiday.name}</h4>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {displayDate}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {holiday.localName !== holiday.name ? holiday.localName : 'National Public Holiday'}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                        Holiday
                                    </Badge>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
