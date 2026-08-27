import { Bot, ChevronLeft, History, Plus, RotateCcw, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { SidePanel } from './side-panel';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────*/

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface Chat {
    id: number;
    title: string;
    messages_count: number;
    updated_at: string;
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
    const [chatId, setChatId] = useState<number | null>(null);
    const [history, setHistory] = useState<Chat[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);

    /* Auto-scroll whenever messages change or typing indicator appears */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    /* Load history when panel opens or when showHistory is toggled */
    useEffect(() => {
        if (open && showHistory) {
            void fetchHistory();
        }
    }, [open, showHistory]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetch('/api/ai/history', {
                headers: { 'Accept': 'application/json' }
            });
            const data = (await response.json()) as { success: boolean; history: Chat[] };
            if (data.success) {
                setHistory(data.history);
            }
        } catch (err) {
            console.error('Failed to fetch AI chat history', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadChat = async (id: number) => {
        setLoading(true);
        setError(null);
        setShowHistory(false);
        try {
            const response = await fetch(`/api/ai/chats/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = (await response.json()) as { success: boolean; messages: Message[]; chat: Chat };
            if (data.success) {
                setMessages(data.messages);
                setChatId(id);
            }
        } catch (err) {
            setError('Failed to load chat conversation.');
        } finally {
            setLoading(false);
        }
    };

    const deleteChat = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        setDeletingId(id);
        setError(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const response = await fetch(`/api/ai/chats/${id}`, {
                method: 'DELETE',
                headers: { 
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
            });

            const data = (await response.json()) as { success: boolean; message?: string };
            
            if (data.success) {
                setHistory((prev) => prev.filter((c) => c.id !== id));
                if (chatId === id) {
                    startNewChat();
                }
            } else {
                setError(data.message ?? 'Failed to delete chat.');
            }
        } catch (err) {
            console.error('Failed to delete chat', err);
            setError('Could not connect to the server to delete this chat.');
        } finally {
            setDeletingId(null);
        }
    };

    /* Start a fresh conversation */
    const startNewChat = () => {
        setMessages([]);
        setChatId(null);
        setError(null);
        setShowHistory(false);
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
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: trimmed,
                    history: historySnapshot,
                    chat_id: chatId,
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
                success: boolean;
                message?: string;
                content?: string;
                chat_id: number;
            };

            if (data.success) {
                setChatId(data.chat_id);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.message ?? data.content ?? '',
                    },
                ]);
            }
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
        <div className="flex items-center gap-1">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                title="Conversation history"
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            >
                <History className="h-4 w-4" />
                <span className="sr-only">History</span>
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startNewChat}
                title="New conversation"
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
            >
                <Plus className="h-4 w-4" />
                <span className="sr-only">New conversation</span>
            </Button>
        </div>
    );

    const historyContent = (
        <div className="flex h-full flex-col bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(false)}
                    className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to chat
                </Button>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
                {loadingHistory ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#024495] border-t-transparent" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        No past conversations found.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {history.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => void loadChat(chat.id)}
                                className={`group relative flex cursor-pointer flex-col rounded-lg px-3 py-2.5 transition-colors hover:bg-muted ${
                                    chatId === chat.id ? 'bg-muted ring-1 ring-inset ring-border' : ''
                                }`}
                            >
                                <span className="line-clamp-1 pr-10 text-sm font-medium leading-tight">
                                    {chat.title || 'New Conversation'}
                                </span>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>{chat.messages_count} messages</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => void deleteChat(e, chat.id)}
                                    disabled={deletingId === chat.id}
                                    className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 opacity-30 transition-all hover:bg-red-50 hover:text-red-600 hover:opacity-100 group-hover:opacity-70 group-hover:hover:opacity-100"
                                >
                                    {deletingId === chat.id ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const chatContent = (
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
                {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
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

    const mainContent = showHistory ? historyContent : chatContent;

    if (inline) {
        return (
            <SidePanel
                id="ai-assistant"
                title={showHistory ? "History" : "Virtual AI Librarian"}
                icon={showHistory ? <History className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-yellow-300" />}
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
                    {showHistory ? "Chat History" : "Virtual AI Librarian"}
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
