import React from 'react';
import { createPortal } from 'react-dom';
import { MailPlus, Minus, X, Send, Paperclip, Loader2, Trash2 } from 'lucide-react';
import { EmailState } from '@/types/email-compose';
import { useEmailCompose } from '@/contexts/email-compose-context';
import { resolveImageUrl } from '@/lib/media';

interface EmailComposeBoxProps {
    email: EmailState;
}

export function EmailComposeBox({ email }: EmailComposeBoxProps) {
    const { closeEmail, toggleMinimize, updateForm, updateEmail, openEmails } = useEmailCompose();
    const { student, isMinimized, form, attachments, isSending, sentSuccess, error } = email;

    // Calculate index to offset multiple expanded modals
    const expandedIndex = openEmails
        .filter((e) => !e.isMinimized)
        .findIndex((e) => e.student.LIBRARY_ID === student.LIBRARY_ID);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!student.EMAIL) return;

        updateEmail(student.LIBRARY_ID, { isSending: true, error: null });

        try {
            const formData = new FormData();
            formData.append('to', student.EMAIL);
            formData.append('name', `${student.FN} ${student.LN}`);
            formData.append('subject', form.subject);
            formData.append('body', form.body);
            formData.append('library_id', student.LIBRARY_ID);
            attachments.forEach((file) => {
                formData.append('attachments[]', file);
            });

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                updateEmail(student.LIBRARY_ID, { sentSuccess: true, isSending: false });
                setTimeout(() => {
                    closeEmail(student.LIBRARY_ID);
                }, 1500);
            } else {
                updateEmail(student.LIBRARY_ID, { error: result.message || 'Failed to send email.', isSending: false });
            }
        } catch {
            updateEmail(student.LIBRARY_ID, { error: 'Network error. Please try again.', isSending: false });
        }
    };

    const handleAddAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        updateEmail(student.LIBRARY_ID, { attachments: [...attachments, ...files] });
        e.target.value = '';
    };

    const removeAttachment = (idx: number) => {
        updateEmail(student.LIBRARY_ID, {
            attachments: attachments.filter((_, i) => i !== idx)
        });
    };

    const modalContent = (
        <div 
            className="fixed bottom-0 z-[100] flex w-[520px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl pointer-events-auto"
            style={{
                right: `${74 + expandedIndex * 540}px`, // Offset modals to the left of the rail, side-by-side
                boxShadow: '0 8px 40px 0 rgba(255,179,0,0.18), 0 2px 8px 0 rgba(0,0,0,0.10)',
            }}
        >
            {/* Header */}
            <div
                className="flex cursor-pointer items-center justify-between px-4 py-3 select-none"
                style={{ background: '#ffb300' }}
                onClick={() => toggleMinimize(student.LIBRARY_ID)}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <MailPlus className="h-4 w-4 shrink-0 text-[#024495]" />
                    <span className="truncate text-sm font-bold text-[#024495]">
                        New Message
                        {student.EMAIL && (
                            <span className="ml-1 text-xs font-medium opacity-80">
                                — {student.FN} {student.LN}
                            </span>
                        )}
                    </span>
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-1">
                    <button
                        className="rounded p-1 text-[#024495]/70 transition-colors hover:bg-[#024495]/10 hover:text-[#024495]"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMinimize(student.LIBRARY_ID);
                        }}
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        className="rounded p-1 text-[#024495]/70 transition-colors hover:bg-[#024495]/10 hover:text-[#024495]"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeEmail(student.LIBRARY_ID);
                        }}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSend} className="flex flex-col">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                    <span className="w-8 shrink-0 text-xs font-semibold text-gray-400">To</span>
                    <input
                        type="email"
                        readOnly
                        value={student.EMAIL || ''}
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                    <span className="w-8 shrink-0 text-xs font-semibold text-gray-400">Sub</span>
                    <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => updateForm(student.LIBRARY_ID, { subject: e.target.value })}
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                        placeholder="Subject"
                        autoFocus
                    />
                </div>

                <textarea
                    required
                    value={form.body}
                    onChange={(e) => updateForm(student.LIBRARY_ID, { body: e.target.value })}
                    className="min-h-[260px] w-full resize-none bg-white px-4 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    placeholder="Write your message here…"
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-4 py-2">
                        {attachments.map((file, idx) => (
                            <span 
                                key={idx} 
                                className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
                            >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="max-w-[140px] truncate">{file.name}</span>
                                <button type="button" onClick={() => removeAttachment(idx)} className="ml-0.5 text-amber-500 hover:text-amber-700">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                    {sentSuccess ? (
                        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <Send className="h-4 w-4" /> Message sent!
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={isSending || !form.subject.trim() || !form.body.trim()}
                                className="flex items-center gap-2 rounded-full bg-[#ffb300] px-5 py-2 text-sm font-bold text-[#024495] shadow-sm transition-all hover:bg-[#e6a100] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {isSending ? 'Sending…' : 'Send'}
                            </button>
                            <label className="cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                                <Paperclip className="h-4 w-4" />
                                <input type="file" multiple className="hidden" onChange={handleAddAttachments} />
                            </label>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => closeEmail(student.LIBRARY_ID)}
                        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <>
            {/* Avatar in Right Rail stack */}
            <div className="relative">
                <button
                    onClick={() => toggleMinimize(student.LIBRARY_ID)}
                    className={`group relative h-11 w-11 overflow-hidden rounded-full border-2 bg-white transition-all hover:scale-110 ${
                        !isMinimized ? 'border-white bg-white/20' : 'border-[#ffb300] shadow-[0_0_15px_rgba(255,179,0,0.5)]'
                    }`}
                    style={isMinimized ? { animation: 'glowPulse 2s infinite ease-in-out' } : {}}
                    title={isMinimized ? `Draft to ${student.FN}` : `Close draft to ${student.FN}`}
                >
                    <style>{`
                        @keyframes glowPulse {
                            0% { box-shadow: 0 0 8px rgba(255,179,0,0.4); }
                            50% { box-shadow: 0 0 18px rgba(255,179,0,0.8); }
                            100% { box-shadow: 0 0 8px rgba(255,179,0,0.4); }
                        }
                    `}</style>
                    {student.PIC ? (
                        <img
                            src={resolveImageUrl(student.PIC)}
                            alt={student.FN}
                            className={`h-full w-full object-cover ${!isMinimized ? 'opacity-50' : ''}`}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[#024495]">
                            <MailPlus className="h-5 w-5" />
                        </div>
                    )}
                </button>
            </div>

            {/* Modal via Portal to avoid rail's overflow-hidden */}
            {!isMinimized && createPortal(modalContent, document.body)}
        </>
    );
}
