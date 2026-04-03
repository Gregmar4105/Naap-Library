import { Head } from '@inertiajs/react';
import { Send, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface StudentData {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    PIC: string | null;
    COURSE: string;
    ID_STATUS: string;
    time_out?: string;
    tap_status?: 'success' | 'already_in' | 'already_out';
}

export default function TapToLogout() {
    const [scannedStudent, setScannedStudent] = useState<StudentData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSimulateModal, setShowSimulateModal] = useState(false);
    const [testLibraryId, setTestLibraryId] = useState('');

    // Buffer for keypresses
    const barcodeBuffer = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isProcessing || showSimulateModal) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                const code = barcodeBuffer.current;
                barcodeBuffer.current = '';

                if (code.length > 0) {
                    processTag(code);
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
    }, [isProcessing, showSimulateModal]);

    // Clean up student display timeout ONLY on component unmount
    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, []);

    const processTag = async (libraryId: string) => {
        if (!libraryId || libraryId.trim() === '') return;
        setIsProcessing(true);
        try {
            const response = await fetch('/api/tap-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ library_id: libraryId })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.success || data.status === 'already_out') {
                    setScannedStudent({
                        ...data.student,
                        time_out: data.time_out,
                        tap_status: data.status || 'success'
                    });

                    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
                    resetTimeoutRef.current = setTimeout(() => {
                        setScannedStudent(null);
                    }, 4000);
                    setIsProcessing(false);
                } else {
                    alert('Tap out failed: ' + (data.message || 'Unknown error'));
                    console.error('Tap failed:', data.message);
                    setIsProcessing(false);
                }
            } else {
                alert('Tap out failed: ' + (data.message || 'Unknown error'));
                console.error('Tap failed:', data.message);
                setIsProcessing(false);
            }
        } catch (error) {
            alert('Network Error connecting to the server. Check your console and backend logs.');
            console.error('Network Error:', error);
            setIsProcessing(false);
        }
    };

    const getProgramAndYear = (course: string = '') => {
        const yearMatch = course.match(/(\d+(?:st|nd|rd|th)?\s+Year)$/i);
        if (yearMatch) {
            const yearLevel = yearMatch[0];
            const program = course.replace(yearLevel, '').trim();
            return { program, yearLevel };
        }
        return { program: course, yearLevel: 'N/A' };
    };

    const StudentCard = () => {
        if (!scannedStudent) return null;
        const { program, yearLevel } = getProgramAndYear(scannedStudent.COURSE);

        return (
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden relative z-10 border border-gray-100 flex flex-col p-10 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-slate-50 rounded-full border-[3px] border-[#024495] flex items-center justify-center p-1 mb-4 overflow-hidden">
                        {scannedStudent.PIC ? (
                            <img src={scannedStudent.PIC} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <User className="text-[#024495] w-12 h-12" />
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-[#024495] text-center leading-tight">
                        {scannedStudent.FN} {scannedStudent.MN ? `${scannedStudent.MN.charAt(0)}.` : ''} {scannedStudent.LN}
                    </h2>
                    <p className="text-[#ffb300] font-bold text-sm mt-1">
                        ID: {scannedStudent.STUDENT_NUMBER}
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
                        <span className="text-green-600 font-semibold">{scannedStudent.ID_STATUS}</span>
                    </div>
                    {scannedStudent.time_out && (
                        <div className="flex justify-between items-center pt-4">
                            <span className="font-bold text-[#024495]">Time Out:</span>
                            <span className="text-gray-600">{scannedStudent.time_out}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-2">
                    {scannedStudent.tap_status === 'already_out' ? (
                        <div className="bg-red-100/80 text-red-700 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border border-red-200">
                            ALREADY LOGGED OUT
                        </div>
                    ) : (
                        <div className="bg-green-100/80 text-green-700 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider">
                            EXIT AUTHORIZED
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen w-full bg-[#f4f6f9] font-sans relative">
            <Head title="Tap to Logout - NAAP Library System" />

            <style>{`
                @keyframes shineSweep {
                    0% { transform: translateX(-100%) skewX(35deg) scale(0.8); opacity: 0; }
                    5% { opacity: 1; }
                    15% { transform: translateX(50%) skewX(35deg) scale(1.5); opacity: 1; }
                    25% { transform: translateX(250%) skewX(35deg) scale(0.8); opacity: 1; }
                    30% { transform: translateX(250%) skewX(35deg) scale(0.8); opacity: 0; }
                    100% { transform: translateX(250%) skewX(35deg); opacity: 0; }
                }
            `}</style>

            {/* Custom Simulation Modal */}
            {showSimulateModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSimulateModal(false)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-[320px] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-gray-900 mb-2">Simulate Tap Out</h3>
                        <p className="text-xs text-gray-500 mb-4">Enter a valid LIBRARY_ID from your database.</p>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 text-black focus:outline-none focus:ring-2 focus:ring-[#024495]"
                            placeholder="Enter LIBRARY_ID..."
                            value={testLibraryId}
                            onChange={(e) => setTestLibraryId(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setShowSimulateModal(false);
                                    processTag(testLibraryId);
                                    setTestLibraryId('');
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowSimulateModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => {
                                setShowSimulateModal(false);
                                processTag(testLibraryId);
                                setTestLibraryId('');
                            }} className="px-5 py-2 text-sm bg-[#024495] hover:bg-[#013575] text-white rounded-lg transition-colors font-medium">Verify Exit</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="hidden lg:flex flex-col justify-center items-center w-[55%] bg-[#024495] text-white p-14 lg:p-20 relative overflow-hidden transition-all duration-500">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Silver Shining Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div 
                        className="absolute -top-[20%] -bottom-[20%] w-[60%] bg-gradient-to-r from-transparent via-white/30 to-transparent mix-blend-overlay blur-[2px]"
                        style={{ animation: 'shineSweep 6s ease-in-out infinite' }}
                    />
                </div>

                {scannedStudent ? (
                    <div className="relative z-10 w-full flex justify-center items-center h-full">
                        <StudentCard />
                    </div>
                ) : (
                    <div className="relative z-10 w-full flex flex-col justify-between h-full py-8">
                        <div className="pt-4 animate-in fade-in duration-500">
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95]">
                                NAAP<br />
                                <span className="text-[#ffb300]">LIBRARY</span><br />
                                SYSTEM
                            </h1>
                            <p className="mt-8 text-base lg:text-lg font-light text-blue-50 max-w-md leading-relaxed opacity-90">
                                Experience seamless facility exit. Place your registered student ID near the designated sensor area to conclude your session automatically.
                            </p>
                        </div>
                        <div className="flex flex-col mt-20">
                            <div className="relative mb-24 w-max">
                                <span className="text-2xl font-bold italic opacity-80 tracking-widest">#NAAPviator</span>
                                <Send
                                    className="absolute w-44 h-44 -left-8 -top-8 text-white opacity-[0.04] -rotate-[15deg] pointer-events-none"
                                    strokeWidth={1}
                                />
                            </div>
                            <div className="text-xs text-blue-200/80 space-y-1.5 font-light">
                                <p>Support: example@gmail.com</p>
                                <p>Facebook Page: https://www.facebook.com/VillamorCampus</p>
                                <p>Official Portal: https://www.naap.edu.ph</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center w-full lg:w-[45%] p-6 sm:p-12 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-[300px] h-[300px] rounded-full blur-3xl transition-colors duration-500 ${scannedStudent?.tap_status === 'already_out' ? 'bg-red-500/15' : scannedStudent ? 'bg-green-500/10' : 'bg-blue-500/5'}`}></div>
                </div>

                <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden relative z-10 border border-gray-100/50">
                    <div className={`h-1.5 w-full transition-colors duration-500 ${scannedStudent?.tap_status === 'already_out' ? 'bg-red-500' : scannedStudent ? 'bg-green-500' : 'bg-[#ffb300]'}`}></div>

                    <div className="p-12 flex flex-col items-center text-center">
                        <h2 className={`text-[28px] font-black tracking-tight mb-2 transition-colors duration-500 ${scannedStudent?.tap_status === 'already_out' ? 'text-red-600' : scannedStudent ? 'text-green-600' : 'text-[#024495]'}`}>
                            Tap to Logout
                        </h2>
                        <p className="text-slate-500 mb-12 text-sm">Secure Automated Exit</p>

                        <div
                            onClick={() => {
                                if (isProcessing) return;
                                setShowSimulateModal(true);
                            }}
                            className={`relative flex items-center justify-center w-[140px] h-[140px] rounded-full border bg-slate-50 mb-12 group transition-all duration-500 cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 ${scannedStudent?.tap_status === 'already_out' ? 'border-red-500' : scannedStudent ? 'border-green-500' : 'border-gray-200 hover:border-[#ffb300]'}`}
                        >
                            <div className="absolute inset-2 rounded-full border border-gray-100 bg-white shadow-sm"></div>

                            <div className="relative z-10 ml-2">
                                <svg width="70" height="70" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="6" y="16" width="34" height="28" rx="4" fill={scannedStudent?.tap_status === 'already_out' ? '#ef4444' : scannedStudent ? '#10b981' : '#024495'} className="transition-colors duration-500" />
                                    <rect x="10" y="26" width="8" height="6" rx="1.5" fill="white" />
                                    <circle cx="33" cy="30" r="3" fill="#ffb300" />

                                    <path d="M46 22C49 26 49 34 46 38" stroke={scannedStudent?.tap_status === 'already_out' ? '#ef4444' : scannedStudent ? '#10b981' : '#ffb300'} strokeWidth="3" strokeLinecap="round" className="transition-colors duration-500" />
                                    <path d="M52 18C57 24 57 36 52 42" stroke={scannedStudent?.tap_status === 'already_out' ? '#ef4444' : scannedStudent ? '#10b981' : '#ffb300'} strokeWidth="3" strokeLinecap="round" className="transition-colors duration-500" />
                                </svg>
                            </div>
                        </div>

                        <div className={`px-6 py-2.5 rounded-full text-sm font-medium border shadow-sm transition-all duration-500 ${scannedStudent?.tap_status === 'already_out'
                                ? 'bg-red-100/80 text-red-700 border-red-200'
                                : scannedStudent
                                    ? 'bg-green-100/80 text-green-700 border-green-200'
                                    : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}>
                            {scannedStudent?.tap_status === 'already_out' ? 'Invalid Tap' : scannedStudent ? 'Validation Complete' : 'Waiting for device...'}
                        </div>

                        <button
                            onClick={() => {
                                if (isProcessing) return;
                                setShowSimulateModal(true);
                            }}
                            className="mt-8 text-[11px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                            Simulate Scanner (Dev Mode)
                        </button>

                        <span className={`text-xs text-gray-500 mt-4 transition-opacity duration-300 ${isProcessing ? 'opacity-100' : 'opacity-0'}`}>
                            Processing...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
