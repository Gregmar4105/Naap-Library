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
    Scan,
    QrCode,
    Barcode,
    X,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { resolveImageUrl } from '@/lib/media';
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

export default function StudentRegistration({ faceThreshold }: { faceThreshold: number }) {
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
                {/* Tab Navigation and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                                label: 'Verification',
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


                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'register' && <RegisterTab />}
                    {activeTab === 'link' && <LinkCardTab />}
                    {activeTab === 'link-face' && <LinkFaceTab />}
                    {activeTab === 'verify' && <VerifyTab faceThreshold={faceThreshold} />}
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
    const [picFile, setPicFile] = useState<File | null>(null);
    const [picPreview, setPicPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewLibraryId, setPreviewLibraryId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        student?: StudentData;
        qrCode?: string;
        barcode?: string;
        secretKey?: string;
    } | null>(null);

    // RFID scanning state for post-registration card linking
    const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
    const [rfidLinkResult, setRfidLinkResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const [showSimModal, setShowSimModal] = useState(false);
    const [simInput, setSimInput] = useState('');
    const [showRegModal, setShowRegModal] = useState(false);
    const [showRfidModal, setShowRfidModal] = useState(false);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPicFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPicPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);
        setRfidLinkResult(null);

        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (picFile) {
                formData.append('PIC', picFile);
            }

            const response = await fetch('/api/student-registration/register', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });
            const data = await response.json();
            setResult({
                success: response.ok,
                message: data.message,
                student: data.student,
                qrCode: data.qr_code,
                barcode: data.barcode,
                secretKey: data.secret_key,
            });
            setShowRegModal(true);
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
                setPicFile(null);
                setPicPreview(null);
                setIsWaitingForRfid(true);
                // Refresh the next library ID for the next registration
                fetchNextLibraryId();
            }
        } catch {
            setResult({
                success: false,
                message: 'Network error. Please try again.',
            });
            setShowRegModal(true);
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
            setShowRfidModal(true);
            if (response.ok) {
                setIsWaitingForRfid(false);
            }
        } catch {
            setRfidLinkResult({
                success: false,
                message: 'Network error linking NFC card.',
            });
            setShowRfidModal(true);
        }
    };

    const closeRegModal = () => {
        setShowRegModal(false);
        if (result && !result.success) {
            setResult(null);
        }
    };

    const closeRfidModal = () => {
        setShowRfidModal(false);
        if (rfidLinkResult) {
            if (rfidLinkResult.success) {
                setResult(null);
                setRfidLinkResult(null);
                setIsWaitingForRfid(false);
            } else {
                setRfidLinkResult(null);
            }
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
                        <div className="ml-auto">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="group relative">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 transition-all duration-300 ${
                                        picPreview
                                            ? 'border-[#024495] shadow-lg scale-105'
                                            : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#024495] hover:bg-[#024495]/5'
                                    }`}
                                >
                                    {picPreview ? (
                                        <img
                                            src={picPreview}
                                            alt="Student Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-[#024495]">
                                            <Camera className="h-8 w-8" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                Add Photo
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                </button>
                                {picPreview && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPicFile(null);
                                            setPicPreview(null);
                                        }}
                                        className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110 active:scale-90"
                                    >
                                        <span className="text-xs font-bold">
                                            ×
                                        </span>
                                    </button>
                                )}
                            </div>
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

                    {isWaitingForRfid && result?.student ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 text-center">
                            <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-[#ffb300]/10 border-2 border-dashed border-[#ffb300]">
                                <Wifi className="h-10 w-10 text-[#ffb300]" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-[#024495]">
                                    Waiting for NFC Card...
                                </p>
                                <p className="text-xs text-gray-500">
                                    Tap the student's NFC card on the reader to link it.
                                </p>
                            </div>
                            
                            <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Linking card for
                                </p>
                                <div>
                                    <p className="text-sm font-bold text-[#024495]">
                                        {result.student.FN} {result.student.LN}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Library ID:{' '}
                                        <span className="font-mono font-bold">
                                            {result.student.LIBRARY_ID}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2">
                                <button
                                    onClick={() => setShowSimModal(true)}
                                    className="w-full cursor-pointer rounded-xl border border-blue-200 bg-blue-50 py-3 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
                                >
                                    Simulate Scanner (Dev Mode)
                                </button>
                                <button
                                    onClick={() => {
                                        setIsWaitingForRfid(false);
                                    }}
                                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 py-3 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100"
                                >
                                    Skip Card Link
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center opacity-40">
                            <CreditCard className="h-16 w-16 text-gray-400" />
                            <p className="font-medium text-gray-500">
                                Register a student first, then tap their NFC
                                card to link it.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Result Modal */}
            {showRegModal && result && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md transition-all duration-300"
                    onClick={closeRegModal}
                >
                    <div
                        className="w-full max-w-md rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative flex flex-col items-center text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={closeRegModal}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {result.success ? (
                            <>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <h3 className="mb-2 text-2xl font-extrabold text-gray-900 tracking-tight">
                                    Registration Successful!
                                </h3>
                                <p className="mb-4 text-sm font-semibold text-gray-600">
                                    {result.student?.FN} {result.student?.LN}
                                </p>
                                
                                <div className="w-full rounded-2xl border-2 border-dashed border-[#024495]/30 bg-[#024495]/5 p-4 mb-4 flex flex-col items-center gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-wider text-[#024495]/60 uppercase">
                                            Assigned Library ID
                                        </p>
                                        <p className="font-mono text-2xl font-black tracking-widest text-[#024495]">
                                            {result.student?.LIBRARY_ID}
                                        </p>
                                    </div>

                                    {result.qrCode && (
                                        <div className="flex flex-col gap-4 items-center w-full pt-4 border-t border-[#024495]/10 max-w-[220px] mx-auto">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Student Credentials</span>
                                            
                                            {/* QR Code Container */}
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-3xl w-full relative pt-5">
                                                <span className="absolute -top-2.5 left-4 bg-white px-2 py-0.5 text-[9px] font-black text-[#024495] uppercase tracking-widest border border-blue-100 rounded-full shadow-2xs">QR Code</span>
                                                <div className="w-[120px] h-[120px] bg-white p-2 rounded-2xl border border-gray-100 flex items-center justify-center shadow-xs">
                                                    <img src={result.qrCode} alt="Secret QR Code" className="h-full w-full object-contain" />
                                                </div>
                                            </div>

                                            {/* Barcode Container */}
                                            {result.barcode && (
                                                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-gray-200 rounded-3xl w-full relative pt-5">
                                                    <span className="absolute -top-2.5 left-4 bg-white px-2 py-0.5 text-[9px] font-black text-[#024495] uppercase tracking-widest border border-blue-100 rounded-full shadow-2xs">Barcode</span>
                                                    <div className="w-full bg-white p-2.5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center shadow-xs overflow-hidden">
                                                        <img src={result.barcode} alt="Secret Barcode" className="h-12 w-full object-contain" />
                                                        {result.secretKey && (
                                                            <span className="mt-1.5 font-mono text-xs font-bold tracking-widest text-slate-800">
                                                                {result.secretKey.length === 13 
                                                                    ? result.secretKey.replace(/(\d{4})(\d{4})(\d{4})(\d{1})/, '$1 $2 $3 $4')
                                                                    : result.secretKey}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <p className="mb-6 text-xs text-gray-500 font-medium leading-relaxed">
                                    Student has been registered. You can now tap their NFC card on the reader to link it to this account.
                                </p>

                                <button
                                    onClick={closeRegModal}
                                    className="w-full cursor-pointer rounded-xl bg-[#024495] py-3.5 text-base font-bold text-white shadow-lg shadow-[#024495]/20 hover:bg-[#013575] hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Proceed to Link Card
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                    <XCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <h3 className="mb-2 text-2xl font-extrabold text-red-600 tracking-tight">
                                    Registration Failed
                                </h3>
                                <p className="mb-6 text-sm font-semibold text-gray-600">
                                    {result.message}
                                </p>

                                <button
                                    onClick={closeRegModal}
                                    className="w-full cursor-pointer rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Go Back & Edit
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* RFID Link Result Modal */}
            {showRfidModal && rfidLinkResult && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md transition-all duration-300"
                    onClick={closeRfidModal}
                >
                    <div
                        className="w-full max-w-md rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative flex flex-col items-center text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={closeRfidModal}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {rfidLinkResult.success ? (
                            <>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <h3 className="mb-2 text-2xl font-extrabold text-gray-900 tracking-tight">
                                    NFC Card Linked!
                                </h3>
                                <p className="mb-6 text-sm font-semibold text-gray-600">
                                    {rfidLinkResult.message}
                                </p>

                                <button
                                    onClick={closeRfidModal}
                                    className="w-full cursor-pointer rounded-xl bg-[#024495] py-3.5 text-base font-bold text-white shadow-lg shadow-[#024495]/20 hover:bg-[#013575] hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Register Another Student
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                    <XCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <h3 className="mb-2 text-2xl font-extrabold text-red-600 tracking-tight">
                                    Linking Failed
                                </h3>
                                <p className="mb-6 text-sm font-semibold text-gray-600">
                                    {rfidLinkResult.message}
                                </p>

                                <button
                                    onClick={closeRfidModal}
                                    className="w-full cursor-pointer rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
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
    const [showLinkModal, setShowLinkModal] = useState(false);
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
            setShowLinkModal(true);
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
            setShowLinkModal(true);
        }
    };

    const closeLinkModal = () => {
        setShowLinkModal(false);
        if (linkResult) {
            if (linkResult.success) {
                setSelectedStudent(null);
                setLinkResult(null);
                setIsWaitingForRfid(false);
            } else {
                setLinkResult(null);
                setIsWaitingForRfid(true);
            }
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

                        {isWaitingForRfid ? (
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

            {/* RFID Link Result Modal */}
            {showLinkModal && linkResult && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md transition-all duration-300"
                    onClick={closeLinkModal}
                >
                    <div
                        className="w-full max-w-md rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative flex flex-col items-center text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={closeLinkModal}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {linkResult.success ? (
                            <>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <h3 className="mb-2 text-2xl font-extrabold text-gray-900 tracking-tight">
                                    NFC Card Linked!
                                </h3>
                                <p className="mb-6 text-sm font-semibold text-gray-600">
                                    {linkResult.message}
                                </p>

                                <button
                                    onClick={closeLinkModal}
                                    className="w-full cursor-pointer rounded-xl bg-[#024495] py-3.5 text-base font-bold text-white shadow-lg shadow-[#024495]/20 hover:bg-[#013575] hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Link Another Student
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                    <XCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <h3 className="mb-2 text-2xl font-extrabold text-red-600 tracking-tight">
                                    Linking Failed
                                </h3>
                                <p className="mb-6 text-sm font-semibold text-gray-600">
                                    {linkResult.message}
                                </p>

                                <button
                                    onClick={closeLinkModal}
                                    className="w-full cursor-pointer rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =============================================
   TAB 3: Verify (Multi-Modal)
   ============================================= */
function VerifyTab({ faceThreshold = 0.55 }: { faceThreshold?: number }) {
    type VerifyMode = 'face' | 'rfid' | 'qr' | 'barcode';
    const [verifyMode, setVerifyMode] = useState<VerifyMode>('rfid');
    const [scannedStudent, setScannedStudent] = useState<StudentData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSimModal, setShowSimModal] = useState(false);
    const [simInput, setSimInput] = useState('');
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);

    const barcodeBuffer = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resetRef = useRef<NodeJS.Timeout | null>(null);

    // Helpers from TapToLogin
    const getProgramAndYear = (course: string = '') => {
        const yearMatch = course.match(/(\d+(?:st|nd|rd|th)?\s+Year)$/i);
        if (yearMatch) {
            const yearLevel = yearMatch[0];
            const program = course.replace(yearLevel, '').trim();
            return { program, yearLevel };
        }
        return { program: course, yearLevel: 'N/A' };
    };

    const StudentCard = ({ student }: { student: any }) => {
        if (!student) return null;
        const { program, yearLevel } = getProgramAndYear(student.COURSE);
        
        return (
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden relative z-10 border border-gray-100 flex flex-col p-10 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-slate-50 rounded-full border-[3px] border-[#024495] flex items-center justify-center p-1 mb-4 overflow-hidden">
                        {student.PIC ? (
                            <img src={resolveImageUrl(student.PIC)} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <User className="text-[#024495] w-12 h-12" />
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-[#024495] text-center leading-tight">
                        {student.FN} {student.MN ? `${student.MN.charAt(0)}.` : ''} {student.LN}
                    </h2>
                    <p className="text-[#ffb300] font-bold text-sm mt-1">
                        ID: {student.STUDENT_NUMBER}
                    </p>
                </div>
                
                <div className="flex flex-col gap-4 text-sm w-full divide-y divide-gray-100 border-t border-b border-gray-100 py-6 mb-6">
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-[#024495]">Program:</span>
                        <span className="text-gray-600 text-right">{program}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <span className="font-bold text-[#024495]">Year Level:</span>
                        <span className="text-gray-600">{yearLevel}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <span className="font-bold text-[#024495]">Status:</span>
                        <span className="text-green-600 font-semibold">{student.ID_STATUS}</span>
                    </div>
                </div>

                <div className="flex justify-center mt-2">
                    <div className="bg-green-100/80 text-green-700 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider">
                        ACCESS AUTHORIZED
                    </div>
                </div>
            </div>
        );
    };

    // Refs for Scanner Logic (preventing closure capturing stale state)
    const isProcessingRef = useRef(false);
    const scannedStudentRef = useRef<StudentData | null>(null);

    // Sync refs with state
    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    useEffect(() => {
        scannedStudentRef.current = scannedStudent;
    }, [scannedStudent]);

    const lastVerifyRef = useRef<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hudCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const verifyIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Initialize Video for Camera Modes (Face/QR)
    useEffect(() => {
        if (verifyMode !== 'face' && verifyMode !== 'qr') {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (verifyIntervalRef.current) clearInterval(verifyIntervalRef.current);
            return;
        }

        const initCamera = async () => {
            try {
                if (verifyMode === 'face') {
                    const faceapi = await import('@vladmandic/face-api');
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    ]);
                    setIsModelsLoaded(true);
                }
                
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("camera init error", err);
                setError("Failed to initialize camera.");
            }
        };

        initCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (verifyIntervalRef.current) clearInterval(verifyIntervalRef.current);
        };
    }, [verifyMode]);

    // 2. HUD Tracking Loop (Face Landmarks / QR Highlights)
    useEffect(() => {
        if ((verifyMode !== 'face' || !isModelsLoaded) && verifyMode !== 'qr') return;

        let animationId: number;
        const trackHUD = async () => {
            if (!videoRef.current || !hudCanvasRef.current || scannedStudent) {
                if (hudCanvasRef.current) {
                    const ctx = hudCanvasRef.current.getContext('2d');
                    ctx?.clearRect(0, 0, hudCanvasRef.current.width, hudCanvasRef.current.height);
                }
                animationId = requestAnimationFrame(trackHUD);
                return;
            }

            const video = videoRef.current;
            const canvas = hudCanvasRef.current;
            if (video.paused || video.ended || video.readyState !== 4) {
                animationId = requestAnimationFrame(trackHUD);
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            try {
                if (verifyMode === 'face') {
                    const faceapi = await import('@vladmandic/face-api');
                    // Get landmarks and descriptors in a single call for efficiency
                    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    if (detections.length > 0) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        const primaryDetection = detections.reduce((prev, current) => 
                            (prev.detection.box.area > current.detection.box.area) ? prev : current
                        );

                        const dims = faceapi.matchDimensions(canvas, video, true);
                        const resizedResult = faceapi.resizeResults(primaryDetection, dims);
                        const points = resizedResult.landmarks.positions;
                        const box = resizedResult.detection.box;

                        // 1. CORNER BRACKETS (Sight Frame)
                        ctx.strokeStyle = '#024495';
                        ctx.lineWidth = 4;
                        const bLen = Math.min(box.width, box.height) * 0.2;
                        // TL
                        ctx.beginPath(); ctx.moveTo(box.x, box.y + bLen); ctx.lineTo(box.x, box.y); ctx.lineTo(box.x + bLen, box.y); ctx.stroke();
                        // TR
                        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y); ctx.lineTo(box.x + box.width, box.y); ctx.lineTo(box.x + box.width, box.y + bLen); ctx.stroke();
                        // BL
                        ctx.beginPath(); ctx.moveTo(box.x, box.y + box.height - bLen); ctx.lineTo(box.x, box.y + box.height); ctx.lineTo(box.x + bLen, box.y + box.height); ctx.stroke();
                        // BR
                        ctx.beginPath(); ctx.moveTo(box.x + box.width - bLen, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height); ctx.lineTo(box.x + box.width, box.y + box.height - bLen); ctx.stroke();
                        
                        // 2. DENSE TRIANGULATED MESH
                        ctx.lineWidth = 1.2;
                        ctx.strokeStyle = '#ffb300';
                        ctx.beginPath();
                        ctx.setLineDash([1, 1]);
                        const triLinks = [
                            [17, 37], [18, 38], [19, 38], [20, 39], [21, 39], // L Brows to Eye
                            [22, 42], [23, 43], [24, 44], [25, 45], [26, 45], // R Brows to Eye
                            [36, 17], [45, 26],                               // Temples
                            [21, 27], [22, 27], [27, 39], [27, 42],           // Nose bridge connections
                            [31, 39], [35, 42], [33, 51], [33, 48], [33, 54], // Nose base to mouth
                            [48, 4], [54, 12], [57, 8], [51, 8],              // Mouth to Jaw
                            [31, 2], [35, 14], [39, 31], [42, 35]             // Cheek/Nose triangles
                        ];
                        triLinks.forEach(([p1, p2]) => {
                            ctx.moveTo(points[p1].x, points[p1].y);
                            ctx.lineTo(points[p2].x, points[p2].y);
                        });
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // 3. CORE FEATURE OUTLINES
                        ctx.lineWidth = 2.5;
                        const segments = [
                            [0, 16, false],  // Jawline
                            [17, 21, false], // L-Brow
                            [22, 26, false], // R-Brow
                            [27, 30, false], // Nose Bridge
                            [31, 35, true],  // Nose Base
                            [36, 41, true],  // L-Eye
                            [42, 47, true],  // R-Eye
                            [48, 59, true],  // Outer Lips
                        ];
                        segments.forEach(([start, end, close]) => {
                            ctx.beginPath();
                            ctx.moveTo(points[start].x, points[start].y);
                            for(let i = (start as number) + 1; i <= (end as number); i++) ctx.lineTo(points[i].x, points[i].y);
                            if(close) ctx.lineTo(points[start as number].x, points[start as number].y);
                            ctx.stroke();
                        });

                        // 4. NODES (Point Cloud)
                        ctx.fillStyle = '#ffb300';
                        for (let i = 0; i < 68; i++) {
                            ctx.beginPath();
                            ctx.arc(points[i].x, points[i].y, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // 5. UNIFIED IDENTIFICATION TRIGGER
                        const now = Date.now();
                        if (!isProcessingRef.current && !scannedStudentRef.current && (now - lastVerifyRef.current > 1500)) {
                            lastVerifyRef.current = now;
                            verifyFace(Array.from(primaryDetection.descriptor));
                        }
                    } else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                } else if (verifyMode === 'qr') {
                    const jsQR = (await import('jsqr')).default;
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = video.videoWidth;
                    tempCanvas.height = video.videoHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });

                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        if (code) {
                            const loc = code.location;
                            // Draw highlight box
                            ctx.strokeStyle = '#024495';
                            ctx.lineWidth = 4;
                            ctx.beginPath();
                            ctx.moveTo(loc.topLeftCorner.x, loc.topLeftCorner.y);
                            ctx.lineTo(loc.topRightCorner.x, loc.topRightCorner.y);
                            ctx.lineTo(loc.bottomRightCorner.x, loc.bottomRightCorner.y);
                            ctx.lineTo(loc.bottomLeftCorner.x, loc.bottomLeftCorner.y);
                            ctx.closePath();
                            ctx.stroke();

                            // Trigger verification if match
                            if (!isProcessing && !scannedStudent) {
                                verifyIdentifier(code.data, 'qr');
                            }
                        }
                    }
                }
            } catch (err) {
                // console.error("HUD track error", err);
            }
            animationId = requestAnimationFrame(trackHUD);
        };

        trackHUD();
        return () => cancelAnimationFrame(animationId);
    }, [isModelsLoaded, verifyMode, scannedStudent, faceThreshold]);

    // Verification Logic (Generic)
    const verifyIdentifier = async (id: string, type: VerifyMode) => {
        if (!id || id.trim() === '' || isProcessing) return;
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
                body: JSON.stringify({ id, type }),
                signal: abortControllerRef.current?.signal, // Use signal
            });
            const data = await response.json();

            // Ignore if mode changed or component unmounted
            if (type !== verifyMode) return;

            if (response.ok && data.success) {
                setScannedStudent(data.student);
                if (resetRef.current) clearTimeout(resetRef.current);
                resetRef.current = setTimeout(() => {
                    setScannedStudent(null);
                    // Minimal delay before re-enabling scans
                    setTimeout(() => setIsProcessing(false), 2000);
                }, 4000);
            } else {
                setError(data.message || 'Identifier not recognized.');
                setScannedStudent(null);
                setTimeout(() => setIsProcessing(false), 3000);
            }
        } catch {
            setError('Network error. Please check backend.');
        } finally {
            setIsProcessing(false);
        }
    };

    const verifyFace = async (descriptor: number[]) => {
        setIsProcessing(true);
        setError(null);
        try {
            const response = await fetch('/api/student-registration/verify-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ descriptor }),
                signal: abortControllerRef.current?.signal, // Use signal
            });
            const data = await response.json();

            // Ignore if mode changed
            if (verifyMode !== 'face') return;

            if (response.ok && data.success) {
                setScannedStudent(data.student);
                if (resetRef.current) clearTimeout(resetRef.current);
                resetRef.current = setTimeout(() => {
                    setScannedStudent(null);
                    setTimeout(() => setIsProcessing(false), 3500);
                }, 4000);
            } else {
                if (data.best_distance) {
                    setError(`${data.message || 'Face not recognized'} (Dist: ${data.best_distance.toFixed(3)})`);
                } else if (data.message !== 'Face not recognized.' && data.message !== 'Face not recognized or not registered.') {
                    setError(data.message || 'Face recognition failed.');
                }
                setScannedStudent(null);
                setTimeout(() => setIsProcessing(false), 1500); // Reduced cooldown to 1.5s
            }
        } catch {
            setError('Face recognition service error.');
            setTimeout(() => setIsProcessing(false), 1500);
        } finally {
            // Processing state is handled by timeouts for better UX
        }
    };

    // Keyboard Listener for Scanners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isProcessing || showSimModal || verifyMode === 'face') return;
            if (e.key === 'Enter') {
                e.preventDefault();
                const code = barcodeBuffer.current;
                barcodeBuffer.current = '';
                if (code.length > 0) verifyIdentifier(code, verifyMode);
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
    }, [isProcessing, showSimModal, verifyMode]);

    useEffect(() => {
        return () => {
            if (resetRef.current) clearTimeout(resetRef.current);
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Mode Selection */}
            <div className="flex w-full max-w-2xl gap-2 rounded-2xl bg-white p-2 shadow-sm border border-gray-100">
                {[
                    { id: 'rfid' as VerifyMode, label: 'RFID Card', icon: CreditCard },
                    { id: 'face' as VerifyMode, label: 'Face Recognition', icon: Camera },
                    { id: 'qr' as VerifyMode, label: 'QR Code', icon: QrCode },
                    { id: 'barcode' as VerifyMode, label: 'Barcode', icon: Barcode },
                ].map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => {
                            // Cancel any pending request
                            if (abortControllerRef.current) abortControllerRef.current.abort();
                            abortControllerRef.current = new AbortController();

                            setVerifyMode(mode.id);
                            setScannedStudent(null);
                            setIsProcessing(false); // CRITICAL RESET
                            setError(null);
                        }}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-4 transition-all duration-200 ${
                            verifyMode === mode.id
                                ? 'bg-[#024495] text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <mode.icon className="h-5 w-5" />
                        <span className="font-bold text-sm">{mode.label}</span>
                    </button>
                ))}
            </div>

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
                            <h3 className="mb-2 font-bold text-gray-900 capitalize">
                                Simulate {verifyMode} Scan
                            </h3>
                            <p className="mb-4 text-xs text-gray-500">
                                Enter an identifier to test.
                            </p>
                            <input
                                type="text"
                                value={simInput}
                                onChange={(e) => setSimInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setShowSimModal(false);
                                        verifyIdentifier(simInput, verifyMode);
                                        setSimInput('');
                                    }
                                }}
                                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:ring-2 focus:ring-[#024495] focus:outline-none"
                                placeholder={`Enter ${verifyMode} data...`}
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
                                        verifyIdentifier(simInput, verifyMode);
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

                <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    {/* 1. SUCCESS RESULT VIEW */}
                    {scannedStudent && (
                        <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <StudentCard student={scannedStudent} />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                                Resuming scanner in a few seconds...
                            </p>
                        </div>
                    )}

                    {/* 2. SCANNER VIEW (Always mounted to preserve video stream) */}
                    <div className={`${scannedStudent ? 'hidden' : 'space-y-6'}`}>
                        {verifyMode === 'face' || verifyMode === 'qr' ? (
                            <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl border-4 border-gray-100 bg-black shadow-lg">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{ transform: 'scaleX(-1)' }}
                                    className={`absolute inset-0 h-full w-full object-cover brightness-110 ${isProcessing ? 'opacity-50 grayscale' : ''}`}
                                />
                                <canvas
                                    ref={hudCanvasRef}
                                    style={{ transform: 'scaleX(-1)' }}
                                    className="absolute inset-0 z-10 h-full w-full pointer-events-none"
                                />
                                {isProcessing && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                                        <Loader2 className="h-10 w-10 animate-spin text-white" />
                                    </div>
                                )}
                                {verifyMode === 'face' && !isModelsLoaded && (
                                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90">
                                        <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#024495]" />
                                        <p className="text-xs font-black text-[#024495] uppercase">
                                            Loading Eye Logic...
                                        </p>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                    <p className="text-sm font-black text-white uppercase tracking-widest">
                                        {isProcessing
                                            ? 'Identifying User...'
                                            : verifyMode === 'face'
                                              ? 'Scanning for face...'
                                              : 'Align QR Code...'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-12">
                                <div
                                    className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed transition-all duration-500 ${isProcessing ? 'animate-pulse border-[#ffb300]' : 'border-gray-200 bg-gray-50'}`}
                                >
                                    {verifyMode === 'rfid' && (
                                        <CreditCard
                                            className={`h-16 w-16 ${isProcessing ? 'text-[#ffb300]' : 'text-gray-300'}`}
                                        />
                                    )}
                                    {verifyMode === 'barcode' && (
                                        <Barcode
                                            className={`h-16 w-16 ${isProcessing ? 'text-[#ffb300]' : 'text-gray-300'}`}
                                        />
                                    )}
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-gray-800">
                                    Waiting for {verifyMode} scan...
                                </h3>
                                <p className="mt-2 mx-auto max-w-[300px] text-sm leading-relaxed text-gray-500">
                                    {verifyMode === 'rfid' &&
                                        'Tap the NFC card on the reader to identify the student.'}
                                    {verifyMode === 'barcode' &&
                                        'Scan the library ID barcode to proceed.'}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                                <p className="text-sm font-bold text-red-700">{error}</p>
                            </div>
                        )}
                    </div>

                    {verifyMode !== 'face' && (
                        <button
                            onClick={() => setShowSimModal(true)}
                            className="mt-8 cursor-pointer rounded-xl border border-blue-200 bg-blue-50 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#024495] transition-all hover:bg-blue-100 active:scale-95"
                        >
                            Simulate scanner (Dev Mode)
                        </button>
                    )}
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

            const detections = await faceapi
                .detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.75, // Increased sensitivity
                    }),
                )
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length === 0) {
                alert(
                    'No face detected clearly. Please make sure your face is visible and try again.',
                );
                setIsProcessing(false);
                return;
            }

            // PRIMARY FACE SELECTION: Filter for largest face to avoid background enrollment
            const primaryFace = detections.reduce((prev, current) => 
                (prev.detection.box.area > current.detection.box.area) ? prev : current
            );

            const descriptor = Array.from(primaryFace.descriptor);
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

            const detections = await faceapi
                .detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.75, // Increased sensitivity
                    }),
                )
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length === 0) {
                alert(
                    'No face detected clearly. Please ensure your glasses are on and try again.',
                );
                setIsProcessing(false);
                return;
            }

            // PRIMARY FACE SELECTION: Filter for largest face
            const primaryFace = detections.reduce((prev, current) => 
                (prev.detection.box.area > current.detection.box.area) ? prev : current
            );

            const descriptor = Array.from(primaryFace.descriptor);
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
