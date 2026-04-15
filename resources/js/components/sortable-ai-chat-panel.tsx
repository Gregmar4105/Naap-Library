import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AiChatPanel } from './ai-chat-panel';

interface SortableAiChatPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inline?: boolean;
    flexible?: boolean;
    flex?: number;
    onResize?: (newFlex: number) => void;
}

export function SortableAiChatPanel({ flex = 1, onResize, ...props }: SortableAiChatPanelProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: 'ai' });

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
            <AiChatPanel
                {...props}
                sortableProps={{
                    attributes,
                    listeners,
                    setNodeRef: () => {}, // Handled by outer div
                    isDragging,
                }}
            />
            {/* Note: AiChatPanel currently doesn't support the resize handle internally, 
                ideally it should wrap SidePanel or implement it. 
                Assuming AiChatPanel uses SidePanel or has similar logic. 
            */}
        </div>
    );
}
