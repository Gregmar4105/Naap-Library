import { ChevronLeft, ChevronRight, Loader2, Trash2, Clock, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Holiday {
    date: string;
    localName: string;
    name: string;
}

interface CalendarNote {
    id: number;
    date: string;
    time: string | null;
    note: string;
}

const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export function CalendarPanel() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newNoteTime, setNewNoteTime] = useState('');
    const [newNoteText, setNewNoteText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1));
    };

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/calendar-notes');
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("Failed to fetch notes", error);
        }
    };

    // Fetch Holidays and Notes
    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const year = currentDate.getFullYear();
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
                if (res.ok) {
                    const data = await res.json();
                    setHolidays(data);
                }
            } catch (error) {
                console.error("Failed to fetch holidays", error);
            }
        };

        fetchHolidays();
        fetchNotes();
    }, [currentDate.getFullYear()]); // Refetch when year changes

    const getFormattedDateStr = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const handleDayClick = (year: number, month: number, day: number) => {
        const clickedDate = new Date(year, month, day);
        setSelectedDate(clickedDate);
        setNewNoteTime('');
        setNewNoteText('');
        setIsModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!selectedDate || !newNoteText.trim()) return;
        setIsSaving(true);
        
        const dateStr = getFormattedDateStr(selectedDate);
        
        try {
            const res = await fetch('/api/calendar-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    date: dateStr,
                    time: newNoteTime || null,
                    note: newNoteText
                })
            });

            if (res.ok) {
                await fetchNotes();
                setNewNoteTime('');
                setNewNoteText('');
            }
        } catch (error) {
            console.error("Failed to save note", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = async (id: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        setIsDeleting(id);
        try {
            // Using POST with _method spoofing for maximum compatibility
            const res = await fetch(`/api/calendar-notes/${id}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                body: JSON.stringify({
                    _method: 'DELETE'
                })
            });

            if (res.ok) {
                await fetchNotes();
            } else {
                const errorData = await res.json();
                console.error("Delete failed server-side:", errorData);
            }
        } catch (error) {
            console.error("Failed to delete note", error);
        } finally {
            setIsDeleting(null);
        }
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days = [];

        // Padding for the first week
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-full" />);
        }

        for (let d = 1; d <= totalDays; d++) {
            const loopDate = new Date(year, month, d);
            const dateStr = getFormattedDateStr(loopDate);
            
            const isToday = 
                d === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear();
            
            const hasHoliday = holidays.some(h => h.date === dateStr);
            const hasNote = notes.some(n => n.date.startsWith(dateStr));

            days.push(
                <button
                    key={d}
                    onClick={() => handleDayClick(year, month, d)}
                    className={`relative flex h-8 w-8 mx-auto items-center justify-center rounded-full text-xs transition-colors hover:bg-accent ${
                        hasNote ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 
                        isToday ? 'border border-[#024495] text-[#024495]' : ''
                    }`}
                >
                    {d}
                    {hasHoliday && (
                        <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </button>
            );
        }
        return days;
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 10; i++) {
            years.push(i);
        }
        return years;
    };

    const getHolidayForDate = (date: Date) => {
        const dateStr = getFormattedDateStr(date);
        return holidays.find(h => h.date === dateStr);
    };

    const getNotesForDate = (date: Date) => {
        const dateStr = getFormattedDateStr(date);
        return notes.filter(n => n.date.startsWith(dateStr)).sort((a, b) => {
            if (!a.time) return -1;
            if (!b.time) return 1;
            return a.time.localeCompare(b.time);
        });
    };

    const todayDate = new Date();
    const todayHoliday = getHolidayForDate(todayDate);
    const todayNotes = getNotesForDate(todayDate);

    return (
        <div className="space-y-4 p-4">
            {/* Header: Jump Year / Month */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <select 
                        value={currentDate.getMonth()} 
                        onChange={handleMonthChange}
                        className="text-sm font-semibold bg-transparent outline-none cursor-pointer hover:bg-accent rounded px-1"
                    >
                        {monthNames.map((m, idx) => (
                            <option key={m} value={idx}>{m}</option>
                        ))}
                    </select>
                    <select 
                        value={currentDate.getFullYear()} 
                        onChange={handleYearChange}
                        className="text-sm font-semibold bg-transparent outline-none cursor-pointer hover:bg-accent rounded px-1"
                    >
                        {generateYearOptions().map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            {/* Note/Holiday Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Manage announcements and events for this date.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {selectedDate && getHolidayForDate(selectedDate) && (
                            <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-400 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Public Holiday</span>
                                <span className="text-sm font-semibold text-yellow-900">{getHolidayForDate(selectedDate)?.name}</span>
                                {getHolidayForDate(selectedDate)?.localName !== getHolidayForDate(selectedDate)?.name && (
                                    <span className="text-xs text-yellow-700 italic">{getHolidayForDate(selectedDate)?.localName}</span>
                                )}
                            </div>
                        )}

                        {/* Existing Notes List */}
                        {selectedDate && getNotesForDate(selectedDate).length > 0 && (
                            <div className="flex flex-col gap-2 mb-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b pb-1">Saved Notes</h4>
                                {getNotesForDate(selectedDate).map(note => (
                                    <div key={note.id} className="flex flex-col bg-slate-50 border rounded-lg p-3 relative group">
                                        {note.time && (
                                            <span className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(note.time)}
                                            </span>
                                        )}
                                        <p className="text-sm text-slate-800 whitespace-pre-wrap pr-6">{note.note}</p>
                                        <button 
                                            onClick={() => handleDeleteNote(note.id)}
                                            disabled={isDeleting === note.id}
                                            className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                                            title="Delete note"
                                        >
                                            {isDeleting === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Note Form */}
                        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-[#024495] uppercase tracking-wider">Add New Note</h4>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="time" 
                                        value={newNoteTime}
                                        onChange={(e) => setNewNoteTime(e.target.value)}
                                        className="border rounded text-sm px-2 py-1 outline-none focus:border-[#024495] focus:ring-1 focus:ring-[#024495] bg-transparent"
                                    />
                                </div>
                            </div>
                            
                            <Textarea 
                                placeholder="Write announcement details here..."
                                className="min-h-[80px] resize-none focus-visible:ring-1 focus-visible:ring-[#024495] focus-visible:ring-offset-0"
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                            />
                            
                            <Button 
                                className="w-full bg-[#024495] hover:bg-[#013575] text-white mt-1" 
                                onClick={handleSaveNote}
                                disabled={isSaving || !newNoteText.trim()}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Note
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
