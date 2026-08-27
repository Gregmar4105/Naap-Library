import React from 'react';
import { useEmailCompose } from '@/contexts/email-compose-context';
import { EmailComposeBox } from './email-compose-box';

export function EmailComposeContainer() {
    const { openEmails } = useEmailCompose();

    if (openEmails.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-4">
            {openEmails.map((email) => (
                <EmailComposeBox key={email.student.LIBRARY_ID} email={email} />
            ))}
        </div>
    );
}
