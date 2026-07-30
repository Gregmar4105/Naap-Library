import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import {
    ScanFace,
    Mail,
    Sparkles,
    HardDrive,
    Globe,
    User,
    Users,
    Shield,
    ShieldCheck,
    Palette
} from 'lucide-react';

const sidebarNavItems = [
    {
        title: 'Biometric Sensitivity',
        href: '/settings?tab=biometrics',
        icon: ScanFace,
    },
    {
        title: 'Email Configuration',
        href: '/settings?tab=email',
        icon: Mail,
    },
    {
        title: 'AI Assistant',
        href: '/settings?tab=ai',
        icon: Sparkles,
    },
    {
        title: 'Storage & DB Analysis',
        href: '/settings?tab=storage',
        icon: HardDrive,
    },
    {
        title: 'Google Forms API',
        href: '/settings?tab=google_forms',
        icon: Globe,
    },
    {
        title: 'Users',
        href: '/settings?tab=users',
        icon: Users,
    },
    {
        title: 'Roles',
        href: '/settings?tab=roles',
        icon: ShieldCheck,
    },
    {
        title: 'Profile',
        href: edit(),
        icon: User,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: Shield,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];


export default function SettingsLayout({ children }: PropsWithChildren) {
    const { url } = usePage();

    const isTabActive = (hrefInput: any) => {
        const href = toUrl(hrefInput);
        if (href.includes('?tab=')) {
            const tabParam = href.split('?tab=')[1];
            if (url.includes(`tab=${tabParam}`)) return true;
            if ((url === '/settings' || url === '/settings/') && tabParam === 'biometrics') return true;
            return false;
        }
        return url.startsWith(href);
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">
            <Heading
                title="Settings"
                description="Manage your profile, system modules, and integration settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-8 gap-6">
                <aside className="w-full lg:w-64 shrink-0">
                    <nav
                        className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1.5 overflow-x-auto pb-2 lg:pb-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const Icon = item.icon;
                            const targetUrl = toUrl(item.href);
                            const active = isTabActive(item.href);
                            return (
                                <Button
                                    key={`${targetUrl}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn('w-full justify-start font-semibold rounded-xl text-xs py-2.5 px-3.5', {
                                        'bg-[#024495] text-white font-extrabold shadow-sm shadow-[#024495]/20 hover:bg-[#013575] hover:text-white': active,
                                        'hover:bg-gray-100 text-gray-700': !active,
                                    })}
                                >
                                    <Link href={targetUrl} preserveState preserveScroll>
                                        <Icon className={cn('h-4 w-4 mr-2.5 shrink-0', active ? 'text-white' : 'text-[#024495]')} />
                                        <span className="truncate">{item.title}</span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-2 lg:hidden" />

                <div className="flex-1 w-full min-w-0 flex justify-center">
                    <section className="w-full max-w-5xl space-y-8">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
