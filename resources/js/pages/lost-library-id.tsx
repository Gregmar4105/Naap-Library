import { Head, router } from '@inertiajs/react';
import {
    Search,
    FileText,
    Upload,
    CheckCircle2,
    ShieldCheck,
    MapPin,
    AlertCircle,
    User,
    Loader2,
    ArrowRight,
    ArrowLeft,
    IdCard,
    FileSearch,
    PlusCircle,
    Check,
    Undo2,
    Camera,
    Trash2,
    X,
    Eye,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { useEffect, useState, useRef } from 'react';
import { resolveImageUrl } from '@/lib/media';
import AppLayout from '@/layouts/app-layout';

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
    COURSE: string | null;
    PIC: string | null;
    ID_STATUS: string | null;
    EMAIL: string | null;
    CONTACT_NUMBER: string | null;
    SEX: string | null;
    BIRTHDAY: string | null;
    ADDRESS: string | null;
}

type Step = 'search' | 'verify' | 'document' | 'success';

export default function LostLibraryId() {
    const [step, setStep] = useState<Step>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StudentData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [registrationResult, setRegistrationResult] = useState<{ success: boolean; student: StudentData; report: any } | null>(null);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

    // Form State
    const [locationLost, setLocationLost] = useState('');
    const [description, setDescription] = useState('');
    const [affidavitFile, setAffidavitFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ new_id: string } | null>(null);

    // Verification Checklist
    const [verifiedIdentities, setVerifiedIdentities] = useState({
        personallyVerified: false,
        affidavitPresented: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const response = await fetch(`/api/lost-library-id/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectStudent = (student: StudentData) => {
        setSelectedStudent(student);
        setStep('verify');
        // Reset form when switching students
        setVerifiedIdentities({ personallyVerified: false, affidavitPresented: false });
        setLocationLost('');
        setDescription('');
        setAffidavitFile(null);
        setFilePreview(null);
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const removeAffidavit = () => {
        setAffidavitFile(null);
        setCapturedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePhotoCaptured = (dataUrl: string, file: File) => {
        setCapturedImage(dataUrl);
        setAffidavitFile(file);
        setShowCamera(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAffidavitFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setCapturedImage(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStudent || !affidavitFile) return;
        
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('old_library_id', selectedStudent.LIBRARY_ID);
        formData.append('location_lost', locationLost || 'Not Specified');
        formData.append('description', description || 'Not Specified');
        formData.append('affidavit', affidavitFile);

        try {
            const response = await fetch('/api/lost-library-id/report', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setSuccessData({ new_id: data.new_library_id });
                setStep('success');
            } else {
                setError(data.message || 'Failed to process report.');
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Lost Library ID Documentation" />
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f6fa]">
                {/* Pattern Background matching Telegram/Emails */}
                <div 
                    className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)`,
                        backgroundSize: '20px 20px',
                    }}
                />

                <div className="relative z-10 flex flex-1 flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
                    
                    {/* Header Area */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-[#024495] flex items-center gap-3">
                                <div className="h-12 w-12 bg-[#024495] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#024495]/20">
                                    <FileSearch className="h-6 w-6" />
                                </div>
                                Lost Library ID Workflow
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium ml-16">
                                Document lost credentials and issue new registered user IDs.
                            </p>
                        </div>

                        {/* Stepper Progress */}
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl p-2 px-5 shadow-xl shadow-blue-500/5">
                            {(['search', 'verify', 'document', 'success'] as Step[]).map((s, i) => (
                                <div key={s} className="flex items-center">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                                        step === s ? 'bg-[#024495] text-white ring-4 ring-[#024495]/15 scale-110 shadow-lg' : 
                                        (['search', 'verify', 'document', 'success'].indexOf(step) > i) ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        { (['search', 'verify', 'document', 'success'].indexOf(step) > i) ? <Check className="h-4 w-4" /> : i + 1 }
                                    </div>
                                    { i < 3 && <div className={`h-1.5 w-8 mx-1.5 rounded-full transition-colors duration-500 ${(['search', 'verify', 'document', 'success'].indexOf(step) > i) ? 'bg-green-500' : 'bg-gray-100'}`} /> }
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Workflow Content */}
                    <div className="relative flex-1 mt-4">
                        
                        {/* STEP 1: SEARCH */}
                        {step === 'search' && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto w-full">
                                <div className="relative mb-8 group">
                                    <div className="absolute inset-0 bg-[#024495]/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                    
                                    <div className="relative flex items-center gap-4 bg-white shadow-2xl shadow-blue-500/10 border-2 border-dashed border-gray-200 rounded-[2rem] px-6 py-4 focus-within:border-[#024495] focus-within:bg-white transition-all">
                                        <div className="h-10 w-10 bg-[#024495]/5 rounded-xl flex items-center justify-center text-[#024495] group-focus-within:bg-[#024495] group-focus-within:text-white transition-all duration-300 shrink-0">
                                            <Search className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search student by Name or Student Number..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-1 bg-transparent text-xl font-black text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-bold border-none ring-0 focus:ring-0 p-0"
                                            autoFocus
                                        />
                                        {isSearching && (
                                            <div className="shrink-0">
                                                <Loader2 className="h-6 w-6 animate-spin text-[#024495]" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                            {searchResults.length > 0 ? (
                                <div className="flex flex-col gap-2 bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-gray-100 shadow-xl">
                                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Search Results ({searchResults.length})</span>
                                    </div>
                                    <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {searchResults.map((student) => (
                                            <button
                                                key={student.LIBRARY_ID}
                                                onClick={() => handleSelectStudent(student)}
                                                className="group flex items-center gap-4 p-4 hover:bg-[#024495] transition-all duration-200 text-left border-b last:border-0 border-gray-50 active:scale-95"
                                            >
                                                <div className="h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm shrink-0 group-hover:border-white/30 transition-colors">
                                                    {student.PIC ? (
                                                        <img src={resolveImageUrl(student.PIC)} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-full w-full p-2 text-gray-400 group-hover:text-white/50" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <p className="font-black truncate text-gray-900 group-hover:text-white uppercase tracking-tight transition-colors">
                                                            {student.FN} {student.LN}
                                                        </p>
                                                        <span className="font-mono text-xs font-black bg-blue-50 group-hover:bg-white/20 text-[#024495] group-hover:text-white px-2 py-0.5 rounded-lg transition-all shrink-0 ml-4">
                                                            {student.LIBRARY_ID}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-500 group-hover:text-blue-100 truncate transition-colors">
                                                        {student.STUDENT_NUMBER} · {student.COURSE || 'No Course'}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-[#024495] opacity-0 -translate-x-2 group-hover:text-white group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : searchQuery.length >= 2 && !isSearching ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <AlertCircle className="h-16 w-16 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No active student found with that name or number.</p>
                                    <p className="text-sm">They might already be deactivated or not yet registered.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-[#024495]/5 blur-2xl rounded-full scale-150" />
                                        <div className="relative h-24 w-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-xl">
                                            <Search className="h-10 w-10 text-[#024495]/20" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Search for a Student</h3>
                                    <p className="text-gray-400 mt-2 font-medium max-w-[280px]">
                                        Type a name or student number above to document a lost ID.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: VERIFICATION */}
                    {step === 'verify' && selectedStudent && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col lg:flex-row gap-8">
                            
                            {/* Student Profile Card */}
                            <div className="lg:w-1/3 flex flex-col gap-6">
                                <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                                    <div className="flex flex-col items-center text-center relative z-10">
                                        <div className="h-32 w-32 rounded-full p-1.5 border border-[#024495]/10 bg-gray-50 mb-6 shadow-inner">
                                            <div className="h-full w-full rounded-full overflow-hidden bg-gray-100 shadow-sm border border-white">
                                                {selectedStudent.PIC ? (
                                                    <img src={resolveImageUrl(selectedStudent.PIC)} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-full w-full p-6 text-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 uppercase leading-tight tracking-tighter">
                                            {selectedStudent.FN}<br/>{selectedStudent.LN}
                                        </h2>
                                        <p className="text-[11px] font-black text-[#024495] mt-2 uppercase tracking-[0.2em] bg-blue-50 px-4 py-1 rounded-full">
                                            {selectedStudent.COURSE || 'No Course Set'}
                                        </p>
                                        
                                        <div className="mt-8 grid grid-cols-1 gap-3 w-full text-left">
                                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Student Number</p>
                                                    <p className="font-mono font-bold text-gray-800">{selectedStudent.STUDENT_NUMBER}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Gender</p>
                                                    <p className="text-sm font-black text-[#024495]">{selectedStudent.SEX || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Contact / Email</p>
                                                <p className="text-xs font-bold text-gray-700 truncate">{selectedStudent.EMAIL || 'N/A'}</p>
                                                <p className="text-[10px] font-black text-[#024495] mt-1 tracking-widest">{selectedStudent.CONTACT_NUMBER || 'No phone'}</p>
                                            </div>

                                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Birthday</p>
                                                <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                                                    {selectedStudent.BIRTHDAY ? new Date(selectedStudent.BIRTHDAY).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setStep('search')}
                                    className="flex items-center justify-center gap-2 py-4 rounded-2xl text-gray-400 font-bold hover:text-[#024495] transition-colors"
                                >
                                    <Undo2 className="h-4 w-4" /> Go Back to Search
                                </button>
                            </div>

                            {/* Verification Logic */}
                            <div className="lg:w-2/3 space-y-6">
                                <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center">
                                            <ShieldCheck className="h-8 w-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">Personal Verification</h2>
                                            <p className="text-gray-500">Confirm the student's identity through physical evidence.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                                            verifiedIdentities.personallyVerified ? 'bg-green-50 border-green-500 shadow-lg shadow-green-500/10' : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}>
                                            <input 
                                                type="checkbox" 
                                                className="h-6 w-6 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                checked={verifiedIdentities.personallyVerified}
                                                onChange={(e) => setVerifiedIdentities(prev => ({ ...prev, personallyVerified: e.target.checked }))}
                                            />
                                            <div>
                                                <p className="font-black text-gray-900">In-Person Verification</p>
                                                <p className="text-sm text-gray-500">I have personally verified the student's identity against their face and records.</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                                            verifiedIdentities.affidavitPresented ? 'bg-green-50 border-green-500 shadow-lg shadow-green-500/10' : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}>
                                            <input 
                                                type="checkbox" 
                                                className="h-6 w-6 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                checked={verifiedIdentities.affidavitPresented}
                                                onChange={(e) => setVerifiedIdentities(prev => ({ ...prev, affidavitPresented: e.target.checked }))}
                                            />
                                            <div>
                                                <p className="font-black text-gray-900">Physical Affidavit Presented</p>
                                                <p className="text-sm text-gray-500">The student has presented the original physical copy of the Affidavit of Loss.</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="mt-12 flex justify-end">
                                        <button
                                            disabled={!verifiedIdentities.personallyVerified || !verifiedIdentities.affidavitPresented}
                                            onClick={() => setStep('document')}
                                            className="flex items-center gap-3 bg-[#024495] text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                        >
                                            Prepare Documentation <ArrowRight className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                        {/* STEP 3: DOCUMENTATION */}
                        {step === 'document' && selectedStudent && (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Side: Instructions & Selection */}
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 h-full">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="h-12 w-12 bg-blue-50 text-[#024495] rounded-2xl flex items-center justify-center">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Digital Documentation</h2>
                                                    <p className="text-xs font-bold text-gray-400">Step 3 of 4: Documentation</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                                    <p className="text-sm font-bold text-yellow-800 leading-relaxed">
                                                        Please upload a clear digital scan or capture a live photo of the student's **Affidavit of Loss**.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                    <button
                                                        onClick={() => setShowCamera(true)}
                                                        className="flex items-center gap-4 p-5 bg-[#024495] text-white rounded-[1.5rem] hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                                                    >
                                                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                                                            <Camera className="h-6 w-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black uppercase tracking-tight">Take a Picture</p>
                                                            <p className="text-[10px] opacity-70 font-bold">Use system camera</p>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => document.getElementById('affidavit-upload')?.click()}
                                                        className="flex items-center gap-4 p-5 bg-white border-2 border-dashed border-gray-200 text-gray-600 rounded-[1.5rem] hover:border-[#024495] hover:text-[#024495] transition-all active:scale-95"
                                                    >
                                                        <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center">
                                                            <Upload className="h-6 w-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black uppercase tracking-tight">Upload File</p>
                                                            <p className="text-[10px] opacity-70 font-bold">PDF, JPG, or PNG</p>
                                                        </div>
                                                        <input 
                                                            id="affidavit-upload"
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*,application/pdf"
                                                            onChange={handleFileChange}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Preview & Action */}
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex-1 flex flex-col items-center justify-center min-h-[400px]">
                                            {capturedImage ? (
                                                <div className="w-full h-full flex flex-col">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black uppercase text-gray-400">Document Preview</span>
                                                        <button 
                                                            onClick={removeAffidavit}
                                                            className="h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex-1 rounded-[1.5rem] overflow-hidden border-2 border-dashed border-gray-100 relative group">
                                                        <img src={capturedImage} className="w-full h-full object-contain bg-gray-50" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button onClick={() => window.open(capturedImage)} className="p-3 bg-white rounded-full text-[#024495] shadow-xl">
                                                                <Eye className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-center p-10">
                                                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                                        <FileText className="h-10 w-10" />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-400">No document selected</p>
                                                    <p className="text-xs text-gray-300 mt-1 max-w-[200px]">Captured or uploaded images will appear here for verification.</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!affidavitFile || isSubmitting}
                                            className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${
                                                !affidavitFile || isSubmitting
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20 active:scale-95'
                                            }`}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="h-6 w-6 animate-spin" /> Processing...</>
                                            ) : (
                                                <><ShieldCheck className="h-6 w-6" /> Deactivate & Re-Register</>
                                            )}
                                        </button>
                                        
                                        <div className="px-6 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                                                Warning: This action is permanent and will deactivate the current Library ID ({selectedStudent.LIBRARY_ID}) immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* STEP 4: SUCCESS */}
                    {step === 'success' && successData && (
                        <div className="animate-in zoom-in-95 fade-in duration-700 flex flex-col items-center justify-center py-10">
                            <div className="relative mb-10">
                                <div className="h-32 w-32 bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-500/30 animate-bounce">
                                    <CheckCircle2 className="h-16 w-16 text-white" />
                                </div>
                                <div className="absolute -top-4 -right-4 h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="h-6 w-6 text-green-500" />
                                </div>
                            </div>

                            <div className="text-center max-w-lg mb-12">
                                <h1 className="text-4xl font-black text-gray-900 mb-4">Registration Complete</h1>
                                <p className="text-lg text-gray-500">
                                    The old ID has been successfully deactivated and archived. A new library profile has been generated for 
                                    <span className="text-[#024495] font-black"> {selectedStudent?.FN} {selectedStudent?.LN}</span>.
                                </p>
                            </div>

                            <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden text-center">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #024495 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                
                                <span className="inline-block px-4 py-1.5 bg-blue-50 text-[#024495] text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 relative z-10">
                                    New Assigned ID
                                </span>
                                
                                <h2 className="text-6xl font-black text-[#024495] tracking-tighter mb-4 relative z-10">
                                    {successData.new_id}
                                </h2>

                                <div className="flex flex-col gap-4 mt-10 relative z-10">
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="w-full bg-[#024495] text-white py-5 rounded-2xl font-black shadow-lg shadow-[#024495]/20 hover:bg-[#013575] transition-all"
                                    >
                                        Finish & Exit
                                    </button>
                                    <button 
                                        onClick={() => {
                                            router.visit('/student-registration');
                                        }}
                                        className="w-full bg-green-50 text-green-600 py-5 rounded-2xl font-black border border-green-100 hover:bg-green-100 transition-all"
                                    >
                                        Link Physical Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
                <DialogContent className="max-w-5xl p-0 bg-black overflow-hidden rounded-[3rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Document Capture</DialogTitle>
                        <DialogDescription>Use your camera to capture a clear photo of the affidavit of loss.</DialogDescription>
                    </DialogHeader>

                    <div className="relative aspect-[16/10] bg-black">
                        <CameraCapture onCapture={handlePhotoCaptured} onCancel={stopCamera} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </>
);
}

LostLibraryId.layout = (page: any) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Lost Library ID', href: '/lost-library-id' },
        ]}
    >
        {page}
    </AppLayout>
);

// Separate component to handle the camera lifecycle more robustly
function CameraCapture({ onCapture, onCancel }: { onCapture: (dataUrl: string, file: File) => void, onCancel: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let currentStream: MediaStream | null = null;

        async function setupCamera() {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
                });
            } catch (err) {
                console.warn("Retrying camera with simple constraints...");
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (retryErr) {
                    console.error("Camera access failed:", retryErr);
                    return;
                }
            }

            if (videoRef.current && currentStream) {
                videoRef.current.srcObject = currentStream;
                setIsLoading(false);
            }
        }

        setupCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `affidavit_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(dataUrl, file);
                });
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-black">
            {/* Overlay Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-40 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <Camera className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white leading-none">Affidavit Capture</h2>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Losing ID Documentation</p>
                    </div>
                </div>
                <button 
                    onClick={onCancel}
                    className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 text-white shadow-xl"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Video Feed Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-950">
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black gap-6">
                        <div className="h-16 w-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white animate-pulse">Initializing Lens...</p>
                    </div>
                )}
                
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    onLoadedMetadata={() => {
                        videoRef.current?.play().catch(console.error);
                        setIsLoading(false);
                    }}
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                />

                {/* Guide Frame */}
                {!isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 pointer-events-none">
                        <div className="w-full max-w-2xl aspect-[4/3] border-2 border-dashed border-white/40 rounded-[2.5rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative">
                             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Document Frame</span>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="h-40 bg-black flex items-center justify-center relative p-8">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                
                <div className="relative z-50 flex flex-col items-center gap-6">
                    <p className={`text-[11px] font-black text-white uppercase tracking-[0.4em] transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                        Align the document and take photo
                    </p>
                    
                    <button
                        onClick={handleCapture}
                        disabled={isLoading}
                        className={`group relative flex items-center justify-center transition-all duration-500 ${isLoading ? 'opacity-20 scale-90' : 'opacity-100'}`}
                    >
                        <div className="h-24 w-24 rounded-full border-4 border-white/30 flex items-center justify-center p-1 group-hover:scale-110 active:scale-95 transition-all duration-300">
                            <div className="h-full w-full rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)] group-hover:bg-blue-50 transition-colors" />
                        </div>
                        <div className="absolute inset-0 rounded-full border border-white/0 group-active:border-white/100 group-active:scale-150 transition-all duration-500 pointer-events-none" />
                    </button>
                </div>
            </div>
        </div>
    );
}
