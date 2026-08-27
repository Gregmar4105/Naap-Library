import { Link } from '@inertiajs/react';
import {
    ArrowLeftFromLine,
    ArrowRightFromLine,
    BookOpen,
    ChartBar,
    FolderGit2,
    HelpCircle,
    KeyRound,
    LayoutDashboard,
    LayoutGrid,
    LibraryBig,
    Settings,
    UserPen,
    FileSearch,
    Mails,
    BookOpenCheck,
    History,
    Users,
    GraduationCap,
    AlertTriangle,
    IdCard,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Student Logs',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Student Registration',
        href: '/student-registration',
        icon: UserPen,
    },
    {
        title: 'Student List',
        href: '/student-list',
        icon: Users,
    },
    {
        title: 'Violations',
        href: '/violations',
        icon: AlertTriangle,
    },
    {
        title: 'Programs',
        href: '/programs',
        icon: GraduationCap,
    },
    {
        title: 'Emails',
        href: '/emails',
        icon: Mails,
    },
    {
        title: 'Depository',
        href: '/depository',
        icon: KeyRound,
    },
    {
        title: 'Lost Library ID',
        href: '/lost-library-id',
        icon: FileSearch,
    },
    {
        title: 'Library ID Cards',
        href: '/id-cards',
        icon: IdCard,
    },

    {
        title: 'Survey',
        href: '/survey',
        icon: BookOpenCheck,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: (props: React.SVGProps<SVGSVGElement>) => <ChartBar {...props} style={{ transform: 'scaleX(-1) rotate(-90deg)' }} />,
    },
    {
        title: 'Tap To Login',
        href: '/tap-to-login',
        icon: ArrowRightFromLine,
    },
    {
        title: 'Tap To Logout',
        href: '/tap-to-logout',
        icon: ArrowLeftFromLine,
    },
];

const footerNavItems: NavItem[] = [

    {
        title: 'Help',
        href: '/help',
        icon: HelpCircle,
    },
    {
        title: 'System Logs',
        href: '/system-logs',
        icon: History,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar className="no-print" collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="hover:bg-transparent focus-visible:ring-0 data-[active=true]:bg-transparent"
                            asChild
                        >
                            <Link href={'/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
            </SidebarFooter>
        </Sidebar>
    );
}
