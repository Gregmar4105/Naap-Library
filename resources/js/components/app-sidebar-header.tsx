import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notification-bell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

import { usePanels } from '@/contexts/panel-context';
import { cn } from '@/lib/utils';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { anyPanelOpen } = usePanels();

    return (
        <header
            className={cn(
                'relative flex shrink-0 items-center gap-2 overflow-hidden bg-[#024495] px-6 text-white transition-[width,height,padding] ease-linear md:px-4',
                anyPanelOpen ? 'py-3' : 'py-4',
            )}
        >
            {/* Dotted background pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                }}
            />
            <div className="relative z-10 flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2 [&_*]:text-white [&_svg]:text-white">
                    <SidebarTrigger className="-ml-1 text-white" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}
