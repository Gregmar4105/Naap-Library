import { Head } from '@inertiajs/react';
import {
    UserPen,
    Search,
    CreditCard,
    User,
    CheckCircle2,
    XCircle,
    Loader2,
    IdCard,
    Smartphone,
    AlertCircle,
    Wifi,
    LinkIcon,
    Camera,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';

const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

interface StudentData {
    LIBRARY_ID: string;
    STUDENT_RFID_NUMBER: string | null;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    SEX: string | null;
    BIRTHDAY: string | null;
    CONTACT_NUMBER: string | null;
    EMAIL: string | null;
    PIC: string | null;
    COURSE: string | null;
    ADDRESS: string | null;
    ID_STATUS: string | null;
    REGISTERED_ON: string | null;
}

type TabType = 'register' | 'link' | 'link-face' | 'verify';

const breadcrumbs = [{ title: 'Student Registration', href: '/student-registration' }];

export default function StudentRegistration() {
    const [activeTab, setActiveTab] = useState<TabType>('register');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="p-4 bg-white/50 animate-pulse rounded-2xl h-[500px]" />;

    return (
        <>
            <Head title="Student Registration" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Tab Navigation */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'register' as TabType, label: 'Register New Student', icon: UserPen },
                        { key: 'link' as TabType, label: 'Link Card', icon: CreditCard },
                        { key: 'link-face' as TabType, label: 'Link Face', icon: Smartphone },
                        { key: 'verify' as TabType, label: 'Verify Card', icon: IdCard },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-bold transition-all duration-200 cursor-pointer ${activeTab === tab.key
                                ? 'bg-[#024495] text-white shadow-lg shadow-[#024495]/20'
                                : 'bg-white text-[#024495] border-2 border-[#024495]/20 hover:border-[#024495]/40 hover:bg-[#024495]/5'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'register' && <RegisterTab />}
                    {activeTab === 'link' && <LinkCardTab />}
                    {activeTab === 'link-face' && <LinkFaceTab />}
                    {activeTab === 'verify' && <VerifyTab />}
                </div>
            </div>
        </>
    );
}

StudentRegistration.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Student Registration', href: '/student-registration' }]}>
        {page}
    </AppLayout>
);

/* =============================================
   TAB 1: Register New Student
   ============================================= */
