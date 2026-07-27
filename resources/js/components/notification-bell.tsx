import { Bell, Mail, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationBell({ className }: { className?: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) {
            // Ignore fetch error
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 8000);
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            await fetch('/api/notifications/mark-as-read', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                },
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (e) {
            // Ignore error
        }
    };

    const handleNotificationClick = (item: any) => {
        if (item.link) {
            router.visit(item.link);
        }
    };

    const hasUnread = unreadCount > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="relative cursor-pointer focus:outline-none">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full transition-colors",
                            className ? className : "text-white hover:bg-white/20",
                            hasUnread && "animate-bell-swing"
                        )}
                    >
                        <Bell className="size-4" />
                    </Button>
                    {hasUnread && (
                        <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 text-[8px] font-bold text-white items-center justify-center"></span>
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0 mr-4 mt-2 bg-white dark:bg-slate-900 shadow-xl border-border rounded-xl overflow-hidden z-[100]" align="end">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-slate-800/50">
                    <DropdownMenuLabel className="font-bold text-base text-gray-900 dark:text-gray-100 p-0">
                        Notifications
                    </DropdownMenuLabel>
                    {hasUnread && (
                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {unreadCount} NEW
                        </span>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                        notifications.map((item) => (
                            <DropdownMenuItem
                                key={item.id}
                                onClick={() => handleNotificationClick(item)}
                                className={cn(
                                    "flex items-start px-4 py-3 gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b last:border-0 border-border/40",
                                    !item.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                                )}
                            >
                                <div className="mt-0.5 p-1.5 rounded-full bg-[#024495]/10 text-[#024495] shrink-0">
                                    {item.type === 'email' ? <Mail className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex w-full items-center justify-between gap-1">
                                        <span className={cn("font-semibold text-xs text-gray-900 dark:text-gray-100 truncate", !item.is_read && "font-bold text-[#024495]")}>
                                            {item.title}
                                        </span>
                                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">{item.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-0.5">
                                        {item.message}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Bell className="size-10 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All caught up!</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">No notifications at the moment.</p>
                        </div>
                    )}
                </div>
                {hasUnread && (
                    <>
                        <DropdownMenuSeparator className="m-0" />
                        <div className="px-4 py-2 bg-gray-50/50 dark:bg-slate-800/50">
                            <Button
                                variant="link"
                                onClick={markAllAsRead}
                                className="w-full text-xs text-[#024495] hover:text-[#024495]/80 font-semibold p-0 h-auto"
                            >
                                Mark all as read
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
