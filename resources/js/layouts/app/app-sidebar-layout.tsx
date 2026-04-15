import { useState, useEffect } from 'react';
import { Bot, CalendarFold, ListTodo, LucideMegaphone, Megaphone, MegaphoneIcon, NotebookPen, Sparkles, GripVertical, GripHorizontal } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// Removed restrictToVerticalAxis to allow horizontal dragging

import { AiChatPanel } from '@/components/ai-chat-panel';
import { AnnouncementsPanel } from '@/components/announcements-panel';
import { CalendarPanel } from '@/components/calendar-panel';
import { NotesPanel } from '@/components/notes-panel';
import { TodoPanel } from '@/components/todo-panel';
import { SidePanel } from '@/components/side-panel';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { NavUserRightRail } from '@/components/nav-user-right-rail';
import { SortableNavItem } from '@/components/sortable-nav-item';
import { SortableSidePanel } from '@/components/sortable-side-panel';
import { SortableAiChatPanel } from '@/components/sortable-ai-chat-panel';
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
import { usePanels, PanelKey } from '@/contexts/panel-context';
import { usePage } from '@inertiajs/react';

/* ─────────────────────────────────────────────────────────────────────────────
 * Custom Sensor to allow dragging on buttons
 * ───────────────────────────────────────────────────────────────────────────*/

class SmartPointerSensor extends PointerSensor {
    static activators = [
        {
            eventName: 'onPointerDown' as const,
            handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
                // If the target is a button or inside a button, we still want to allow DRAG
                // but we need to ensure the click still happens if it's just a click.
                // dnd-kit's PointerSensor with distance constraint handles this well.
                // However, we must NOT block standard button interactions.
                return true;
            },
        },
    ];
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────*/

