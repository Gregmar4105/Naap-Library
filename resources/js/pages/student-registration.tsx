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
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || '';

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

const breadcrumbs = [
    { title: 'Student Registration', href: '/student-registration' },
];

export default function StudentRegistration() {
    const [activeTab, setActiveTab] = useState<TabType>('register');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted)
        return (
            <div className="h-[500px] animate-pulse rounded-2xl bg-white/50 p-4" />
        );

    return (
        <>
            <Head title="Student Registration" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2">
                    {[
                        {
                            key: 'register' as TabType,
                            label: 'Register New Student',
                            icon: UserPen,
                        },
                        {
                            key: 'link' as TabType,
                            label: 'Link Card',
                            icon: CreditCard,
                        },
                        {
                            key: 'link-face' as TabType,
                            label: 'Link Face',
                            icon: Smartphone,
                        },
                        {
                            key: 'verify' as TabType,
                            label: 'Verify Card',
                            icon: IdCard,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-lg font-bold transition-all duration-200 ${
                                activeTab === tab.key
                                    ? 'bg-[#024495] text-white shadow-lg shadow-[#024495]/20'
                                    : 'border-2 border-[#024495]/20 bg-white text-[#024495] hover:border-[#024495]/40 hover:bg-[#024495]/5'
                            }`}
                        >
                            <tab.icon className="h-5 w-5" />
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
    <AppLayout
        breadcrumbs={[
            { title: 'Student Registration', href: '/student-registration' },
        ]}
    >
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
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        student?: StudentData;
    } | null>(null);

    // RFID scanning state for post-registration card linking
    const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
    const [rfidLinkResult, setRfidLinkResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
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
            const response = await fetch(
                '/api/student-registration/next-library-id',
            );
            const data = await response.json();
            setPreviewLibraryId(data.library_id);
        } catch {
            setPreviewLibraryId('—');
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
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
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            setResult({
                success: response.ok,
                message: data.message,
                student: data.student,
            });
            if (response.ok) {
                setForm({
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
                setIsWaitingForRfid(true);
                // Refresh the next library ID for the next registration
                fetchNextLibraryId();
            }
        } catch {
            setResult({
                success: false,
                message: 'Network error. Please try again.',
            });
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
                timeoutRef.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, 100);
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
            const response = await fetch(
                '/api/student-registration/link-card',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        library_id: result.student.LIBRARY_ID,
                        rfid_number: rfidNumber,
                    }),
                },
            );
            const data = await response.json();
            setRfidLinkResult({ success: response.ok, message: data.message });
            if (response.ok) {
                setIsWaitingForRfid(false);
            }
        } catch {
            setRfidLinkResult({
                success: false,
                message: 'Network error linking NFC card.',
            });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top row: Form + RFID Panel */}
            <div className="flex flex-col items-start gap-4 lg:flex-row">
                {/* Registration Form */}
                <div
                    style={{ flex: '2 1 0%' }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                            <UserPen className="h-5 w-5 text-[#024495]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#024495]">
                                Register New Student
                            </h2>
                            <p className="text-sm text-gray-500">
                                Fill out the form below to create a new library
                                account.
                            </p>
                        </div>
                    </div>

                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Library ID Preview (auto-generated, read-only) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Student Number{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="STUDENT_NUMBER"
                                    value={form.STUDENT_NUMBER}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 12324MN-000100"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Library ID{' '}
                                    <span className="text-xs font-normal text-gray-400">
                                        (auto-generated)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={previewLibraryId}
                                    readOnly
                                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-lg tracking-wider text-gray-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    First Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="FN"
                                    value={form.FN}
                                    onChange={handleChange}
                                    required
                                    placeholder="Juan"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    name="MN"
                                    value={form.MN}
                                    onChange={handleChange}
                                    placeholder="Santos"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Last Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="LN"
                                    value={form.LN}
                                    onChange={handleChange}
                                    required
                                    placeholder="Dela Cruz"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Sex
                                </label>
                                <select
                                    name="SEX"
                                    value={form.SEX}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Birthday
                                </label>
                                <input
                                    type="date"
                                    name="BIRTHDAY"
                                    value={form.BIRTHDAY}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    name="CONTACT_NUMBER"
                                    value={form.CONTACT_NUMBER}
                                    onChange={handleChange}
                                    placeholder="09XX-XXX-XXXX"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="EMAIL"
                                    value={form.EMAIL}
                                    onChange={handleChange}
                                    placeholder="student@naap.edu.ph"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                Course / Program{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="COURSE"
                                value={form.COURSE}
                                onChange={handleChange}
                                required
                                placeholder="e.g. BSAMT 1st Year"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                Address
                            </label>
                            <textarea
                                name="ADDRESS"
                                value={form.ADDRESS}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Complete address..."
                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#024495] px-10 py-4 text-lg font-bold text-white shadow-lg shadow-[#024495]/20 transition-all duration-200 hover:bg-[#013575] hover:shadow-xl hover:shadow-[#024495]/30 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />{' '}
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <UserPen className="h-5 w-5" /> Register
                                        Student
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RFID Card Reader Panel */}
                <div
                    style={{ flex: '1 1 0%' }}
                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb300]/10">
                            <Wifi className="h-5 w-5 text-[#ffb300]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#024495]">
                                NFC Card Reader
                            </h2>
                            <p className="text-sm text-gray-500">
                                Tap the student's NFC card after registration to
                                link it.
                            </p>
                        </div>
                    </div>

                    {/* Simulate Modal */}
                    {showSimModal && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                            onClick={() => setShowSimModal(false)}
                        >
                            <div
                                className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="mb-2 font-bold text-gray-900">
                                    Simulate NFC Scan
                                </h3>
                                <p className="mb-4 text-xs text-gray-500">
                                    Enter an NFC number to simulate a card tap.
                                </p>
                                <input
                                    type="text"
                                    value={simInput}
                                    onChange={(e) =>
                                        setSimInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setShowSimModal(false);
                                            linkRfidToStudent(simInput);
                                            setSimInput('');
                                        }
                                    }}
                                    className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                    placeholder="Enter NFC Number..."
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowSimModal(false)}
                                        className="cursor-pointer px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSimModal(false);
                                            linkRfidToStudent(simInput);
                                            setSimInput('');
                                        }}
                                        className="cursor-pointer rounded-lg bg-[#024495] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#013575]"
                                    >
                                        Link Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {rfidLinkResult ? (
                        rfidLinkResult.success ? (
                            <div className="flex flex-1 flex-col items-center justify-start gap-6 py-4 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <div>
                                    <p className="mb-1 text-lg font-bold text-green-700">
                                        NFC Card Linked!
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {rfidLinkResult.message}
                                    </p>
                                </div>
                                {result?.student && (
                                    <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left">
                                        <p className="mb-1 text-sm font-bold text-[#024495]">
                                            {result.student.FN}{' '}
                                            {result.student.LN}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Library ID:{' '}
                                            <span className="font-mono font-bold">
                                                {result.student.LIBRARY_ID}
                                            </span>
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setRfidLinkResult(null);
                                        setIsWaitingForRfid(false);
                                    }}
                                    className="cursor-pointer text-sm font-bold text-[#024495] hover:underline"
                                >
                                    Register Another Student
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-start gap-4 py-4 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <p className="text-sm font-bold text-red-600">
                                    {rfidLinkResult.message}
                                </p>
                                <button
                                    onClick={() => setRfidLinkResult(null)}
                                    className="cursor-pointer text-sm font-bold text-[#024495] hover:underline"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => {
                                        if (!isWaitingForRfid) return;
                                        setShowSimModal(true);
                                    }}
                                    className="mt-2 cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                                >
                                    Simulate Scanner (Dev Mode)
                                </button>
                            </div>
                        )
                    ) : result && result.success && result.student ? (
                        <div className="flex flex-1 flex-col items-center justify-start gap-6 py-4 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                                <p className="mb-1 text-lg font-bold text-green-700">
                                    Registration Successful!
                                </p>
                                <p className="text-sm text-gray-600">
                                    {result.student.FN} {result.student.LN}
                                </p>
                            </div>
                            <div className="w-full rounded-2xl border-2 border-dashed border-[#024495]/30 bg-[#024495]/5 p-6">
                                <p className="mb-2 text-xs font-bold tracking-wider text-[#024495]/60 uppercase">
                                    Assigned Library ID
                                </p>
                                <p className="mb-4 font-mono text-3xl font-black tracking-widest text-[#024495]">
                                    {result.student.LIBRARY_ID}
                                </p>
                            </div>

                            {isWaitingForRfid && (
                                <div className="w-full">
                                    <div className="flex items-start gap-3 rounded-xl bg-[#ffb300]/10 p-5">
                                        <div className="flex h-10 w-10 flex-shrink-0 animate-pulse items-center justify-center rounded-full border-2 border-dashed border-[#ffb300]">
                                            <Wifi className="h-5 w-5 text-[#ffb300]" />
                                        </div>
                                        <div className="text-left">
                                            <p className="mb-1 text-sm font-bold text-[#024495]">
                                                Waiting for NFC Card...
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Tap the student's NFC card on
                                                the reader to link it to this
                                                account.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSimModal(true)}
                                        className="mt-4 cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                                    >
                                        Simulate Scanner (Dev Mode)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsWaitingForRfid(false);
                                        }}
                                        className="mt-2 ml-2 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-bold text-gray-500 transition-colors hover:bg-gray-100"
                                    >
                                        Skip Card Link
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : result && !result.success ? (
                        <div className="flex flex-1 flex-col items-center justify-start gap-4 py-4 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="font-bold text-red-600">
                                {result.message}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-start gap-4 py-12 text-center opacity-40">
                            <CreditCard className="h-16 w-16 text-gray-400" />
                            <p className="font-medium text-gray-500">
                                Register a student first, then tap their NFC
                                card to link it.
                            </p>
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
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
        null,
    );
    const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
    const [linkResult, setLinkResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
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
            const response = await fetch(
                `/api/student-registration/search?q=${encodeURIComponent(query)}`,
            );
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
            const response = await fetch(
                '/api/student-registration/link-card',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        library_id: selectedStudent.LIBRARY_ID,
                        rfid_number: rfidNumber,
                    }),
                },
            );
            const data = await response.json();
            setLinkResult({ success: response.ok, message: data.message });
            if (response.ok) {
                setIsWaitingForRfid(false);
                // Update the selected student's RFID in local state
                setSelectedStudent((prev) =>
                    prev ? { ...prev, STUDENT_RFID_NUMBER: rfidNumber } : null,
                );
            }
        } catch {
            setLinkResult({
                success: false,
                message: 'Network error linking NFC card.',
            });
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
                timeoutRef.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isWaitingForRfid, showSimModal, selectedStudent]);

    return (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {/* Search Panel */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                        <Search className="h-5 w-5 text-[#024495]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">
                            Find Student
                        </h2>
                        <p className="text-sm text-gray-500">
                            Search by name or student number.
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3 transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#024495]">
                    <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Start typing a name or student number..."
                        className="w-full bg-transparent text-gray-900 outline-none"
                    />
                    {isSearching && (
                        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-[#024495]" />
                    )}
                </div>

                {/* Results */}
                <div className="max-h-[500px] flex-1 space-y-2 overflow-y-auto">
                    {searchResults.length === 0 &&
                        searchQuery.length >= 2 &&
                        !isSearching && (
                            <div className="py-8 text-center text-gray-400">
                                <User className="mx-auto mb-3 h-12 w-12 opacity-40" />
                                <p className="font-medium">
                                    No students found.
                                </p>
                            </div>
                        )}
                    {searchResults.map((student) => (
                        <button
                            key={student.LIBRARY_ID}
                            onClick={() => selectStudent(student)}
                            className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                                selectedStudent?.LIBRARY_ID ===
                                student.LIBRARY_ID
                                    ? 'border-[#024495] bg-[#024495]/5 shadow-md'
                                    : 'border-gray-100 hover:border-[#024495]/30 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#024495] text-sm font-bold text-white">
                                {student.FN?.charAt(0)}
                                {student.LN?.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-gray-900">
                                    {student.FN}{' '}
                                    {student.MN
                                        ? `${student.MN.charAt(0)}.`
                                        : ''}{' '}
                                    {student.LN}
                                </p>
                                <p className="truncate text-sm text-gray-500">
                                    {student.STUDENT_NUMBER} ·{' '}
                                    {student.COURSE || 'No course'}
                                </p>
                            </div>
                            <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                {student.ID_STATUS && (
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                            student.ID_STATUS === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {student.ID_STATUS}
                                    </span>
                                )}
                                {student.STUDENT_RFID_NUMBER && (
                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                                        NFC Linked
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                    {searchQuery.length < 2 && (
                        <div className="py-12 text-center text-gray-400">
                            <Search className="mx-auto mb-3 h-12 w-12 opacity-30" />
                            <p className="font-medium">
                                Type at least 2 characters to search.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Card Reader Panel */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb300]/10">
                        <Wifi className="h-5 w-5 text-[#ffb300]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">
                            Read & Link Card
                        </h2>
                        <p className="text-sm text-gray-500">
                            Tap the NFC card on the reader to link it to the
                            selected student.
                        </p>
                    </div>
                </div>

                {/* Simulate Modal */}
                {showSimModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                        onClick={() => setShowSimModal(false)}
                    >
                        <div
                            className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-2 font-bold text-gray-900">
                                Simulate NFC Scan
                            </h3>
                            <p className="mb-4 text-xs text-gray-500">
                                Enter an NFC number to simulate a card tap.
                            </p>
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
                                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                placeholder="Enter NFC Number..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSimModal(false)}
                                    className="cursor-pointer px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSimModal(false);
                                        linkRfidToStudent(simInput);
                                        setSimInput('');
                                    }}
                                    className="cursor-pointer rounded-lg bg-[#024495] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#013575]"
                                >
                                    Link Card
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedStudent ? (
                    <div className="flex flex-1 flex-col items-center justify-start gap-6 py-2">
                        {/* Student Info */}
                        <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-6">
                            <div className="mb-4 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#024495] text-xl font-bold text-white">
                                    {selectedStudent.FN?.charAt(0)}
                                    {selectedStudent.LN?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {selectedStudent.FN}{' '}
                                        {selectedStudent.MN
                                            ? `${selectedStudent.MN.charAt(0)}.`
                                            : ''}{' '}
                                        {selectedStudent.LN}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedStudent.STUDENT_NUMBER}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="font-bold text-gray-500">
                                        Library ID:
                                    </span>{' '}
                                    <span className="font-mono text-gray-800">
                                        {selectedStudent.LIBRARY_ID}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500">
                                        Status:
                                    </span>{' '}
                                    <span
                                        className={
                                            selectedStudent.ID_STATUS ===
                                            'Active'
                                                ? 'font-bold text-green-600'
                                                : 'text-gray-800'
                                        }
                                    >
                                        {selectedStudent.ID_STATUS || '—'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500">
                                        Course:
                                    </span>{' '}
                                    <span className="text-gray-800">
                                        {selectedStudent.COURSE || '—'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500">
                                        NFC Card:
                                    </span>{' '}
                                    <span
                                        className={`font-mono ${selectedStudent.STUDENT_RFID_NUMBER ? 'font-bold text-green-600' : 'text-gray-400'}`}
                                    >
                                        {selectedStudent.STUDENT_RFID_NUMBER ||
                                            'Not linked'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Link Result */}
                        {linkResult ? (
                            linkResult.success ? (
                                <div className="w-full space-y-4 py-4 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <p className="font-bold text-green-700">
                                        {linkResult.message}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            setLinkResult(null);
                                            setIsWaitingForRfid(false);
                                        }}
                                        className="cursor-pointer text-sm font-bold text-[#024495] hover:underline"
                                    >
                                        Link Another Student
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full space-y-4 py-4 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                        <XCircle className="h-8 w-8 text-red-500" />
                                    </div>
                                    <p className="text-sm font-bold text-red-600">
                                        {linkResult.message}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setLinkResult(null);
                                            setIsWaitingForRfid(true);
                                        }}
                                        className="cursor-pointer text-sm font-bold text-[#024495] hover:underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )
                        ) : isWaitingForRfid ? (
                            <div className="w-full space-y-5 py-4 text-center">
                                <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-dashed border-[#ffb300]">
                                    <Wifi className="h-10 w-10 text-[#ffb300]" />
                                </div>
                                <div>
                                    <p className="mb-1 text-lg font-bold text-gray-600">
                                        Waiting for NFC Card...
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Tap the student's NFC card on the reader
                                        to link it to this account.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSimModal(true)}
                                    className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                                >
                                    Simulate Scanner (Dev Mode)
                                </button>
                            </div>
                        ) : (
                            <div className="flex w-full items-start gap-3 rounded-xl bg-[#ffb300]/10 p-5">
                                <LinkIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#ffb300]" />
                                <div>
                                    <p className="mb-1 text-sm font-bold text-[#024495]">
                                        Ready to Link
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        This student already has an NFC card
                                        linked. You can re-link by selecting
                                        them again.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-start gap-4 py-12 text-center opacity-40">
                        <CreditCard className="h-20 w-20 text-gray-400" />
                        <p className="text-lg font-medium text-gray-500">
                            Select a student from the search results to read and
                            link their NFC card.
                        </p>
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
    const [scannedStudent, setScannedStudent] = useState<StudentData | null>(
        null,
    );
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
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ rfid_number: rfidNumber }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setScannedStudent(data.student);
                if (resetRef.current) clearTimeout(resetRef.current);
                resetRef.current = setTimeout(
                    () => setScannedStudent(null),
                    8000,
                );
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
                timeoutRef.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, 100);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isProcessing, showSimModal]);

    useEffect(() => {
        return () => {
            if (resetRef.current) clearTimeout(resetRef.current);
        };
    }, []);

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-xl">
                {/* Simulate Modal */}
                {showSimModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                        onClick={() => setShowSimModal(false)}
                    >
                        <div
                            className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-2 font-bold text-gray-900">
                                Simulate Card Scan
                            </h3>
                            <p className="mb-4 text-xs text-gray-500">
                                Enter a STUDENT_NFC_NUMBER to test.
                            </p>
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
                                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                placeholder="Enter NFC Number..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSimModal(false)}
                                    className="cursor-pointer px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSimModal(false);
                                        verifyCard(simInput);
                                        setSimInput('');
                                    }}
                                    className="cursor-pointer rounded-lg bg-[#024495] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#013575]"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mb-8 flex items-center justify-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#024495]/10">
                            <IdCard className="h-6 w-6 text-[#024495]" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-[#024495]">
                                Test / Verify Card
                            </h2>
                            <p className="text-sm text-gray-500">
                                Tap an NFC card to read its data and verify the
                                student.
                            </p>
                        </div>
                    </div>

                    {scannedStudent ? (
                        <div className="animate-in space-y-6 duration-300 fade-in zoom-in">
                            <div
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    minWidth: '80px',
                                    minHeight: '80px',
                                }}
                                className="mx-auto flex items-center justify-center rounded-full bg-green-100"
                            >
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <p className="text-lg font-bold text-green-600">
                                Card Verified Successfully!
                            </p>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-left">
                                <div className="mb-5 flex items-center gap-4 border-b border-gray-200 pb-5">
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#024495] text-xl font-bold text-white">
                                        {scannedStudent.PIC ? (
                                            <img
                                                src={scannedStudent.PIC}
                                                alt="Profile"
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span>
                                                {scannedStudent.FN?.charAt(0)}
                                                {scannedStudent.LN?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-[#024495]">
                                            {scannedStudent.FN}{' '}
                                            {scannedStudent.MN
                                                ? `${scannedStudent.MN.charAt(0)}.`
                                                : ''}{' '}
                                            {scannedStudent.LN}
                                        </p>
                                        <p className="text-sm font-bold text-[#ffb300]">
                                            ID: {scannedStudent.STUDENT_NUMBER}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-bold text-[#024495]">
                                            Library ID
                                        </p>
                                        <p className="font-mono text-gray-700">
                                            {scannedStudent.LIBRARY_ID}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#024495]">
                                            Course
                                        </p>
                                        <p className="text-gray-700">
                                            {scannedStudent.COURSE || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#024495]">
                                            Status
                                        </p>
                                        <p
                                            className={
                                                scannedStudent.ID_STATUS ===
                                                'Active'
                                                    ? 'font-bold text-green-600'
                                                    : 'text-gray-700'
                                            }
                                        >
                                            {scannedStudent.ID_STATUS || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#024495]">
                                            Sex
                                        </p>
                                        <p className="text-gray-700">
                                            {scannedStudent.SEX || '—'}
                                        </p>
                                    </div>
                                    {scannedStudent.EMAIL && (
                                        <div className="col-span-2">
                                            <p className="font-bold text-[#024495]">
                                                Email
                                            </p>
                                            <p className="text-gray-700">
                                                {scannedStudent.EMAIL}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-gray-400">
                                This display will auto-clear in 8 seconds.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="space-y-4">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-lg font-bold text-red-600">
                                {error}
                            </p>
                            <p className="text-sm text-gray-500">
                                The scanned NFC card is not linked to any
                                student. Please link the card first using the
                                "Link Card" tab.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 py-8">
                            <div
                                style={{
                                    width: '112px',
                                    height: '112px',
                                    minWidth: '112px',
                                    minHeight: '112px',
                                }}
                                className={`mx-auto flex items-center justify-center rounded-full border-4 border-dashed transition-all duration-300 ${isProcessing ? 'animate-pulse border-[#ffb300]' : 'border-gray-300'}`}
                            >
                                <CreditCard
                                    className={`h-12 w-12 transition-colors ${isProcessing ? 'text-[#ffb300]' : 'text-gray-400'}`}
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-lg font-bold text-gray-600">
                                    {isProcessing
                                        ? 'Reading card...'
                                        : 'Waiting for NFC Tap...'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Place the student's NFC card on the reader
                                    to pull their information from the system.
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (!isProcessing) setShowSimModal(true);
                        }}
                        className="mt-6 cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
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
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
        null,
    );
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [linkResult, setLinkResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Multi-pose state
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [capturedDescriptors, setCapturedDescriptors] = useState<
        Record<string, number[]>
    >({});
    const [useGlasses, setUseGlasses] = useState(false);

    const poses = [
        {
            key: 'center',
            label: 'Center',
            instruction: 'Look straight at the camera.',
        },
        {
            key: 'up',
            label: 'Look Up',
            instruction: 'Tilt your head up slightly.',
        },
        {
            key: 'down',
            label: 'Look Down',
            instruction: 'Tilt your head down slightly.',
        },
        {
            key: 'left',
            label: 'Look Left',
            instruction: 'Turn your head to the left.',
        },
        {
            key: 'right',
            label: 'Look Right',
            instruction: 'Turn your head to the right.',
        },
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
            const response = await fetch(
                `/api/student-registration/search?q=${encodeURIComponent(query)}`,
            );
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
        setCurrentStep((prev) => prev + 1);
    };

    useEffect(() => {
        const initFaceApi = async () => {
            try {
                const faceapi = await import('@vladmandic/face-api');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                setIsModelsLoaded(true);
            } catch (error) {
                console.error('Failed to load models for scanning', error);
            }
        };

        if (selectedStudent && !linkResult) {
            initFaceApi();
            startVideo();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [selectedStudent, linkResult]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Webcam error:', err);
        }
    };

    const capturePose = async () => {
        if (!selectedStudent || isProcessing || !currentPose) return;
        setIsProcessing(true);
        try {
            const faceapi = await import('@vladmandic/face-api');
            const video = videoRef.current;
            if (!video) return;

            const detection = await faceapi
                .detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.6,
                    }),
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert(
                    'No face detected clearly. Please make sure your face is visible and try again.',
                );
                setIsProcessing(false);
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            setCapturedDescriptors((prev) => ({
                ...prev,
                [currentPose.key]: descriptor,
            }));
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

            const detection = await faceapi
                .detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.6,
                    }),
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert(
                    'No face detected clearly. Please ensure your glasses are on and try again.',
                );
                setIsProcessing(false);
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            setCapturedDescriptors((prev) => ({
                ...prev,
                glasses: descriptor,
            }));
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
            const response = await fetch(
                '/api/student-registration/link-face',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        library_id: selectedStudent.LIBRARY_ID,
                        descriptor: capturedDescriptors,
                    }),
                },
            );

            const data = await response.json();
            setLinkResult({ success: response.ok, message: data.message });
            if (response.ok) {
                if (streamRef.current)
                    streamRef.current
                        .getTracks()
                        .forEach((track) => track.stop());
            }
        } catch (error) {
            console.error(error);
            setLinkResult({
                success: false,
                message: 'Network error linking face.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {/* Search Panel */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                        <Search className="h-5 w-5 text-[#024495]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024495]">
                            Find Student
                        </h2>
                        <p className="text-sm text-gray-500">
                            Search by name or student number.
                        </p>
                    </div>
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3 transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#024495]">
                    <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Start typing a name or student number..."
                        className="w-full bg-transparent text-gray-900 outline-none"
                    />
                    {isSearching && (
                        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-[#024495]" />
                    )}
                </div>

                <div className="max-h-[500px] flex-1 space-y-2 overflow-y-auto">
                    {searchResults.length === 0 &&
                        searchQuery.length >= 2 &&
                        !isSearching && (
                            <div className="py-8 text-center text-gray-400">
                                <User className="mx-auto mb-3 h-12 w-12 opacity-40" />
                                <p className="font-medium">
                                    No students found.
                                </p>
                            </div>
                        )}
                    {searchResults.map((student) => (
                        <button
                            key={student.LIBRARY_ID}
                            onClick={() => selectStudent(student)}
                            className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                                selectedStudent?.LIBRARY_ID ===
                                student.LIBRARY_ID
                                    ? 'border-[#024495] bg-[#024495]/5 shadow-md'
                                    : 'border-gray-100 hover:border-[#024495]/30 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#024495] text-sm font-bold text-white">
                                {student.FN?.charAt(0)}
                                {student.LN?.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-gray-900">
                                    {student.FN}{' '}
                                    {student.MN
                                        ? `${student.MN.charAt(0)}.`
                                        : ''}{' '}
                                    {student.LN}
                                </p>
                                <p className="truncate text-sm text-gray-500">
                                    {student.STUDENT_NUMBER} ·{' '}
                                    {student.COURSE || 'No course'}
                                </p>
                            </div>
                        </button>
                    ))}
                    {searchQuery.length < 2 && (
                        <div className="py-12 text-center text-gray-400">
                            <Search className="mx-auto mb-3 h-12 w-12 opacity-30" />
                            <p className="font-medium">
                                Type at least 2 characters to search.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Face Capture Panel */}
            <div className="flex min-h-[600px] flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <Smartphone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-green-600">
                            Smart Face Registration
                        </h2>
                        <p className="text-sm text-gray-500">
                            Guided multi-angle face data capture.
                        </p>
                    </div>
                </div>

                {selectedStudent ? (
                    <div className="flex flex-1 flex-col items-center justify-start gap-4">
                        <div className="mb-2 w-full rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-sm font-bold text-gray-900">
                                {selectedStudent.FN} {selectedStudent.LN}
                            </p>
                            <p className="text-xs text-gray-500">
                                {selectedStudent.STUDENT_NUMBER}
                            </p>
                        </div>

                        {linkResult ? (
                            <div className="w-full space-y-4 py-8 text-center">
                                <div
                                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${linkResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}
                                >
                                    {linkResult.success ? (
                                        <CheckCircle2 className="h-8 w-8" />
                                    ) : (
                                        <XCircle className="h-8 w-8" />
                                    )}
                                </div>
                                <p
                                    className={`font-bold ${linkResult.success ? 'text-green-700' : 'text-red-600'}`}
                                >
                                    {linkResult.message}
                                </p>
                                <button
                                    onClick={() => {
                                        if (linkResult.success)
                                            setSelectedStudent(null);
                                        setLinkResult(null);
                                    }}
                                    className="cursor-pointer text-sm font-bold text-[#024495] hover:underline"
                                >
                                    {linkResult.success
                                        ? 'Link Another Student'
                                        : 'Try Again'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex w-full flex-col items-center gap-6">
                                {/* Wizard Progress */}
                                <div className="mb-2 flex w-full gap-2">
                                    {poses.map((p, idx) => (
                                        <div
                                            key={p.key}
                                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${idx < currentStep ? 'bg-green-500' : idx === currentStep ? 'bg-[#024495]' : 'bg-gray-200'}`}
                                        />
                                    ))}
                                    <div
                                        className={`h-2 w-8 rounded-full transition-all duration-300 ${useGlasses ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                    />
                                </div>

                                <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl border-2 border-gray-100 bg-black shadow-lg">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{ transform: 'scaleX(-1)' }}
                                        className="absolute inset-0 h-full w-full object-cover brightness-110"
                                    />
                                    <div className="pointer-events-none absolute inset-0 border-[24px] border-white/10" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                                        <p className="mb-1 text-lg font-bold text-white">
                                            {isWizardComplete
                                                ? useGlasses
                                                    ? 'Ready to finalize!'
                                                    : 'Almost done!'
                                                : currentPose?.instruction}
                                        </p>
                                        {!isWizardComplete && (
                                            <p className="text-xs font-black tracking-widest text-white/70 uppercase">
                                                Step {currentStep + 1} of{' '}
                                                {poses.length}
                                            </p>
                                        )}
                                    </div>
                                    {!isModelsLoaded && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-white">
                                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />{' '}
                                            Initializing...
                                        </div>
                                    )}
                                </div>

                                <div className="flex w-full max-w-[320px] flex-col gap-3">
                                    {!isWizardComplete ? (
                                        <button
                                            onClick={capturePose}
                                            disabled={
                                                !isModelsLoaded || isProcessing
                                            }
                                            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#024495] px-6 py-5 font-black text-white shadow-lg transition-all hover:bg-[#013575] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Camera className="h-5 w-5" />
                                            )}
                                            {isProcessing
                                                ? 'Processing...'
                                                : `Capture ${currentPose?.label}`}
                                        </button>
                                    ) : (
                                        <>
                                            {!useGlasses && (
                                                <button
                                                    onClick={captureGlasses}
                                                    disabled={isProcessing}
                                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-[0.98]"
                                                >
                                                    <CreditCard className="h-5 w-5" />
                                                    Register with Glasses
                                                    (Optional)
                                                </button>
                                            )}
                                            <button
                                                onClick={submitRegistration}
                                                disabled={isProcessing}
                                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 py-5 font-black text-white shadow-lg transition-all hover:bg-green-700 active:scale-[0.98]"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5" />
                                                )}
                                                {isProcessing
                                                    ? 'Finishing up...'
                                                    : 'Save Face Profile'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-start gap-4 py-12 text-center opacity-40">
                        <User className="h-20 w-20 text-gray-400" />
                        <p className="text-lg font-medium text-gray-500">
                            Select a student first to register their face data.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
