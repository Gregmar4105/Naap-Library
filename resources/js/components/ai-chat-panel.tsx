import { Bot, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { SidePanel } from './side-panel';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────*/

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface AiChatPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inline?: boolean;
    flexible?: boolean;
    sortableProps?: {
        attributes: any;
        listeners: any;
        setNodeRef: (node: HTMLElement | null) => void;
        isDragging?: boolean;
    };
    flex?: number;
    onResize?: (newFlex: number) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────*/

export function AiChatPanel({
    open,
    onOpenChange,
    inline = false,
    flexible = false,
    sortableProps,
    flex,
    onResize,
}: AiChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);

    /* Auto-scroll whenever messages change or typing indicator appears */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    /* Clear all chat history */
    const clearHistory = () => {
        setMessages([]);
        setError(null);
    };

    /* Send the current input to the backend */
    const sendMessage = async () => {
        const trimmed = input.trim();

        if (!trimmed || loading) {
            return;
        }

        const userMessage: Message = { role: 'user', content: trimmed };
        const historySnapshot: Message[] = [...messages];

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content ?? '';

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    message: trimmed,
                    history: historySnapshot,
                }),
            });

            if (!response.ok) {
                const body = (await response.json().catch(() => ({}))) as {
                    message?: string;
                };

                throw new Error(
                    body.message ?? `Request failed (${response.status})`,
                );
            }

            const data = (await response.json()) as {
                message?: string;
                content?: string;
            };
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.message ?? data.content ?? '',
                },
            ]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    /* Enter → send, Shift+Enter → newline */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    };

    const actions = (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearHistory}
            title="Clear conversation"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
        >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Clear conversation</span>
        </Button>
    );

    const mainContent = (
        <div className="relative z-10 flex h-full flex-col">
            {/* ── Messages ───────────────────────────────────────────── */}
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {/* Empty state */}
                {messages.length === 0 && !loading && (
                    <div className="flex h-full flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <Bot className="mb-3 h-12 w-12 opacity-20" />
                        <p className="max-w-[220px] text-sm leading-relaxed">
                            Ask me anything about the library system.
                        </p>
                    </div>
                )}

                {/* Conversation bubbles */}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex items-end gap-2 ${
                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                    >
                        {/* Avatar */}
                        {msg.role === 'assistant' ? (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#024495]/10">
                                <Bot className="h-4 w-4 text-[#024495]" />
                            </div>
                        ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#024495] text-xs font-bold text-white">
                                U
                            </div>
                        )}

                        {/* Bubble */}
                        <div
                            className={`whitespace-pre-wrap max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'rounded-br-none bg-[#024495] text-white'
                                    : 'rounded-bl-none bg-muted text-foreground'
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Typing indicator (3 bouncing dots) */}
                {loading && (
                    <div className="flex items-end gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#024495]/10">
                            <Bot className="h-4 w-4 text-[#024495]" />
                        </div>
                        <div className="rounded-2xl rounded-bl-none bg-muted px-4 py-3">
                            <div className="flex gap-1">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Inline error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                    </div>
                )}

                {/* Scroll anchor */}
                <div ref={bottomRef} />
            </div>

            {/* ── Input bar ──────────────────────────────────────────── */}
            <div className="shrink-0 border-t bg-background p-3">
                <div className="flex items-end gap-2">
                    <textarea
                        rows={1}
                        className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type a message… (Enter to send)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <Button
                        type="button"
                        size="icon"
                        onClick={() => void sendMessage()}
                        disabled={loading || !input.trim()}
                        className="h-9 w-9 shrink-0 bg-[#024495] text-white hover:bg-[#024495]/90"
                    >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );

    if (inline) {
        return (
            <SidePanel
                id="ai-assistant"
                title="Virtual AI Librarian"
                icon={<Sparkles className="h-4 w-4 text-yellow-300" />}
                open={open}
                onClose={() => onOpenChange(false)}
                actions={actions}
                sortableProps={sortableProps}
                flex={flex}
                onResize={onResize}
            >
                {mainContent}
            </SidePanel>
        );
    }

    const contentWithHeader = (
        <div className="relative z-10 flex h-full flex-col">
            <div className="flex shrink-0 items-center gap-2 bg-[#024495] px-4 py-4 text-white">
                <Sparkles className="h-4 w-4 shrink-0 text-yellow-300" />
                <span className="flex-1 text-sm font-semibold text-white">
                    Virtual AI Librarian
                </span>
                <div className="flex items-center gap-0.5">
                    {actions}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
            </div>
            {mainContent}
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[378px] p-0 sm:max-w-[378px]">
                <SheetTitle className="sr-only">AI Assistant</SheetTitle>
                {contentWithHeader}
            </SheetContent>
        </Sheet>
    );
}
