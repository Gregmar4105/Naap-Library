import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    hideHeader = false,
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    hideHeader?: boolean;
    children: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} hideHeader={hideHeader}>
            {children}
        </AppLayoutTemplate>
    );
}
