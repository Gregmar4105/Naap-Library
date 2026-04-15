import { Megaphone, MessageSquare, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ANNOUNCEMENTS = [
    {
        id: 1,
        title: 'New Library Hours',
        content: 'Starting next week, the library will be open until 10 PM on weekdays.',
        date: '2 hours ago',
        type: 'info',
    },
    {
        id: 2,
        title: 'System Maintenance',
        content: 'The online catalog will be offline for maintenance this Sunday from 2 AM to 6 AM.',
        date: '1 day ago',
        type: 'warning',
    },
    {
        id: 3,
        title: 'New Book Arrivals',
        content: 'Over 500 new titles have been added to the Science and Technology section.',
        date: '3 days ago',
        type: 'success',
    },
];

export function AnnouncementsPanel() {
    return (
        <div className="space-y-4 p-4 h-full overflow-y-auto custom-scrollbar">
            {ANNOUNCEMENTS.map((announcement) => (
                <div
                    key={announcement.id}
                    className="group relative flex flex-col gap-1 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:bg-accent/50"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {announcement.type === 'warning' ? (
                                <Info className="h-4 w-4 text-amber-500" />
                            ) : (
                                <Megaphone className="h-4 w-4 text-[#024495]" />
                            )}
                            <h4 className="text-sm font-semibold">{announcement.title}</h4>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {announcement.date}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {announcement.content}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                            General
                        </Badge>
                        <button className="text-[10px] text-[#024495] font-medium hover:underline flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Read more
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
