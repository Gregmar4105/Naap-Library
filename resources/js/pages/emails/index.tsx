import { useState, useRef, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Search, Paperclip, Smile, Send, Info, X, Loader2, UserPlus, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notification-bell';
import { resolveImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Emails / Messages',
        href: '/emails',
    },
];

export default function EmailsPage() {
    const { initialContacts } = usePage<{ initialContacts?: any[] }>().props;
    const [contacts, setContacts] = useState<any[]>(initialContacts || []);
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | number | null>(initialContacts?.[0]?.id || null);
    const selectedIdRef = useRef<string | number | null>(selectedId);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    const selectedContact = contacts.find(c => String(c.id) === String(selectedId)) || contacts[0] || null;

    const [messageInput, setMessageInput] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Autocomplete State
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/api/emails/sync', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.contacts && Array.isArray(data.contacts)) {
                    setContacts(data.contacts);
                    const currentId = selectedIdRef.current;
                    if (!currentId && data.contacts.length > 0) {
                        setSelectedId(data.contacts[0].id);
                    }
                }
            }
        } catch (e) {
            console.error('Sync error:', e);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        handleSync();
        const interval = setInterval(handleSync, 6000);
        return () => clearInterval(interval);
    }, []);

    // Update contacts when initialContacts changes (e.g. on router refresh)
    useEffect(() => {
        if (initialContacts) {
            setContacts(initialContacts);
            if (!selectedId && initialContacts.length > 0) {
                setSelectedId(initialContacts[0].id);
            }
        }
    }, [initialContacts]);

    // Handle clicks outside suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            setShowSuggestions(true);
            try {
                const response = await fetch(`/api/emails/search?query=${encodeURIComponent(searchQuery)}`);
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectSuggestion = (student: any) => {
        // Clear search
        setSearchQuery('');
        setShowSuggestions(false);

        // Check if student is already in contacts
        const existingContact = contacts.find(c => String(c.id) === String(student.id));
        
        if (existingContact) {
            setSelectedId(existingContact.id);
        } else {
            // Add to the top of the list temporarily
            const newContact = { ...student, messages: student.messages || [] };
            setContacts([newContact, ...contacts]);
            setSelectedId(newContact.id);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!messageInput.trim() || !selectedContact || isSending) return;

        setIsSending(true);

        const formData = new FormData();
        formData.append('to', selectedContact.email);
        formData.append('subject', 'Library System Message');
        formData.append('body', messageInput);
        formData.append('library_id', selectedContact.id);
        
        attachments.forEach((file) => {
            formData.append('attachments[]', file);
        });

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            if (response.ok) {
                setMessageInput('');
                setAttachments([]);
                await handleSync();
            } else {
                console.error('Failed to send email');
                alert('Failed to send email. Please try again.');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('An error occurred while sending the email.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <Head title="Emails & Messages" />

            {/* Main Wrapper matching the layout style, removing outer paddings from Chat container */}
            <div className="flex h-full w-full overflow-hidden bg-background">
                
                {/* Left Sidebar - Contacts List */}
                <div className="flex w-full md:w-[350px] flex-col border-r bg-background shrink-0">
                    {/* Header */}
                    <div className="flex shrink-0 items-center gap-2 bg-[#024495] px-4 py-3 text-white h-[52px] relative" ref={searchContainerRef}>
                        <SidebarTrigger className="-ml-1 h-7 w-7 text-white hover:bg-white/20" />
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-white/70" />
                            <Input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                                className="w-full bg-black/20 text-white placeholder:text-white/70 pl-9 rounded-full border-none focus-visible:ring-1 focus-visible:ring-white h-7 text-xs"
                            />
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border rounded-xl shadow-xl z-[100] max-h-[400px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                                    </span>
                                    {isSearching && <Loader2 className="h-3 w-3 animate-spin text-[#024495]" />}
                                </div>
                                <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[350px]">
                                    {suggestions.length > 0 ? (
                                        suggestions.map((student) => (
                                            <button
                                                key={student.id}
                                                onClick={() => handleSelectSuggestion(student)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-[#024495]/5 transition-colors text-left border-b last:border-0 border-border/40"
                                            >
                                                <Avatar className="h-9 w-9 border border-[#024495]/10">
                                                    <AvatarImage src={resolveImageUrl(student.avatar)} />
                                                    <AvatarFallback className="bg-muted text-[#024495] text-xs">
                                                        {student.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate italic">
                                                        {student.id} • {student.course}
                                                    </p>
                                                </div>
                                                <UserPlus className="h-4 w-4 text-[#024495] opacity-50" />
                                            </button>
                                        ))
                                    ) : (
                                        !isSearching && (
                                            <div className="p-8 text-center">
                                                <p className="text-sm text-muted-foreground italic">No students found matching your search.</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col p-2 space-y-1">
                            {contacts.map((contact: any) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedId(contact.id)}
                                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-200 text-left ${
                                        String(selectedContact?.id) === String(contact.id)
                                            ? 'bg-[#024495] text-white shadow-md'
                                            : 'hover:bg-muted/60'
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-12 w-12 border-2 border-transparent">
                                            <AvatarImage src={resolveImageUrl(contact.avatar)} />
                                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {contact.status === 'online' && (
                                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className={`font-semibold text-sm truncate ${selectedContact?.id === contact.id ? 'text-white' : 'text-foreground'}`}>
                                                {contact.name}
                                            </p>
                                            <span className={`text-xs ${selectedContact?.id === contact.id ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                                {contact.time}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-sm truncate pr-2 ${selectedContact?.id === contact.id ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                                {contact.lastMessage}
                                            </p>
                                            {contact.unread > 0 && (
                                                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                    selectedContact?.id === contact.id ? 'bg-white text-[#024495]' : 'bg-[#024495] text-white'
                                                }`}>
                                                    {contact.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Area - Chat Window */}
                <div className="flex flex-1 flex-col relative bg-[#f4f6fa] dark:bg-[#0f172a]">
                    
                    {/* Pattern Background matching Telegram */}
                    <div 
                        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)`,
                            backgroundSize: '20px 20px',
                        }}
                    ></div>

                    {/* Chat Header */}
                    <div className="flex shrink-0 items-center justify-between bg-[#024495] px-4 py-3 text-white shadow-sm z-10 min-h-[52px]">
                        {selectedContact ? (
                            <div className="flex items-center gap-3 cursor-pointer">
                                <Avatar className="h-8 w-8 border border-white/20">
                                    <AvatarImage src={resolveImageUrl(selectedContact.avatar)} />
                                    <AvatarFallback className="text-foreground">{selectedContact.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm text-white">{selectedContact.name}</h3>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center">
                                <h3 className="font-semibold text-sm text-white truncate">Welcome</h3>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSync}
                                disabled={isSyncing}
                                title="Sync Inbox (Fetch IMAP Emails)"
                                className="h-7 w-7 text-white hover:bg-white/20"
                            >
                                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                            </Button>
                            <NotificationBell className="text-white hover:bg-white/20 h-7 w-7" />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 z-10 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col gap-4 max-w-3xl mx-auto py-4">
                            
                            {/* Date Separator */}
                            <div className="flex justify-center my-2">
                                <span className="bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                                    Today
                                </span>
                            </div>

                            {(!selectedContact || !selectedContact.messages || selectedContact.messages.length === 0) ? (
                                <div className="flex h-full items-center justify-center my-10">
                                    <div className="rounded-2xl bg-black/5 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
                                        {contacts.length === 0 ? "You haven't sent any emails yet." : "No messages selected"}
                                    </div>
                                </div>
                            ) : (
                                selectedContact.messages.map((msg: any) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div 
                                            className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${
                                                msg.senderId === 'me' 
                                                    ? 'bg-[#024495] text-white rounded-br-sm' 
                                                    : 'bg-white dark:bg-slate-800 text-foreground rounded-bl-sm border dark:border-slate-700'
                                            }`}
                                        >
                                            <div className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                                            <div className={`text-[10px] flex justify-end mt-1 ${
                                                msg.senderId === 'me' ? 'text-blue-200' : 'text-muted-foreground'
                                            }`}>
                                                {msg.time}
                                                {msg.senderId === 'me' && (
                                                    <span className="ml-1 tracking-tighter">✓✓</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="px-4 pt-3 pb-6 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 border-t border-border/40 z-10 shrink-0 flex flex-col items-center">
                        {/* Attachment Chips */}
                        {attachments.length > 0 && (
                            <div className="w-full max-w-4xl flex flex-wrap gap-2 mb-3">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center gap-1.5 bg-[#024495]/10 text-[#024495] px-3 py-1 rounded-full text-xs font-medium border border-[#024495]/20 animate-in fade-in slide-in-from-bottom-1">
                                        <Paperclip className="h-3 w-3" />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button onClick={() => removeAttachment(index)} className="hover:bg-[#024495]/20 rounded-full p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-full max-w-4xl flex items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                multiple
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-10 w-10 shrink-0 rounded-full text-zinc-400 hover:text-[#024495] hover:bg-[#024495]/5 transition-colors"
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            
                            <div className="flex-1 bg-zinc-100 dark:bg-slate-800 rounded-2xl flex items-center px-2 py-1 border border-transparent focus-within:border-[#024495]/10 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-zinc-400 hover:text-[#024495] transition-colors">
                                    <Smile className="h-5 w-5" />
                                </Button>
                                <textarea
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Write a message..."
                                    className="flex-1 max-h-[120px] min-h-[40px] resize-none bg-transparent outline-none border-none px-2 py-2.5 text-[15px] custom-scrollbar placeholder:text-zinc-400"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                            </div>

                            {(messageInput.trim() || attachments.length > 0) && (
                                <Button 
                                    disabled={isSending}
                                    onClick={handleSend}
                                    className="h-10 w-10 shrink-0 rounded-full bg-[#024495] flex items-center justify-center text-white shadow-md hover:bg-blue-700 hover:scale-105 transition-all p-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5 ml-0.5" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

EmailsPage.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs} hideHeader={true}>
        {page}
    </AppLayout>
);
