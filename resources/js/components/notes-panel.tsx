import { useState, useEffect } from 'react';

export function NotesPanel() {
    const [note, setNote] = useState('');

    // Load from local storage on mount
    useEffect(() => {
        const savedNote = localStorage.getItem('daily_note');
        if (savedNote) {
            setNote(savedNote);
        }
    }, []);

    // Save to local storage on change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNote(value);
        localStorage.setItem('daily_note', value);
    };

    return (
        <div className="flex h-full flex-col gap-2 p-4">
            <textarea
                className="w-full flex-1 resize-none rounded-lg border border-input bg-transparent p-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#024495] focus-visible:outline-none"
                placeholder="What's on your mind today?..."
                value={note}
                onChange={handleChange}
            />
            <p className="text-[10px] text-muted-foreground text-right italic">
                Notes are saved automatically to your browser.
            </p>
        </div>
    );
}
