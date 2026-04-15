import { useState } from 'react';
import { Bot, CalendarFold, ListTodo, LucideMegaphone, Megaphone, MegaphoneIcon, NotebookPen, Sparkles } from 'lucide-react';
import { AiChatPanel } from '@/components/ai-chat-panel';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { NavUserRightRail } from '@/components/nav-user-right-rail';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AppLayoutProps } from '@/types';
import { EmailComposeContainer } from '@/components/email-compose-container';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const isMobile = useIsMobile();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>

            {/* Desktop Inline AI Panel */}
            {!isMobile && (
                <AiChatPanel
                    open={aiPanelOpen}
                    onOpenChange={setAiPanelOpen}
                    inline
                />
            )}

            {/* Right Rail */}
            <div className="relative flex w-13 shrink-0 flex-col items-center gap-4 overflow-hidden bg-[#024495] pt-4 pb-4">
                {/* Dotted background pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                    }}
                />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <NavUserRightRail />
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setAiPanelOpen(!aiPanelOpen)}
                                    className={`h-11 w-11 rounded-full text-white transition-colors duration-200 ${
                                        aiPanelOpen
                                            ? 'bg-white/20'
                                            : 'hover:bg-white/20'
                                    }`}
                                    aria-label="Open AI Assistant"
                                >
                                    <Megaphone className="size-6"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={5}>
                                Announcements
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setAiPanelOpen(!aiPanelOpen)}
                                    className={`h-11 w-11 rounded-full text-white transition-colors duration-200 ${
                                        aiPanelOpen
                                            ? 'bg-white/20'
                                            : 'hover:bg-white/20'
                                    }`}
                                    aria-label="Open AI Assistant"
                                >
                                    <CalendarFold className="size-6"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={5}>
                                Calendar
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setAiPanelOpen(!aiPanelOpen)}
                                    className={`h-11 w-11 rounded-full text-white transition-colors duration-200 ${
                                        aiPanelOpen
                                            ? 'bg-white/20'
                                            : 'hover:bg-white/20'
                                    }`}
                                    aria-label="Open AI Assistant"
                                >
                                    <NotebookPen className="size-6"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={5}>
                                Notes
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setAiPanelOpen(!aiPanelOpen)}
                                    className={`h-11 w-11 rounded-full text-white transition-colors duration-200 ${
                                        aiPanelOpen
                                            ? 'bg-white/20'
                                            : 'hover:bg-white/20'
                                    }`}
                                    aria-label="Open AI Assistant"
                                >
                                    <ListTodo className="size-6"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={5}>
                                To-Do List
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setAiPanelOpen(!aiPanelOpen)}
                                    className={`h-11 w-11 rounded-full text-white transition-colors duration-200 ${
                                        aiPanelOpen
                                            ? 'bg-white/20'
                                            : 'hover:bg-white/20'
                                    }`}
                                    aria-label="Open AI Assistant"
                                >
                                    <Bot className="size-6" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={5}>
                                Virtual AI Librarian
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="mt-auto relative z-10 flex flex-col items-center gap-4">
                    {/* Student Email Boxes */}
                    <EmailComposeContainer />
                </div>
            </div>

            {/* Mobile Overlay AI Panel */}
            {isMobile && (
                <AiChatPanel open={aiPanelOpen} onOpenChange={setAiPanelOpen} />
            )}
        </AppShell>
    );
}
