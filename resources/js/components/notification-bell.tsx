import { Bell } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
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

interface DbNotification {
    id: string;
    title: string;
    message: string;
    action_url?: string;
    read_at: string | null;
    created_at: string;
}

export function NotificationBell({ className }: { className?: string }) {
    const { auth } = usePage().props as any;
    const notifications: DbNotification[] = auth?.user?.notifications || [];

    const hasUnread = notifications.some((n) => !n.read_at);
    const hasNotifications = notifications.length > 0;

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post('/api/notifications/mark-all-read', {}, {
            preserveScroll: true,
        });
    };

    const handleNotificationClick = (notification: DbNotification) => {
        if (!notification.read_at) {
            router.post(`/api/notifications/${notification.id}/mark-read`, {}, {
                preserveScroll: true,
            });
        }
        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

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
                        <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-pulse-red"></span>
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-85 p-0 mr-4 mt-2 bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden" align="end">
                <DropdownMenuLabel className="px-4 py-3 font-bold text-base text-gray-900 bg-gray-50/50 flex justify-between items-center">
                    <span>Notifications</span>
                    {hasUnread && (
                        <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.read_at).length} new
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                    {hasNotifications ? (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start px-4 py-3 gap-1 cursor-pointer transition-colors focus:bg-gray-50",
                                    notification.read_at ? "hover:bg-gray-50" : "bg-blue-50/30 hover:bg-blue-50/60 focus:bg-blue-50/60"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <div className="flex items-start gap-1.5">
                                        {!notification.read_at && (
                                            <span className="mt-1.5 size-1.5 rounded-full bg-blue-600 shrink-0" />
                                        )}
                                        <span className={cn(
                                            "text-sm text-gray-900 leading-tight",
                                            !notification.read_at ? "font-semibold" : "font-medium text-gray-700"
                                        )}>
                                            {notification.title}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider shrink-0 mt-0.5">{notification.created_at}</span>
                                </div>
                                <p className={cn(
                                    "text-xs text-gray-500 line-clamp-2 leading-relaxed",
                                    !notification.read_at ? "pl-3" : ""
                                )}>
                                    {notification.message}
                                </p>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Bell className="size-10 text-gray-200 mb-3" />
                            <p className="text-sm font-medium text-gray-900">All caught up!</p>
                            <p className="text-xs text-gray-500">No new notifications at the moment.</p>
                        </div>
                    )}
                </div>
                {hasUnread && (
                    <>
                        <DropdownMenuSeparator className="m-0" />
                        <div className="px-4 py-2 bg-gray-50/50">
                            <Button
                                variant="link"
                                onClick={handleMarkAllRead}
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

