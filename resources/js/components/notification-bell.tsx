import { Bell } from 'lucide-react';
import { useState } from 'react';
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
    // Mock notifications state
    const [notifications] = useState([
        { id: 1, title: 'New Student Registered', message: 'John Doe has been added to the system.', time: '2m ago' },
        { id: 2, title: 'Library Book Due', message: 'The book "Advanced React" is due today.', time: '1h ago' },
        { id: 3, title: 'System Update', message: 'Version 2.1.0 has been successfully deployed.', time: '5h ago' },
    ]);

    const hasNotifications = notifications.length > 0;

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
                            hasNotifications && "animate-bell-swing"
                        )}
                    >
                        <Bell className="size-4" />
                    </Button>
                    {hasNotifications && (
                        <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-pulse-red"></span>
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0 mr-4 mt-2 bg-white shadow-xl border-border rounded-xl overflow-hidden" align="end">
                <DropdownMenuLabel className="px-4 py-3 font-bold text-base text-gray-900 bg-gray-50/50">
                    Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start px-4 py-3 gap-1 cursor-pointer hover:bg-gray-50 transition-colors focus:bg-gray-50"
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span className="font-semibold text-sm text-gray-900">{notification.title}</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{notification.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
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
                {hasNotifications && (
                    <>
                        <DropdownMenuSeparator className="m-0" />
                        <div className="px-4 py-2 bg-gray-50/50">
                            <Button variant="link" className="w-full text-xs text-[#024495] hover:text-[#024495]/80 font-semibold p-0 h-auto">
                                Mark all as read
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