function RegisterTab() {
    const [form, setForm] = useState({
        STUDENT_NUMBER: '',
        FN: '',
        MN: '',
        LN: '',
        SEX: '',
        BIRTHDAY: '',
        CONTACT_NUMBER: '',
        EMAIL: '',
        COURSE: '',
        ADDRESS: '',
    });
    const [previewLibraryId, setPreviewLibraryId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; student?: StudentData } | null>(null);

    // RFID scanning state for post-registration card linking
    const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
    const [rfidLinkResult, setRfidLinkResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showSimModal, setShowSimModal] = useState(false);
    const [simInput, setSimInput] = useState('');

    const barcodeBuffer = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Fetch the next available LIBRARY_ID on mount
    useEffect(() => {
        fetchNextLibraryId();
    }, []);

    const fetchNextLibraryId = async () => {
        try {
            const response = await fetch('/api/student-registration/next-library-id');
            const data = await response.json();
            setPreviewLibraryId(data.library_id);
        } catch {
            setPreviewLibraryId('—');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);
        setRfidLinkResult(null);

        try {
            const response = await fetch('/api/student-registration/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            setResult({ success: response.ok, message: data.message, student: data.student });
            if (response.ok) {
                setForm({
                    STUDENT_NUMBER: '', FN: '', MN: '', LN: '', SEX: '',
                    BIRTHDAY: '', CONTACT_NUMBER: '', EMAIL: '', COURSE: '', ADDRESS: '',
                });
                setIsWaitingForRfid(true);
                // Refresh the next library ID for the next registration
                fetchNextLibraryId();
            }
        } catch {
            setResult({ success: false, message: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Listen for RFID scan when waiting for card link after registration
    useEffect(() => {
        if (!isWaitingForRfid) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (showSimModal) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                const code = barcodeBuffer.current;
                barcodeBuffer.current = '';
                if (code.length > 0) {
                    linkRfidToStudent(code);
                }
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => { barcodeBuffer.current = ''; }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isWaitingForRfid, showSimModal, result]);

    const linkRfidToStudent = async (rfidNumber: string) => {
        if (!result?.student) return;
        try {
            const response = await fetch('/api/student-registration/link-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({
                    library_id: result.student.LIBRARY_ID,
                    rfid_number: rfidNumber,
                }),
            });
            const data = await response.json();
            setRfidLinkResult({ success: response.ok, message: data.message });
            if (response.ok) {
                setIsWaitingForRfid(false);
            }
        } catch {
            setRfidLinkResult({ success: false, message: 'Network error linking NFC card.' });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top row: Form + RFID Panel */}
            <div className="flex flex-col lg:flex-row items-start gap-4">
                {/* Registration Form */}
                <div style={{ flex: '2 1 0%' }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#024495]/10 flex items-center justify-center">
                            <UserPen className="w-5 h-5 text-[#024495]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#024495]">Register New Student</h2>
                            <p className="text-sm text-gray-500">Fill out the form below to create a new library account.</p>
                        </div>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                        {/* Library ID Preview (auto-generated, read-only) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Student Number <span className="text-red-500">*</span></label>
                                <input type="text" name="STUDENT_NUMBER" value={form.STUDENT_NUMBER} onChange={handleChange} required placeholder="e.g. 12324MN-000100"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Library ID <span className="text-xs text-gray-400 font-normal">(auto-generated)</span></label>
                                <input type="text" value={previewLibraryId} readOnly
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-500 bg-gray-50 font-mono text-lg tracking-wider cursor-not-allowed" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                                <input type="text" name="FN" value={form.FN} onChange={handleChange} required placeholder="Juan"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Middle Name</label>
                                <input type="text" name="MN" value={form.MN} onChange={handleChange} placeholder="Santos"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                                <input type="text" name="LN" value={form.LN} onChange={handleChange} required placeholder="Dela Cruz"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Sex</label>
                                <select name="SEX" value={form.SEX} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all bg-white">
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Birthday</label>
                                <input type="date" name="BIRTHDAY" value={form.BIRTHDAY} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Contact Number</label>
                                <input type="text" name="CONTACT_NUMBER" value={form.CONTACT_NUMBER} onChange={handleChange} placeholder="09XX-XXX-XXXX"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                                <input type="email" name="EMAIL" value={form.EMAIL} onChange={handleChange} placeholder="student@naap.edu.ph"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Course / Program <span className="text-red-500">*</span></label>
                            <input type="text" name="COURSE" value={form.COURSE} onChange={handleChange} required placeholder="e.g. BSAMT 1st Year"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Address</label>
                            <textarea name="ADDRESS" value={form.ADDRESS} onChange={handleChange} rows={2} placeholder="Complete address..."
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all resize-none" />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end mt-4">
                            <button
                                type="submit" disabled={isSubmitting}
                                className="bg-[#024495] hover:bg-[#013575] text-white font-bold py-4 px-10 rounded-xl transition-all duration-200 flex items-center gap-2 text-lg disabled:opacity-60 cursor-pointer shadow-lg shadow-[#024495]/20 hover:shadow-xl hover:shadow-[#024495]/30"
                            >
                                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</> : <><UserPen className="w-5 h-5" /> Register Student</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RFID Card Reader Panel */}
                <div style={{ flex: '1 1 0%' }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#ffb300]/10 flex items-center justify-center">
                            <Wifi className="w-5 h-5 text-[#ffb300]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#024495]">NFC Card Reader</h2>
                            <p className="text-sm text-gray-500">Tap the student's NFC card after registration to link it.</p>
                        </div>
                    </div>

                    {/* Simulate Modal */}
                    {showSimModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4 backdrop-blur-sm" onClick={() => setShowSimModal(false)}>
                            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-[360px]" onClick={(e) => e.stopPropagation()}>
                                <h3 className="font-bold text-gray-900 mb-2">Simulate NFC Scan</h3>
                                <p className="text-xs text-gray-500 mb-4">Enter an NFC number to simulate a card tap.</p>
                                <input
                                    type="text"
                                    value={simInput}
                                    onChange={(e) => setSimInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setShowSimModal(false);
                                            linkRfidToStudent(simInput);
                                            setSimInput('');
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-black focus:outline-none focus:ring-2 focus:ring-[#024495]"
                                    placeholder="Enter NFC Number..."
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowSimModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
                                    <button onClick={() => { setShowSimModal(false); linkRfidToStudent(simInput); setSimInput(''); }}
                                        className="px-5 py-2 text-sm bg-[#024495] hover:bg-[#013575] text-white rounded-lg transition-colors font-medium cursor-pointer">Link Card</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {rfidLinkResult ? (
                        rfidLinkResult.success ? (
                            <div className="flex-1 flex flex-col items-center justify-start text-center gap-6 py-4">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-green-700 mb-1">NFC Card Linked!</p>
                                    <p className="text-gray-600 text-sm">{rfidLinkResult.message}</p>
                                </div>
                                {result?.student && (
                                    <div className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100 text-left">
                                        <p className="text-sm font-bold text-[#024495] mb-1">{result.student.FN} {result.student.LN}</p>
                                        <p className="text-xs text-gray-500">Library ID: <span className="font-mono font-bold">{result.student.LIBRARY_ID}</span></p>
                                    </div>
                                )}
                                <button
                                    onClick={() => { setResult(null); setRfidLinkResult(null); setIsWaitingForRfid(false); }}
                                    className="text-sm font-bold text-[#024495] hover:underline cursor-pointer"
                                >Register Another Student</button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-start text-center gap-4 py-4">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-red-600 font-bold text-sm">{rfidLinkResult.message}</p>
                                <button
                                    onClick={() => setRfidLinkResult(null)}
                                    className="text-sm font-bold text-[#024495] hover:underline cursor-pointer"
                                >Try Again</button>
                                <button
                                    onClick={() => { if (!isWaitingForRfid) return; setShowSimModal(true); }}
                                    className="mt-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                >Simulate Scanner (Dev Mode)</button>
                            </div>
                        )
                    ) : result && result.success && result.student ? (
                        <div className="flex-1 flex flex-col items-center justify-start text-center gap-6 py-4">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-700 mb-1">Registration Successful!</p>
                                <p className="text-gray-600 text-sm">{result.student.FN} {result.student.LN}</p>
                            </div>
                            <div className="w-full bg-[#024495]/5 border-2 border-dashed border-[#024495]/30 rounded-2xl p-6">
                                <p className="text-xs font-bold text-[#024495]/60 uppercase tracking-wider mb-2">Assigned Library ID</p>
                                <p className="text-3xl font-black text-[#024495] font-mono tracking-widest mb-4">{result.student.LIBRARY_ID}</p>
                            </div>

                            {isWaitingForRfid && (
                                <div className="w-full">
                                    <div className="bg-[#ffb300]/10 rounded-xl p-5 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#ffb300] flex items-center justify-center flex-shrink-0 animate-pulse">
                                            <Wifi className="w-5 h-5 text-[#ffb300]" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-[#024495] mb-1">Waiting for NFC Card...</p>
                                            <p className="text-xs text-gray-600">Tap the student's NFC card on the reader to link it to this account.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSimModal(true)}
                                        className="mt-4 text-[11px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                    >Simulate Scanner (Dev Mode)</button>
                                    <button
                                        onClick={() => { setIsWaitingForRfid(false); }}
                                        className="mt-2 ml-2 text-[11px] font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >Skip Card Link</button>
                                </div>
                            )}
                        </div>
                    ) : result && !result.success ? (
                        <div className="flex-1 flex flex-col items-center justify-start text-center gap-4 py-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-red-600 font-bold">{result.message}</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-start text-center gap-4 py-12 opacity-40">
                            <CreditCard className="w-16 h-16 text-gray-400" />
                            <p className="text-gray-500 font-medium">Register a student first, then tap their NFC card to link it.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


/* =============================================
   TAB 2: Link Card to Existing Student
   ============================================= */
function LinkCardTab() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StudentData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
    const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
    const [linkResult, setLinkResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showSimModal, setShowSimModal] = useState(false);
    const [simInput, setSimInput] = useState('');
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const barcodeBuffer = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const doSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await fetch(`/api/student-registration/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => doSearch(val), 300);
    };

    const selectStudent = (student: StudentData) => {
        setSelectedStudent(student);
        setIsWaitingForRfid(true);
        setLinkResult(null);
    };

    const linkRfidToStudent = async (rfidNumber: string) => {
        if (!selectedStudent) return;
        try {
            const response = await fetch('/api/student-registration/link-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({
                    library_id: selectedStudent.LIBRARY_ID,
                    rfid_number: rfidNumber,
                }),
            });
            const data = await response.json();
            setLinkResult({ success: response.ok, message: data.message });
            if (response.ok) {
                setIsWaitingForRfid(false);
                // Update the selected student's RFID in local state
                setSelectedStudent(prev => prev ? { ...prev, STUDENT_RFID_NUMBER: rfidNumber } : null);
            }
        } catch {
            setLinkResult({ success: false, message: 'Network error linking NFC card.' });
        }
    };

    // Listen for RFID scan when a student is selected and waiting
    useEffect(() => {
        if (!isWaitingForRfid) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (showSimModal) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                const code = barcodeBuffer.current;
                barcodeBuffer.current = '';
                if (code.length > 0) {
                    linkRfidToStudent(code);
                }
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => { barcodeBuffer.current = ''; }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isWaitingForRfid, showSimModal, selectedStudent]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4">
            {/* Search Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#024495]/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#024495]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">Find Student</h2>
                        <p className="text-sm text-gray-500">Search by name or student number.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus-within:ring-2 focus-within:ring-[#024495] focus-within:border-transparent transition-all">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Start typing a name or student number..."
                        className="w-full text-gray-900 outline-none bg-transparent"
                    />
                    {isSearching && <Loader2 className="w-5 h-5 text-[#024495] animate-spin flex-shrink-0" />}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                    {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                        <div className="text-center py-8 text-gray-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No students found.</p>
                        </div>
                    )}
                    {searchResults.map((student) => (
                        <button
                            key={student.LIBRARY_ID}
                            onClick={() => selectStudent(student)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4 ${selectedStudent?.LIBRARY_ID === student.LIBRARY_ID
                                ? 'border-[#024495] bg-[#024495]/5 shadow-md'
                                : 'border-gray-100 hover:border-[#024495]/30 hover:bg-gray-50'
                                }`}
                        >
                            <div className="w-11 h-11 rounded-full bg-[#024495] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {student.FN?.charAt(0)}{student.LN?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{student.FN} {student.MN ? `${student.MN.charAt(0)}.` : ''} {student.LN}</p>
                                <p className="text-sm text-gray-500 truncate">{student.STUDENT_NUMBER} · {student.COURSE || 'No course'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {student.ID_STATUS && (
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${student.ID_STATUS === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>{student.ID_STATUS}</span>
                                )}
                                {student.STUDENT_RFID_NUMBER && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">NFC Linked</span>
                                )}
                            </div>
                        </button>
                    ))}
                    {searchQuery.length < 2 && (
                        <div className="text-center py-12 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Type at least 2 characters to search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Card Reader Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#ffb300]/10 flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-[#ffb300]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">Read & Link Card</h2>
                        <p className="text-sm text-gray-500">Tap the NFC card on the reader to link it to the selected student.</p>
                    </div>
                </div>

                {/* Simulate Modal */}
                {showSimModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4 backdrop-blur-sm" onClick={() => setShowSimModal(false)}>
                        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-[360px]" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-gray-900 mb-2">Simulate NFC Scan</h3>
                            <p className="text-xs text-gray-500 mb-4">Enter an NFC number to simulate a card tap.</p>
                            <input
                                type="text"
                                value={simInput}
                                onChange={(e) => setSimInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setShowSimModal(false);
                                        linkRfidToStudent(simInput);
                                        setSimInput('');
                                    }
                                }}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-black focus:outline-none focus:ring-2 focus:ring-[#024495]"
                                placeholder="Enter NFC Number..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSimModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
                                <button onClick={() => { setShowSimModal(false); linkRfidToStudent(simInput); setSimInput(''); }}
                                    className="px-5 py-2 text-sm bg-[#024495] hover:bg-[#013575] text-white rounded-lg transition-colors font-medium cursor-pointer">Link Card</button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedStudent ? (
                    <div className="flex-1 flex flex-col items-center justify-start gap-6 py-2">
                        {/* Student Info */}
                        <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full bg-[#024495] flex items-center justify-center text-white font-bold text-xl">
                                    {selectedStudent.FN?.charAt(0)}{selectedStudent.LN?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{selectedStudent.FN} {selectedStudent.MN ? `${selectedStudent.MN.charAt(0)}.` : ''} {selectedStudent.LN}</p>
                                    <p className="text-sm text-gray-500">{selectedStudent.STUDENT_NUMBER}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="font-bold text-gray-500">Library ID:</span> <span className="text-gray-800 font-mono">{selectedStudent.LIBRARY_ID}</span></div>
                                <div><span className="font-bold text-gray-500">Status:</span> <span className={selectedStudent.ID_STATUS === 'Active' ? 'text-green-600 font-bold' : 'text-gray-800'}>{selectedStudent.ID_STATUS || '—'}</span></div>
                                <div><span className="font-bold text-gray-500">Course:</span> <span className="text-gray-800">{selectedStudent.COURSE || '—'}</span></div>
                                <div><span className="font-bold text-gray-500">NFC Card:</span> <span className={`font-mono ${selectedStudent.STUDENT_RFID_NUMBER ? 'text-green-600 font-bold' : 'text-gray-400'}`}>{selectedStudent.STUDENT_RFID_NUMBER || 'Not linked'}</span></div>
                            </div>
                        </div>

                        {/* Link Result */}
                        {linkResult ? (
                            linkResult.success ? (
                                <div className="w-full text-center space-y-4 py-4">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-green-700 font-bold">{linkResult.message}</p>
                                    <button
                                        onClick={() => { setSelectedStudent(null); setLinkResult(null); setIsWaitingForRfid(false); }}
                                        className="text-sm font-bold text-[#024495] hover:underline cursor-pointer"
                                    >Link Another Student</button>
                                </div>
                            ) : (
                                <div className="w-full text-center space-y-4 py-4">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <p className="text-red-600 font-bold text-sm">{linkResult.message}</p>
                                    <button
                                        onClick={() => { setLinkResult(null); setIsWaitingForRfid(true); }}
                                        className="text-sm font-bold text-[#024495] hover:underline cursor-pointer"
                                    >Try Again</button>
                                </div>
                            )
                        ) : isWaitingForRfid ? (
                            <div className="w-full text-center space-y-5 py-4">
                                <div className="w-20 h-20 rounded-full border-4 border-dashed border-[#ffb300] flex items-center justify-center mx-auto animate-pulse">
                                    <Wifi className="w-10 h-10 text-[#ffb300]" />
                                </div>
                                <div>
                                    <p className="text-gray-600 font-bold text-lg mb-1">Waiting for NFC Card...</p>
                                    <p className="text-gray-400 text-sm">Tap the student's NFC card on the reader to link it to this account.</p>
                                </div>
                                <button
                                    onClick={() => setShowSimModal(true)}
                                    className="text-[11px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                >Simulate Scanner (Dev Mode)</button>
                            </div>
                        ) : (
                            <div className="w-full bg-[#ffb300]/10 rounded-xl p-5 flex items-start gap-3">
                                <LinkIcon className="w-6 h-6 text-[#ffb300] flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-[#024495] mb-1">Ready to Link</p>
                                    <p className="text-sm text-gray-600">This student already has an NFC card linked. You can re-link by selecting them again.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-start text-center gap-4 py-12 opacity-40">
                        <CreditCard className="w-20 h-20 text-gray-400" />
                        <p className="text-gray-500 font-medium text-lg">Select a student from the search results to read and link their NFC card.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


/* =============================================
   TAB 3: Verify / Test Card
   ============================================= */
function VerifyTab() {
    const [scannedStudent, setScannedStudent] = useState<StudentData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSimModal, setShowSimModal] = useState(false);
    const [simInput, setSimInput] = useState('');

    const barcodeBuffer = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resetRef = useRef<NodeJS.Timeout | null>(null);

    const verifyCard = async (rfidNumber: string) => {
        if (!rfidNumber || rfidNumber.trim() === '') return;
        setIsProcessing(true);
        setError(null);
        try {
            const response = await fetch('/api/student-registration/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ rfid_number: rfidNumber }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setScannedStudent(data.student);
                if (resetRef.current) clearTimeout(resetRef.current);
                resetRef.current = setTimeout(() => setScannedStudent(null), 8000);
            } else {
                setError(data.message || 'Card not recognized.');
                setScannedStudent(null);
            }
        } catch {
            setError('Network error. Please check backend.');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isProcessing || showSimModal) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                const code = barcodeBuffer.current;
                barcodeBuffer.current = '';
                if (code.length > 0) verifyCard(code);
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => { barcodeBuffer.current = ''; }, 100);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isProcessing, showSimModal]);

    useEffect(() => {
        return () => { if (resetRef.current) clearTimeout(resetRef.current); };
    }, []);

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xl">
                {/* Simulate Modal */}
                {showSimModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4 backdrop-blur-sm" onClick={() => setShowSimModal(false)}>
                        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-[360px]" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-gray-900 mb-2">Simulate Card Scan</h3>
                            <p className="text-xs text-gray-500 mb-4">Enter a STUDENT_NFC_NUMBER to test.</p>
                            <input
                                type="text"
                                value={simInput}
                                onChange={(e) => setSimInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setShowSimModal(false);
                                        verifyCard(simInput);
                                        setSimInput('');
                                    }
                                }}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-black focus:outline-none focus:ring-2 focus:ring-[#024495]"
                                placeholder="Enter NFC Number..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowSimModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
                                <button onClick={() => { setShowSimModal(false); verifyCard(simInput); setSimInput(''); }}
                                    className="px-5 py-2 text-sm bg-[#024495] hover:bg-[#013575] text-white rounded-lg transition-colors font-medium cursor-pointer">Verify</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-[#024495]/10 flex items-center justify-center flex-shrink-0">
                            <IdCard className="w-6 h-6 text-[#024495]" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-[#024495]">Test / Verify Card</h2>
                            <p className="text-sm text-gray-500">Tap an NFC card to read its data and verify the student.</p>
                        </div>
                    </div>

                    {scannedStudent ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }} className="rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <p className="text-green-600 font-bold text-lg">Card Verified Successfully!</p>

                            <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200">
                                    <div className="w-16 h-16 rounded-full bg-[#024495] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                        {scannedStudent.PIC ? (
                                            <img src={scannedStudent.PIC} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <span>{scannedStudent.FN?.charAt(0)}{scannedStudent.LN?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-[#024495]">{scannedStudent.FN} {scannedStudent.MN ? `${scannedStudent.MN.charAt(0)}.` : ''} {scannedStudent.LN}</p>
                                        <p className="text-[#ffb300] font-bold text-sm">ID: {scannedStudent.STUDENT_NUMBER}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-bold text-[#024495]">Library ID</p>
                                        <p className="text-gray-700 font-mono">{scannedStudent.LIBRARY_ID}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#024495]">Course</p>
                                        <p className="text-gray-700">{scannedStudent.COURSE || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#024495]">Status</p>
                                        <p className={scannedStudent.ID_STATUS === 'Active' ? 'text-green-600 font-bold' : 'text-gray-700'}>{scannedStudent.ID_STATUS || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#024495]">Sex</p>
                                        <p className="text-gray-700">{scannedStudent.SEX || '—'}</p>
                                    </div>
                                    {scannedStudent.EMAIL && (
                                        <div className="col-span-2">
                                            <p className="font-bold text-[#024495]">Email</p>
                                            <p className="text-gray-700">{scannedStudent.EMAIL}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-gray-400">This display will auto-clear in 8 seconds.</p>
                        </div>
                    ) : error ? (
                        <div className="space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-red-600 font-bold text-lg">{error}</p>
                            <p className="text-gray-500 text-sm">The scanned NFC card is not linked to any student. Please link the card first using the "Link Card" tab.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 py-8">
                            <div style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px' }} className={`rounded-full border-4 border-dashed flex items-center justify-center mx-auto transition-all duration-300 ${isProcessing ? 'border-[#ffb300] animate-pulse' : 'border-gray-300'}`}>
                                <CreditCard className={`w-12 h-12 transition-colors ${isProcessing ? 'text-[#ffb300]' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <p className="text-gray-600 font-bold text-lg mb-1">{isProcessing ? 'Reading card...' : 'Waiting for NFC Tap...'}</p>
                                <p className="text-gray-400 text-sm">Place the student's NFC card on the reader to pull their information from the system.</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => { if (!isProcessing) setShowSimModal(true); }}
                        className="mt-6 text-[11px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                        Simulate Scanner (Dev Mode)
                    </button>
                </div>
            </div>
        </div>
    );
}


/* =============================================
   TAB 4: Link Face 
   ============================================= */
function LinkFaceTab() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StudentData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [linkResult, setLinkResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Multi-pose state
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [capturedDescriptors, setCapturedDescriptors] = useState<Record<string, number[]>>({});
    const [useGlasses, setUseGlasses] = useState(false);
    
    const poses = [
        { key: 'center', label: 'Center', instruction: 'Look straight at the camera.' },
        { key: 'up', label: 'Look Up', instruction: 'Tilt your head up slightly.' },
        { key: 'down', label: 'Look Down', instruction: 'Tilt your head down slightly.' },
        { key: 'left', label: 'Look Left', instruction: 'Turn your head to the left.' },
        { key: 'right', label: 'Look Right', instruction: 'Turn your head to the right.' },
    ];

    const currentPose = poses[currentStep] || null;
    const isWizardComplete = currentStep >= poses.length;

    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const doSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await fetch(`/api/student-registration/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => doSearch(val), 300);
    };

    const selectStudent = (student: StudentData) => {
        setSelectedStudent(student);
        setLinkResult(null);
        setCurrentStep(0);
        setCapturedDescriptors({});
        setUseGlasses(false);
    };

    const nextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    useEffect(() => {
        const initFaceApi = async () => {
            try {
                const faceapi = await import('@vladmandic/face-api');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setIsModelsLoaded(true);
            } catch (error) {
                console.error("Failed to load models for scanning", error);
            }
        };

        if (selectedStudent && !linkResult) {
            initFaceApi();
            startVideo();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [selectedStudent, linkResult]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Webcam error:", err);
        }
    };

    const capturePose = async () => {
        if (!selectedStudent || isProcessing || !currentPose) return;
        setIsProcessing(true);
        try {
            const faceapi = await import('@vladmandic/face-api');
            const video = videoRef.current;
            if (!video) return;

            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.6 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert("No face detected clearly. Please make sure your face is visible and try again.");
                setIsProcessing(false);
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            setCapturedDescriptors(prev => ({ ...prev, [currentPose.key]: descriptor }));
            nextStep();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const captureGlasses = async () => {
        if (!selectedStudent || isProcessing) return;
        setIsProcessing(true);
        try {
            const faceapi = await import('@vladmandic/face-api');
            const video = videoRef.current;
            if (!video) return;

            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.6 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert("No face detected clearly. Please ensure your glasses are on and try again.");
                setIsProcessing(false);
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            setCapturedDescriptors(prev => ({ ...prev, 'glasses': descriptor }));
            setUseGlasses(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const submitRegistration = async () => {
        if (!selectedStudent || isProcessing) return;
        setIsProcessing(true);
        try {
            const response = await fetch('/api/student-registration/link-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({
                    library_id: selectedStudent.LIBRARY_ID,
                    descriptor: capturedDescriptors,
                }),
            });

            const data = await response.json();
            setLinkResult({ success: response.ok, message: data.message });
            if (response.ok) {
                 if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            }
        } catch (error) {
            console.error(error);
            setLinkResult({ success: false, message: 'Network error linking face.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4">
            {/* Search Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#024495]/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#024495]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">Find Student</h2>
                        <p className="text-sm text-gray-500">Search by name or student number.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus-within:ring-2 focus-within:ring-[#024495] focus-within:border-transparent transition-all">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Start typing a name or student number..."
                        className="w-full text-gray-900 outline-none bg-transparent"
                    />
                    {isSearching && <Loader2 className="w-5 h-5 text-[#024495] animate-spin flex-shrink-0" />}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
                    {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                        <div className="text-center py-8 text-gray-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No students found.</p>
                        </div>
                    )}
                    {searchResults.map((student) => (
                        <button
                            key={student.ID}
                            onClick={() => selectStudent(student)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4 ${selectedStudent?.ID === student.ID
                                ? 'border-[#024495] bg-[#024495]/5 shadow-md'
                                : 'border-gray-100 hover:border-[#024495]/30 hover:bg-gray-50'
                                }`}
                        >
                            <div className="w-11 h-11 rounded-full bg-[#024495] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {student.FN?.charAt(0)}{student.LN?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{student.FN} {student.MN ? `${student.MN.charAt(0)}.` : ''} {student.LN}</p>
                                <p className="text-sm text-gray-500 truncate">{student.STUDENT_NUMBER} · {student.COURSE || 'No course'}</p>
                            </div>
                        </button>
                    ))}
                    {searchQuery.length < 2 && (
                        <div className="text-center py-12 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Type at least 2 characters to search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Face Capture Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col min-h-[600px]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-green-600">Smart Face Registration</h2>
                        <p className="text-sm text-gray-500">Guided multi-angle face data capture.</p>
                    </div>
                </div>

                {selectedStudent ? (
                    <div className="flex-1 flex flex-col items-center justify-start gap-4">
                        <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
                            <p className="text-sm font-bold text-gray-900">{selectedStudent.FN} {selectedStudent.LN}</p>
                            <p className="text-xs text-gray-500">{selectedStudent.STUDENT_NUMBER}</p>
                        </div>

                        {linkResult ? (
                            <div className="w-full text-center space-y-4 py-8">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${linkResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                    {linkResult.success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                </div>
                                <p className={`font-bold ${linkResult.success ? 'text-green-700' : 'text-red-600'}`}>{linkResult.message}</p>
                                <button
                                    onClick={() => {
                                        if (linkResult.success) setSelectedStudent(null);
                                        setLinkResult(null);
                                    }}
                                    className="text-sm font-bold text-[#024495] hover:underline cursor-pointer"
                                >
                                    {linkResult.success ? 'Link Another Student' : 'Try Again'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 w-full">
                                {/* Wizard Progress */}
                                <div className="flex gap-2 w-full mb-2">
                                    {poses.map((p, idx) => (
                                        <div 
                                            key={p.key} 
                                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${idx < currentStep ? 'bg-green-500' : idx === currentStep ? 'bg-[#024495]' : 'bg-gray-200'}`}
                                        />
                                    ))}
                                    <div className={`h-2 w-8 rounded-full transition-all duration-300 ${useGlasses ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                                </div>

                                <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden border-2 border-gray-100 bg-black shadow-lg">
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        muted 
                                        playsInline
                                        style={{ transform: 'scaleX(-1)' }}
                                        className="absolute inset-0 w-full h-full object-cover brightness-110"
                                    />
                                    <div className="absolute inset-0 border-[24px] border-white/10 pointer-events-none" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                                        <p className="text-white font-bold text-lg mb-1">
                                            {isWizardComplete ? (useGlasses ? 'Ready to finalize!' : 'Almost done!') : currentPose?.instruction}
                                        </p>
                                        {!isWizardComplete && (
                                            <p className="text-white/70 text-xs uppercase tracking-widest font-black">
                                                Step {currentStep + 1} of {poses.length}
                                            </p>
                                        )}
                                    </div>
                                    {!isModelsLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50 z-10">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Initializing...
                                        </div>
                                    )}
                                </div>

                                <div className="w-full flex flex-col gap-3 max-w-[320px]">
                                    {!isWizardComplete ? (
                                        <button
                                            onClick={capturePose}
                                            disabled={!isModelsLoaded || isProcessing}
                                            className="w-full bg-[#024495] hover:bg-[#013575] text-white font-black py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : <Camera className="w-5 h-5"/>}
                                            {isProcessing ? 'Processing...' : `Capture ${currentPose?.label}`}
                                        </button>
                                    ) : (
                                        <>
                                            {!useGlasses && (
                                                <button
                                                    onClick={captureGlasses}
                                                    disabled={isProcessing}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98]"
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                    Register with Glasses (Optional)
                                                </button>
                                            )}
                                            <button
                                                onClick={submitRegistration}
                                                disabled={isProcessing}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
                                                {isProcessing ? 'Finishing up...' : 'Save Face Profile'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-start text-center gap-4 py-12 opacity-40">
                        <User className="w-20 h-20 text-gray-400" />
                        <p className="text-gray-500 font-medium text-lg">Select a student first to register their face data.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
