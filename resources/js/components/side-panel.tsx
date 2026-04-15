import { Button } from '@/components/ui/button';
import { GripVertical, X } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface SidePanelProps {
    id: string;
    title: string;
    icon: ReactNode;
    children: ReactNode;
    open: boolean;
    onClose: () => void;
    className?: string;
    actions?: ReactNode;
    sortableProps?: {
        attributes: any;
        listeners: any;
        setNodeRef: (node: HTMLElement | null) => void;
        isDragging?: boolean;
    };
    flex?: number;
    onResize?: (newFlex: number) => void;
}

export function SidePanel({
    id,
    title,
    icon,
    children,
    open,
    onClose,
    className = '',
    actions,
    sortableProps,
    flex = 1,
    onResize,
}: SidePanelProps) {
    const [isMounted, setIsMounted] = useState(false);
    const isResizing = useRef(false);
    const initialY = useRef(0);
    const initialFlex = useRef(1);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!open) return null;

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        initialY.current = e.clientY;
        initialFlex.current = flex;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'row-resize';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current || !onResize) return;
        
        // Calculate the delta in pixels
        const deltaY = e.clientY - initialY.current;
        
        // Convert pixels to flex change
        // We assume a base height of roughly 300px = 1 flex unit for feel
        const flexDelta = deltaY / 300;
        const newFlex = Math.max(0.1, initialFlex.current + flexDelta);
        
        onResize(newFlex);
    };

    const stopResizing = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    };

    return (
        <div
            ref={sortableProps?.setNodeRef}
            id={`side-panel-${id}`}
            style={{ flex: `${flex} 1 0%` }}
            className={`relative flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm ${isMounted && !sortableProps?.isDragging && !isResizing.current ? 'transition-all duration-300' : ''} ${sortableProps?.isDragging ? 'opacity-30 z-50' : ''} ${className}`}
        >
            {/* Header */}
            <div 
                className={`flex shrink-0 items-center gap-2 bg-[#024495] px-4 py-3 text-white ${sortableProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
                {...sortableProps?.attributes}
                {...sortableProps?.listeners}
            >
                {sortableProps && <GripVertical className="h-4 w-4 text-white/50" />}
                <span className="shrink-0">{icon}</span>
                <span className="flex-1 text-sm font-semibold truncate">{title}</span>
                <div className="flex items-center gap-0.5" onMouseDown={(e) => e.stopPropagation()}>
                    {actions}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
            </div>

            {/* Content orientation depends on children */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>

            {/* Vertical Resize Handle */}
            <div
                onMouseDown={startResizing}
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize bg-transparent hover:bg-[#024495]/20 flex items-center justify-center group z-10"
            >
                <div className="w-8 h-1 rounded-full bg-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}
