import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CalendarPanel() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
            const isToday = 
                d === new Date().getDate() && 
                month === new Date().getMonth() && 
                year === new Date().getFullYear();
            
            const isSelected = 
                d === selectedDate.getDate() && 
                month === selectedDate.getMonth() && 
                year === selectedDate.getFullYear();

            days.push(
                <button
                    key={d}
                    onClick={() => setSelectedDate(new Date(year, month, d))}
                    className={`flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors hover:bg-accent ${
                        isSelected ? 'bg-[#024495] text-white hover:bg-[#024495]/90' : isToday ? 'border border-[#024495] text-[#024495]' : ''
                    }`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h4>
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

            {/* Special Dates Info */}
            <div className="mt-2 space-y-2">
                <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Today's Schedule</h5>
                <div className="rounded-lg bg-accent/50 p-2 text-xs border-l-2 border-[#024495]">
                    <p className="font-medium">Faculty Meeting</p>
                    <p className="text-[10px] text-muted-foreground">2:00 PM - 3:30 PM · Library Hall</p>
                </div>
            </div>
        </div>
    );
}
