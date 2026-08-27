import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';

export type PanelKey = 'announcements' | 'calendar' | 'notes' | 'todo' | 'ai';

interface PanelState {
    announcements: boolean;
    calendar: boolean;
    notes: boolean;
    todo: boolean;
    ai: boolean;
}

interface PanelColumns {
    col1: PanelKey[];
    col2: PanelKey[];
}

const DEFAULT_COLUMNS: PanelColumns = {
    col1: ['announcements', 'calendar', 'notes'],
    col2: ['todo', 'ai'],
};

interface PanelContextType {
    panels: PanelState;
    panelColumns: PanelColumns;
    panelFlex: Record<PanelKey, number>;
    togglePanel: (key: PanelKey) => void;
    setPanelOpen: (key: PanelKey, open: boolean) => void;
    reorderPanels: (column: 'col1' | 'col2', newOrder: PanelKey[]) => void;
    movePanel: (key: PanelKey, from: 'col1' | 'col2', to: 'col1' | 'col2', index: number) => void;
    updatePanelFlex: (key: PanelKey, flex: number) => void;
    anyPanelOpen: boolean;
    isNavigating: boolean;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: React.ReactNode }) {
    const [panels, setPanels] = useState<PanelState>({
        announcements: false,
        calendar: false,
        notes: false,
        todo: false,
        ai: false,
    });

    const [panelColumns, setPanelColumns] = useState<PanelColumns>(() => {
        const saved = localStorage.getItem('naap-panel-columns');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.col1 && parsed.col2) return parsed;
            } catch (e) {
                console.error('Failed to parse panel columns', e);
            }
        }
        return DEFAULT_COLUMNS;
    });

    const [panelFlex, setPanelFlex] = useState<Record<PanelKey, number>>(() => {
        const saved = localStorage.getItem('naap-panel-flex');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse panel flex', e);
            }
        }
        return {
            announcements: 1,
            calendar: 1,
            notes: 1,
            todo: 1,
            ai: 1,
        };
    });

    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', () => setIsNavigating(true));
        const removeFinishListener = router.on('finish', () => setIsNavigating(false));

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    const togglePanel = useCallback((key: PanelKey) => {
        setPanels((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const setPanelOpen = useCallback((key: PanelKey, open: boolean) => {
        setPanels((prev) => ({ ...prev, [key]: open }));
    }, []);

    const reorderPanels = useCallback((column: 'col1' | 'col2', newOrder: PanelKey[]) => {
        setPanelColumns((prev) => {
            const updated = { ...prev, [column]: newOrder };
            localStorage.setItem('naap-panel-columns', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const movePanel = useCallback((key: PanelKey, from: 'col1' | 'col2', to: 'col1' | 'col2', index: number) => {
        setPanelColumns((prev) => {
            const sourceItems = [...prev[from]].filter(i => i !== key);
            const targetItems = [...prev[to]];
            targetItems.splice(index, 0, key);
            
            const updated = {
                ...prev,
                [from]: sourceItems,
                [to]: targetItems
            };
            localStorage.setItem('naap-panel-columns', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const updatePanelFlex = useCallback((key: PanelKey, flex: number) => {
        setPanelFlex((prev) => {
            const updated = { ...prev, [key]: Math.max(0.1, flex) };
            localStorage.setItem('naap-panel-flex', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const anyPanelOpen = Object.values(panels).some(Boolean);

    return (
        <PanelContext.Provider
            value={{
                panels,
                panelColumns,
                panelFlex,
                togglePanel,
                setPanelOpen,
                reorderPanels,
                movePanel,
                updatePanelFlex,
                anyPanelOpen,
                isNavigating,
            }}
        >
            {children}
        </PanelContext.Provider>
    );
}

export function usePanels() {
    const context = useContext(PanelContext);
    if (context === undefined) {
        throw new Error('usePanels must be used within a PanelProvider');
    }
    return context;
}
