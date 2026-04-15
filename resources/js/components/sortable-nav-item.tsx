import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableNavItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export function SortableNavItem({ id, children, className = '' }: SortableNavItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`transition-opacity duration-200 ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'} ${className}`}
        >
            {children}
        </div>
    );
}
