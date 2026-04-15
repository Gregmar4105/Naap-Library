import React, { createContext, useContext, useState, useCallback } from 'react';
import { Student, EmailState } from '@/types/email-compose';

interface EmailComposeContextType {
    openEmails: EmailState[];
    openEmail: (student: Student) => void;
    closeEmail: (studentId: string) => void;
    updateEmail: (studentId: string, updates: Partial<EmailState>) => void;
    toggleMinimize: (studentId: string) => void;
    updateForm: (studentId: string, formUpdates: Partial<EmailState['form']>) => void;
}

const EmailComposeContext = createContext<EmailComposeContextType | undefined>(undefined);

export function EmailComposeProvider({ children }: { children: React.ReactNode }) {
    const [openEmails, setOpenEmails] = useState<EmailState[]>([]);

    const openEmail = useCallback((student: Student) => {
        setOpenEmails((prev) => {
            // Check if student already has an open email
            const existing = prev.find((e) => e.student.LIBRARY_ID === student.LIBRARY_ID);
            if (existing) {
                // Just un-minimize it
                return prev.map((e) =>
                    e.student.LIBRARY_ID === student.LIBRARY_ID ? { ...e, isMinimized: false } : e
                );
            }

            // Limit to 3
            if (prev.length >= 3) {
                return prev;
            }

            // Add new email box
            const newEmail: EmailState = {
                student,
                isMinimized: false,
                form: { subject: '', body: '' },
                attachments: [],
                isSending: false,
                sentSuccess: false,
                error: null,
            };

            return [...prev, newEmail];
        });
    }, []);

    const closeEmail = useCallback((studentId: string) => {
        setOpenEmails((prev) => prev.filter((e) => e.student.LIBRARY_ID !== studentId));
    }, []);

    const updateEmail = useCallback((studentId: string, updates: Partial<EmailState>) => {
        setOpenEmails((prev) =>
            prev.map((e) => (e.student.LIBRARY_ID === studentId ? { ...e, ...updates } : e))
        );
    }, []);

    const toggleMinimize = useCallback((studentId: string) => {
        setOpenEmails((prev) =>
            prev.map((e) =>
                e.student.LIBRARY_ID === studentId ? { ...e, isMinimized: !e.isMinimized } : e
            )
        );
    }, []);

    const updateForm = useCallback((studentId: string, formUpdates: Partial<EmailState['form']>) => {
        setOpenEmails((prev) =>
            prev.map((e) =>
                e.student.LIBRARY_ID === studentId
                    ? { ...e, form: { ...e.form, ...formUpdates } }
                    : e
            )
        );
    }, []);

    return (
        <EmailComposeContext.Provider
            value={{ openEmails, openEmail, closeEmail, updateEmail, toggleMinimize, updateForm }}
        >
            {children}
        </EmailComposeContext.Provider>
    );
}

export function useEmailCompose() {
    const context = useContext(EmailComposeContext);
    if (context === undefined) {
        throw new Error('useEmailCompose must be used within an EmailComposeProvider');
    }
    return context;
}
