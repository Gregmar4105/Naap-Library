import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import { SidePanel } from './side-panel';

interface SortableSidePanelProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    open: boolean;
    onClose: () => void;
    flexible?: boolean;
    flex?: number;
    onResize?: (newFlex: number) => void;
}

export function SortableSidePanel({ id, flex = 1, onResize, ...props }: SortableSidePanelProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const combinedStyle = {
        transform: CSS.Translate.toString(transform),
        transition,
        flex: `${flex} 1 0%`,
    };

    return (
        <div 
            ref={setNodeRef}
            style={combinedStyle} 
            className="flex flex-col min-h-0"
        >
            <SidePanel
                id={id}
                {...props}
                sortableProps={{
                    attributes,
                    listeners,
                    setNodeRef: () => {}, // Handled by outer div
                    isDragging,
                }}
                flex={flex}
                onResize={onResize}
            />
        </div>
    );
}
