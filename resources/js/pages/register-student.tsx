import { Head } from '@inertiajs/react';
import {
    UserPen,
    CheckCircle2,
    Loader2,
    Camera,
    Mail,
    AlertCircle,
    User,
    BookOpen
} from 'lucide-react';
import { useState, useRef } from 'react';

const getCsrfToken = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || '';

interface StudentData {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    SEX: string | null;
    BIRTHDAY: string | null;
    CONTACT_NUMBER: string | null;
    EMAIL: string | null;
    COURSE: string | null;
    ADDRESS: string | null;
}

export default function RegisterStudent() {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{
        student: StudentData;
        message: string;
    } | null>(null);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
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
        setErrorMsg(null);

        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                formData.append(key, value);
            });
            if (picFile) {
                formData.append('PIC', picFile);
            }

            const response = await fetch('/api/student-registration/public-register', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessData({
                    student: data.student,
                    message: data.message,
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setErrorMsg(data.message || 'Validation failed. Please check your inputs.');
            }
        } catch {
            setErrorMsg('A network error occurred. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
                <Head title="Registration Successful" />
                <div className="w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-12 text-center shadow-xl border border-gray-100 animate-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-inner">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Registration Complete</h2>
                    <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
                        {successData.message}
                    </p>

                    {/* Student Info Card */}
                    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-[#024495]/5 to-transparent border border-[#024495]/10 rounded-2xl p-6 text-left mb-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-[#024495] mb-1">
                                    {successData.student.FN} {successData.student.LN}
                                </h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Registered Student</p>
                            </div>
                            <span className="bg-[#024495] text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
                                Active Account
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                                <span className="text-gray-500 font-medium">Library ID</span>
                                <span className="font-mono font-bold text-gray-900">{successData.student.LIBRARY_ID}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                                <span className="text-gray-500 font-medium">Student Number</span>
                                <span className="font-bold text-gray-900">{successData.student.STUDENT_NUMBER}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                                <span className="text-gray-500 font-medium">Course</span>
                                <span className="font-medium text-gray-800">{successData.student.COURSE}</span>
                            </div>
                            {successData.student.EMAIL && (
                                <div className="flex justify-between text-sm py-1.5">
                                    <span className="text-gray-500 font-medium">Email</span>
                                    <span className="font-medium text-gray-800">{successData.student.EMAIL}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#024495]/5 rounded-2xl p-5 border border-[#024495]/10 text-left text-sm text-[#024495] mb-8 leading-relaxed flex gap-3.5 items-start">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block mb-1">Next Step for Onboarding:</span>
                            Please visit the library desk to present your Library ID. The librarian will scan and link your physical NFC Card and register your face for smart login.
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setSuccessData(null);
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
                        }}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 bg-[#024495] text-white font-bold rounded-xl shadow-lg shadow-[#024495]/10 hover:bg-[#013575] hover:shadow-xl transition-all duration-200"
                    >
                        Register Another Student
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f7fa] flex flex-col font-sans">
            <Head title="Student Self-Registration" />
            
            {/* Elegant Top Header Banner */}
            <header className="bg-white border-b border-gray-100 shadow-sm py-5 px-6 sticky top-0 z-40 backdrop-blur-md bg-white/95">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#024495] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#024495]/15">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">NAAP LIBRARY</h1>
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Self-Registration</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:px-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8 mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Student Self-Registration</h2>
                            <p className="text-sm text-gray-500 font-medium">
                                Complete this form to request your library account. Make sure your details match your official student records.
                            </p>
                        </div>

                        {/* Profile Picture Uploader */}
                        <div className="shrink-0 mx-auto sm:mx-0">
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

                    {errorMsg && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex gap-3 items-center font-medium animate-in fade-in duration-300">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student Number */}
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                Student Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="STUDENT_NUMBER"
                                value={form.STUDENT_NUMBER}
                                onChange={handleChange}
                                required
                                placeholder="e.g. 2026-00123-MN-0"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>

                        {/* Name Grid */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    First Name <span className="text-red-500">*</span>
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
                                    Last Name <span className="text-red-500">*</span>
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

                        {/* Sex & Birthday */}
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

                        {/* Contact & Email */}
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

                        {/* Course */}
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                Course / Program <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="COURSE"
                                value={form.COURSE}
                                onChange={handleChange}
                                required
                                placeholder="e.g. BS AMT 1st Year"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                Address
                            </label>
                            <textarea
                                name="ADDRESS"
                                value={form.ADDRESS}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Enter your full home address"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-[#024495] focus:outline-none resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#024495] px-12 py-4 text-lg font-bold text-white shadow-lg shadow-[#024495]/20 transition-all duration-200 hover:bg-[#013575] hover:shadow-xl hover:shadow-[#024495]/30 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Submitting Form...
                                    </>
                                ) : (
                                    <>
                                        <UserPen className="h-5 w-5" />
                                        Register Now
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Simple footer */}
            <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-semibold mt-10">
                <p>&copy; {new Date().getFullYear()} NAAP Library System. All rights reserved.</p>
            </footer>
        </div>
    );
}
