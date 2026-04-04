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
    Copy,
    Check,
    AlertCircle,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';

interface StudentData {
    ID: number;
    LIBRARY_ID: string;
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

type TabType = 'register' | 'link' | 'verify';

const breadcrumbs = [{ title: 'Student Registration', href: '/student-registration' }];

export default function StudentRegistration() {
    const [activeTab, setActiveTab] = useState<TabType>('register');

    return (
        <>
            <Head title="Student Registration" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Tab Navigation */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'register' as TabType, label: 'Register New Student', icon: UserPen },
                        { key: 'link' as TabType, label: 'Link Card', icon: CreditCard },
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; student?: StudentData } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);

        try {
            const response = await fetch('/api/student-registration/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            setResult({ success: response.ok, message: data.message, student: data.student });
            if (response.ok) {
                setForm({
                    STUDENT_NUMBER: '', FN: '', MN: '', LN: '', SEX: '',
                    BIRTHDAY: '', CONTACT_NUMBER: '', EMAIL: '', COURSE: '', ADDRESS: '',
                });
            }
        } catch {
            setResult({ success: false, message: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyLibraryId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <div className="flex flex-col gap-4">
            {/* Top row: Form + NFC Panel */}
            <div className="flex flex-col lg:flex-row gap-4">
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
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Student Number <span className="text-red-500">*</span></label>
                            <input type="text" name="STUDENT_NUMBER" value={form.STUDENT_NUMBER} onChange={handleChange} required placeholder="e.g. 12324MN-000100"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#024495] focus:border-transparent transition-all" />
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

                {/* Result Panel */}
                <div style={{ flex: '1 1 0%' }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#ffb300]/10 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-[#ffb300]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#024495]">NFC Card</h2>
                            <p className="text-sm text-gray-500">Write the LIBRARY_ID to their card after registration.</p>
                        </div>
                    </div>
                    {result ? (
                        result.success && result.student ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-green-700 mb-1">Registration Successful!</p>
                                    <p className="text-gray-600 text-sm">{result.student.FN} {result.student.LN}</p>
                                </div>
                                <div className="w-full bg-[#024495]/5 border-2 border-dashed border-[#024495]/30 rounded-2xl p-6">
                                    <p className="text-xs font-bold text-[#024495]/60 uppercase tracking-wider mb-2">Library ID to Write</p>
                                    <p className="text-3xl font-black text-[#024495] font-mono tracking-widest mb-4">{result.student.LIBRARY_ID}</p>
                                    <button onClick={() => copyLibraryId(result.student!.LIBRARY_ID)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#024495] text-white rounded-lg text-sm font-bold hover:bg-[#013575] transition-colors cursor-pointer">
                                        {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy ID</>}
                                    </button>
                                </div>
                                <div className="bg-[#ffb300]/10 rounded-xl p-4 w-full">
                                    <p className="text-sm font-bold text-[#024495] flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-[#ffb300]" />
                                        Tap the student's NFC card on the writer to encode this ID.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-red-600 font-bold">{result.message}</p>
                            </div>
                        )
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                            <CreditCard className="w-16 h-16 text-gray-400" />
                            <p className="text-gray-500 font-medium">Register a student to generate their Library ID for NFC card writing.</p>
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
    const [copied, setCopied] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

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

    const copyLibraryId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
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
                            key={student.ID}
                            onClick={() => setSelectedStudent(student)}
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
                            {student.ID_STATUS && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${student.ID_STATUS === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>{student.ID_STATUS}</span>
                            )}
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

            {/* Card Write Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#ffb300]/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-[#ffb300]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">Write to Card</h2>
                        <p className="text-sm text-gray-500">Tap the NFC card on the writer to encode the Library ID.</p>
                    </div>
                </div>

                {selectedStudent ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
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
                                <div><span className="font-bold text-gray-500">Course:</span> <span className="text-gray-800">{selectedStudent.COURSE || '—'}</span></div>
                                <div><span className="font-bold text-gray-500">Status:</span> <span className={selectedStudent.ID_STATUS === 'Active' ? 'text-green-600 font-bold' : 'text-gray-800'}>{selectedStudent.ID_STATUS || '—'}</span></div>
                                {selectedStudent.EMAIL && <div className="col-span-2"><span className="font-bold text-gray-500">Email:</span> <span className="text-gray-800">{selectedStudent.EMAIL}</span></div>}
                            </div>
                        </div>

                        {/* Library ID to Write */}
                        <div className="w-full bg-[#024495]/5 border-2 border-dashed border-[#024495]/30 rounded-2xl p-6 text-center">
                            <p className="text-xs font-bold text-[#024495]/60 uppercase tracking-wider mb-2">Library ID to Write on Card</p>
                            <p className="text-4xl font-black text-[#024495] font-mono tracking-[0.2em] mb-4">{selectedStudent.LIBRARY_ID}</p>
                            <button
                                onClick={() => copyLibraryId(selectedStudent.LIBRARY_ID)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#024495] text-white rounded-xl text-sm font-bold hover:bg-[#013575] transition-colors cursor-pointer shadow-lg"
                            >
                                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Library ID</>}
                            </button>
                        </div>

                        {/* Instruction */}
                        <div className="bg-[#ffb300]/10 rounded-xl p-5 w-full flex items-start gap-3">
                            <CreditCard className="w-6 h-6 text-[#ffb300] flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-[#024495] mb-1">Ready to Write</p>
                                <p className="text-sm text-gray-600">Place the student's NFC card on the card writer and write the Library ID shown above onto the card.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                        <CreditCard className="w-20 h-20 text-gray-400" />
                        <p className="text-gray-500 font-medium text-lg">Select a student from the search results to view their Library ID for card writing.</p>
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

    const verifyCard = async (libraryId: string) => {
        if (!libraryId || libraryId.trim() === '') return;
        setIsProcessing(true);
        setError(null);
        try {
            const response = await fetch('/api/student-registration/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ library_id: libraryId }),
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
                            <p className="text-xs text-gray-500 mb-4">Enter a LIBRARY_ID to test.</p>
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
                                placeholder="Enter LIBRARY_ID..."
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
                            <p className="text-gray-500 text-sm">The scanned card is not registered in the system. Please register the student first.</p>
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