// Provide a drop zone component so empty columns can STILL accept items!
function DroppableColumn({ id, children, isActive = false }: { id: string, children: React.ReactNode, isActive?: boolean }) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} id={id} className={`flex h-full w-[17.5vw] shrink-0 flex-col gap-2 overflow-hidden ${isActive ? 'bg-black/5 rounded-xl border border-dashed border-black/20 p-2' : ''}`}>
            {children}
        </div>
    );
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    hideHeader = false,
}: AppLayoutProps & { hideHeader?: boolean }) {
    const { 
        panels, 
        panelColumns, 
        panelFlex,
        togglePanel, 
        reorderPanels, 
        movePanel,
        updatePanelFlex,
        anyPanelOpen 
    } = usePanels();
    const { url } = usePage();
    const [animateEnabled, setAnimateEnabled] = useState(true);
    const [activeId, setActiveId] = useState<PanelKey | null>(null);

    // Briefly disable animations on navigation to prevent layout jumps/slides
    useEffect(() => {
        setAnimateEnabled(false);
        const timer = setTimeout(() => setAnimateEnabled(true), 100);
        return () => clearTimeout(timer);
    }, [url]);

    const isMobile = useIsMobile();

    const sensors = useSensors(
        useSensor(SmartPointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id: string) => {
        if (id in panelColumns) return id as 'col1' | 'col2';
        return Object.keys(panelColumns).find((key) => 
            panelColumns[key as 'col1' | 'col2'].includes(id as PanelKey)
        ) as 'col1' | 'col2';
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as PanelKey);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            // If dragging over a container directly
            if (activeContainer && (overId === 'col1' || overId === 'col2')) {
                const targetContainer = overId as 'col1' | 'col2';
                if (activeContainer !== targetContainer) {
                    movePanel(active.id as PanelKey, activeContainer, targetContainer, panelColumns[targetContainer].length);
                }
            }
            return;
        }

        const overIndex = panelColumns[overContainer].indexOf(overId as PanelKey);
        const newIndex = overIndex >= 0 ? overIndex : panelColumns[overContainer].length;
        
        movePanel(active.id as PanelKey, activeContainer, overContainer, newIndex);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeId = active.id as string;
        const overId = over?.id as string | undefined;

        if (!overId) {
            setActiveId(null);
            return;
        }

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (activeContainer && overContainer && activeContainer === overContainer) {
            const activeIndex = panelColumns[activeContainer].indexOf(activeId as PanelKey);
            const overIndex = panelColumns[overContainer].indexOf(overId as PanelKey);

            if (activeIndex !== overIndex) {
                reorderPanels(activeContainer, arrayMove(panelColumns[activeContainer], activeIndex, overIndex));
            }
        }

        setActiveId(null);
    };

    const getPanelConfig = (key: PanelKey) => {
        switch (key) {
            case 'announcements':
                return {
                    title: 'Announcements',
                    icon: <Megaphone className="h-4 w-4" />,
                    railIcon: <Megaphone className="size-6" />,
                    id: 'announcements',
                    component: <AnnouncementsPanel />,
                };
            case 'calendar':
                return {
                    title: 'Calendar',
                    icon: <CalendarFold className="h-4 w-4" />,
                    railIcon: <CalendarFold className="size-6" />,
                    id: 'calendar',
                    component: <CalendarPanel />,
                };
            case 'notes':
                return {
                    title: 'Special Notes',
                    icon: <NotebookPen className="h-4 w-4" />,
                    railIcon: <NotebookPen className="size-6" />,
                    id: 'notes',
                    component: <NotesPanel />,
                };
            case 'todo':
                return {
                    title: 'To-Do List',
                    icon: <ListTodo className="h-4 w-4" />,
                    railIcon: <ListTodo className="size-6" />,
                    id: 'todo',
                    component: <TodoPanel />,
                };
            case 'ai':
                return {
                    title: 'Virtual AI Librarian',
                    icon: <Bot className="h-4 w-4" />,
                    railIcon: <Bot className="size-6" />,
                    id: 'ai',
                };
            default:
                return null;
        }
    };

    const renderPanelBlock = (key: PanelKey) => {
        const config = getPanelConfig(key);
        if (!config || !panels[key]) return null;

        const currentFlex = panelFlex[key] || 1;

        if (key === 'ai') {
            return (
                <SortableAiChatPanel
                    key="ai"
                    open={panels.ai}
                    onOpenChange={() => togglePanel('ai')}
                    inline
                    flex={currentFlex}
                    onResize={(f) => updatePanelFlex('ai', f)}
                />
            );
        }

        return (
            <SortableSidePanel
                key={config.id}
                id={config.id}
                title={config.title}
                icon={config.icon}
                open={panels[key]}
                onClose={() => togglePanel(key)}
                flex={currentFlex}
                onResize={(f) => updatePanelFlex(key, f)}
            >
                {config.component}
            </SortableSidePanel>
        );
    };

    const allPanelKeys: PanelKey[] = ['announcements', 'calendar', 'notes', 'todo', 'ai'];

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                // NO modifiers block dragging left and right
            >
                <div className="flex h-svh w-full items-stretch overflow-hidden p-2 pr-0 gap-2">
                    {/* Main Content (Responsive - Expands to fill available space) */}
                    <div className="flex flex-1 min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
                        <AppContent variant="sidebar" className="flex h-full flex-col overflow-hidden">
                            {!hideHeader && <AppSidebarHeader breadcrumbs={breadcrumbs} />}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                {children}
                            </div>
                        </AppContent>
                    </div>

                    {/* Stacking Panels area (Conditional and Responsive) */}
                    {!isMobile && (
                        <div className="flex flex-initial gap-2 overflow-hidden h-full">
                            {/* Left Panel Column (17.5vw) */}
                            {(panelColumns.col1.some(k => panels[k]) || activeId) && (
                                <DroppableColumn id="col1" isActive={!!activeId && !panelColumns.col1.some(k => panels[k])}>
                                    <SortableContext id="col1" items={panelColumns.col1} strategy={verticalListSortingStrategy}>
                                        <div className={`flex flex-1 flex-col gap-2 h-full ${animateEnabled ? 'animate-in slide-in-from-right duration-300' : ''}`}>
                                            {panelColumns.col1.map((key) => renderPanelBlock(key))}
                                        </div>
                                    </SortableContext>
                                </DroppableColumn>
                            )}
                            
                            {/* Right Panel Column (17.5vw) */}
                            {(panelColumns.col2.some(k => panels[k]) || activeId) && (
                                <DroppableColumn id="col2" isActive={!!activeId && !panelColumns.col2.some(k => panels[k])}>
                                    <SortableContext id="col2" items={panelColumns.col2} strategy={verticalListSortingStrategy}>
                                        <div className={`flex flex-1 flex-col gap-2 h-full ${animateEnabled ? 'animate-in slide-in-from-right duration-500' : ''}`}>
                                            {panelColumns.col2.map((key) => renderPanelBlock(key))}
                                        </div>
                                    </SortableContext>
                                </DroppableColumn>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Rail (Pinned to far right) */}
                <div className="relative flex h-svh w-13 shrink-0 flex-col items-center gap-4 overflow-hidden bg-[#024495] pt-4 pb-4">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.08]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                            backgroundSize: '16px 16px',
                        }}
                    />
                    <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                        <NavUserRightRail />
                        
                        <div className="flex flex-col items-center gap-4">
                            {allPanelKeys.map((key) => {
                                const config = getPanelConfig(key);
                                if (!config) return null;

                                return (
                                    <div key={key} className="group relative flex items-center">
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => togglePanel(key)}
                                                        className={`h-11 w-11 rounded-full text-white transition-colors duration-200 ${
                                                            panels[key]
                                                                ? 'bg-white/20'
                                                                : 'hover:bg-white/20'
                                                        }`}
                                                        aria-label={config.title}
                                                    >
                                                        {config.railIcon}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left" sideOffset={12}>
                                                    {config.title}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto relative z-10 flex flex-col items-center gap-4">
                        <EmailComposeContainer />
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeId ? (
                        <div className="opacity-80 scale-105 pointer-events-none z-[100]">
                            <div className="bg-[#024495] p-3 rounded-xl border border-white/20 text-white flex items-center gap-2 shadow-2xl">
                                {getPanelConfig(activeId)?.icon}
                                <span className="text-sm font-semibold">{getPanelConfig(activeId)?.title}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Mobile Overlay AI Panel */}
            {isMobile && (
                <>
                    <AiChatPanel open={panels.ai} onOpenChange={() => togglePanel('ai')} />
                    {/* Add other panels for mobile as Sheets if needed, but for now AI is priority */}
                </>
            )}
        </AppShell>
    );
}
