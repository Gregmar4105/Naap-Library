import { Head } from '@inertiajs/react';
import { 
    KeyRound, 
    User, 
    Search, 
    ArrowRight, 
    CheckCircle2, 
    Clock, 
    History, 
    Database,
    AlertCircle,
    XCircle,
    Activity,
    Calendar,
    Unlock,
    Lock,
    ChevronLeft,
    ChevronRight,
    Plus,
    Loader2,
    Trash2
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Locker {
    RFID_NUMBER: string;
    LOCKER_NUMBER: string;
    IS_AVAILABLE: string;
}

interface Record {
    RFID_CARD_NUMBER: string;
    LIBRARY_ID: string;
    BORROW_ON: string;
    RETURN_ON: string | null;
    LOCKER_NUMBER: string;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    COURSE: string;
}

interface DepositoryProps {
    lockers: Locker[];
    activeRecords: Record[];
    todayHistory: Record[];
    todayDate: string;
}

export default function Depository({ 
    lockers: initialLockers = [], 
    activeRecords: initialActive = [], 
    todayHistory: initialHistory = [], 
    todayDate: initialDate 
}: DepositoryProps) {
    const [lockers, setLockers] = useState<Locker[]>(initialLockers);
    const [activeRecords, setActiveRecords] = useState<Record[]>(initialActive);
    const [todayHistory, setTodayHistory] = useState<Record[]>(initialHistory);
    const [todayDate, setTodayDate] = useState<string>(initialDate);

    // Scan State
    const [scanState, setScanState] = useState<'idle' | 'ready' | 'processing'>('idle');
    const [pendingRfid, setPendingRfid] = useState<{ rfid: string; locker: string; type?: 'assign' | 'return' } | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' | null }>({ text: '', type: null });
    const [lastAction, setLastAction] = useState<{ student: any; locker: string; type: 'assigned' | 'returned' } | null>(null);
    const [manualStudentId, setManualStudentId] = useState('');

    // Refs
    const studentIdInputRef = useRef<HTMLInputElement>(null);

    // Add Locker Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addLockerState, setAddLockerState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [addLockerMessage, setAddLockerMessage] = useState('');

    // Delete Locker Modal State
    const [lockerToDelete, setLockerToDelete] = useState<Locker | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<{ text: string; type: 'error' | 'success' | null }>({ text: '', type: null });

    const handleDeleteLocker = async () => {
        if (!lockerToDelete) return;
        setIsDeleting(true);
        setDeleteMessage({ text: '', type: null });

        try {
            const res = await fetch(`/api/depository/delete-locker/${encodeURIComponent(lockerToDelete.RFID_NUMBER)}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ text: data.message, type: 'success' });
                setLockerToDelete(null);
                setTimeout(() => setMessage({ text: '', type: null }), 5000);
                
                // Fetch updated data
                const freshRes = await fetch('/api/depository-data', { headers: { 'Accept': 'application/json' } });
                if (freshRes.ok) {
                    const freshData = await freshRes.json();
                    setLockers(freshData.lockers);
                    setActiveRecords(freshData.activeRecords);
                }
            } else {
                setDeleteMessage({ text: data.message || 'Failed to delete locker.', type: 'error' });
            }
        } catch (err) {
            setDeleteMessage({ text: 'Network error occurred.', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const lockersPerPage = 24;
    const totalPages = Math.max(1, Math.ceil(lockers.length / lockersPerPage));
    const currentLockers = lockers.slice((currentPage - 1) * lockersPerPage, currentPage * lockersPerPage);

    // Validate current page if lockers change
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [lockers.length, totalPages, currentPage]);

    // Barcode Scanner Buffer
    const barcodeBuffer = useRef<string>('');
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip global scanner logic if user is typing in an input field
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            if (isAddModalOpen) {
                if (addLockerState === 'processing') return;

                if (e.key === 'Enter') {
                    e.preventDefault();
                    const code = barcodeBuffer.current.trim();
                    barcodeBuffer.current = '';
                    if (code) handleAddLockerScan(code);
                } else if (e.key.length === 1) {
                    barcodeBuffer.current += e.key;
                    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = setTimeout(() => {
                        barcodeBuffer.current = '';
                    }, 100);
                }
                return;
            }

            if (scanState === 'processing') return;

            if (e.key === 'Enter') {
                e.preventDefault();
                const code = barcodeBuffer.current.trim();
                barcodeBuffer.current = '';
                if (code) handleScan(code);
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = setTimeout(() => {
                    barcodeBuffer.current = '';
                }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scanState, pendingRfid, isAddModalOpen, addLockerState]);

    // Auto-focus student ID input when ready
    useEffect(() => {
        if (scanState === 'ready' && studentIdInputRef.current) {
            // Small timeout to ensure the element is rendered and focused
            const timer = setTimeout(() => {
                studentIdInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [scanState]);

    // Live Polling
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/depository-data', {
                    headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    setLockers(data.lockers);
                    setActiveRecords(data.activeRecords);
                    setTodayHistory(data.todayHistory);
                    if (data.todayDate) setTodayDate(data.todayDate);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleAddLockerScan = async (code: string) => {
        setAddLockerState('processing');
        setAddLockerMessage('Validating key layout...');

        try {
            const res = await fetch('/api/depository/add-locker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ rfid_card_number: code })
            });
            const data = await res.json();

            if (res.ok) {
                setAddLockerState('success');
                setAddLockerMessage(data.message);
                // Optional: fast poll immediately
                fetch('/api/depository-data', { headers: { 'Accept': 'application/json' }})
                    .then(r => r.json())
                    .then(d => {
                        setLockers(d.lockers);
                    })
                    .catch(() => {});
            } else {
                setAddLockerState('error');
                setAddLockerMessage(data.message || 'Error adding locker.');
            }
        } catch (err) {
            setAddLockerState('error');
            setAddLockerMessage('Network error occurred.');
        }
    };

    const handleScan = async (code: string) => {
        setScanState('processing');
        setMessage({ text: 'Processing scan...', type: 'info' });

        try {
            if (!pendingRfid) {
                // STEP 1: Scan Physical Key
                const res = await fetch('/api/depository/scan-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ rfid_card_number: code })
                });
                const data = await res.json();

                if (res.ok) {
                    if (data.action === 'ready') {
                        setPendingRfid({ rfid: data.rfid_number, locker: data.locker_number, type: 'assign' });
                        setScanState('ready');
                        setMessage({ text: data.message, type: 'info' });
                    } else if (data.action === 'ready_return') {
                        setPendingRfid({ rfid: data.rfid_number, locker: data.locker_number, type: 'return' });
                        setScanState('ready');
                        setMessage({ text: data.message, type: 'info' });
                    }
                } else {
                    setScanState('idle');
                    setMessage({ text: data.message || 'Error scanning key.', type: 'error' });
                }
            } else {
                // STEP 2: Scan Student ID
                const res = await fetch('/api/depository/assign-locker', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ rfid_card_number: pendingRfid.rfid, student_rfid: code })
                });
                const data = await res.json();

                if (res.ok) {
                    setScanState('idle');
                    setPendingRfid(null);
                    setLastAction({ student: data.student, locker: data.locker_number, type: data.action === 'returned' ? 'returned' : 'assigned' });
                    setMessage({ text: data.message, type: 'success' });
                    setTimeout(() => setMessage({ text: '', type: null }), 5000);
                } else {
                    // Stay in ready state if student ID was wrong, or reset if desired. 
                    // Let's reset to idle if it failed to avoid confusion.
                    setScanState('idle');
                    setPendingRfid(null);
                    setMessage({ text: data.message || 'Error processing locker.', type: 'error' });
                }
            }
        } catch (err) {
            setScanState('idle');
            setPendingRfid(null);
            setMessage({ text: 'Network error.', type: 'error' });
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualStudentId.trim()) {
            handleScan(manualStudentId.trim());
            setManualStudentId('');
        }
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        // Extract time portion to avoid JS Date's automatic +8 timezone offset when parsing Eloquent's ISO string
        const timePart = dateStr.includes('T') ? dateStr.split('T')[1].substring(0, 5) : dateStr.split(' ')[1]?.substring(0, 5);
        if (!timePart) return '-';
        
        const [h, m] = timePart.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    const availableCount = lockers.filter(l => l.IS_AVAILABLE.toLowerCase() === 'yes').length;
    const occupiedCount = lockers.length - availableCount;

    return (
        <>
            <Head title="Depository" />
            <div className="flex min-h-full w-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 bg-slate-50/50">
                
                {/* Stats Cards - Matching Dashboard Style */}
                <div className="grid w-full gap-4 md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Available Lockers</p>
                                <p className="mt-2 text-4xl font-black text-emerald-600">{availableCount}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                                <Unlock className="h-7 w-7 text-emerald-600" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-600 to-emerald-600/40"></div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Occupied Lockers</p>
                                <p className="mt-2 text-4xl font-black text-[#024495]">{occupiedCount}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#024495]/10">
                                <Lock className="h-7 w-7 text-[#024495]" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#024495] to-[#024495]/40"></div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today's Transactions</p>
                                <p className="mt-2 text-4xl font-black text-[#ffb300]">{todayHistory.length}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffb300]/10">
                                <History className="h-7 w-7 text-[#ffb300]" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#ffb300] to-[#ffb300]/40"></div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row w-full gap-6">
                    
                    {/* Left: Scan Terminal */}
                    <div className="flex-[5] flex flex-col gap-6 min-w-0">
                        <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px] w-full ${lockers.length > 12 ? 'h-full' : ''}`}>
                            
                            {/* Decorative background pulses */}
                            <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${scanState === 'ready' ? 'opacity-5' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-[#ffb300] animate-pulse"></div>
                            </div>

                            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                                {scanState === 'idle' && (
                                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 shadow-inner">
                                            <KeyRound className="h-10 w-10 text-[#024495]" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Scan Locker Key</h2>
                                        <p className="mt-2 text-sm text-gray-500 mb-8 px-4">Place the physical locker key on the reader to begin assignment or return.</p>
                                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#024495]/5 text-[#024495] rounded-full border border-[#024495]/10 font-bold text-[10px] tracking-widest animate-pulse">
                                            <Activity className="h-3 w-3" />
                                            WAITING FOR KEY
                                        </div>
                                    </div>
                                )}

                                {scanState === 'ready' && (
                                    <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#ffb300]/10 border border-[#ffb300]/20 shadow-sm shadow-[#ffb300]/5">
                                            <User className="h-10 w-10 text-[#ffb300]" />
                                        </div>
                                        <div className={`inline-flex items-center gap-1 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-3 ${pendingRfid?.type === 'return' ? 'bg-[#024495]' : 'bg-[#ffb300]'}`}>
                                            Locker #{pendingRfid?.locker} {pendingRfid?.type === 'return' ? 'Ready to Return' : 'Ready'}
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Scan Student ID</h2>
                                        <p className="mt-2 text-sm text-gray-500 mb-8 px-4">Locker is selected. Now tap the student's Library ID or enter it manually.</p>
                                        
                                        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 w-full px-4">
                                            <div className="relative">
                                                <input
                                                    ref={studentIdInputRef}
                                                    type="text"
                                                    value={manualStudentId}
                                                    onChange={(e) => setManualStudentId(e.target.value)}
                                                    placeholder="Enter Student Library ID..."
                                                    className="w-full text-center bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-lg font-bold text-gray-900 placeholder:text-gray-300 focus:border-[#ffb300] focus:ring-4 focus:ring-[#ffb300]/10 transition-all outline-none"
                                                    autoComplete="off"
                                                />
                                                <div className="absolute top-1/2 -translate-y-1/2 right-4 h-2 w-2 rounded-full bg-[#ffb300] animate-pulse"></div>
                                            </div>

                                            <button 
                                                type="submit"
                                                disabled={!manualStudentId.trim() || (scanState as string) === 'processing'}
                                                className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#ffb300] py-4 rounded-2xl border border-[#ffb300] shadow-lg shadow-[#ffb300]/20 hover:bg-[#e6a100] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                            >
                                                {(scanState as string) === 'processing' ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-5 w-5" />
                                                        CONFIRM STUDENT ID
                                                    </>
                                                )}
                                            </button>

                                            <button 
                                                type="button"
                                                onClick={() => { setScanState('idle'); setPendingRfid(null); setMessage({ text: '', type: null }); setManualStudentId(''); }}
                                                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest mt-2"
                                            >
                                                Cancel Transaction
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {scanState === 'processing' && (
                                    <div className="flex flex-col items-center py-10">
                                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#024495] border-t-transparent"></div>
                                        <p className="mt-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Processing...</p>
                                    </div>
                                )}

                                {message.text && (
                                    <div className={`mt-8 w-full p-4 rounded-xl border flex items-center gap-3 text-left animate-in slide-in-from-top-2 ${
                                        message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                        'bg-blue-50 border-blue-100 text-[#024495]'
                                    }`}>
                                        {message.type === 'error' ? <XCircle className="h-5 w-5 shrink-0" /> :
                                         message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> :
                                         <AlertCircle className="h-5 w-5 shrink-0" />}
                                        <p className="text-xs font-bold leading-snug">{message.text}</p>
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>

                    {/* Right: Locker Grid */}
                    <div className="flex-[7] min-w-0">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col h-full w-full">
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-gray-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                                        <Database className="h-5 w-5 text-[#024495]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Locker Map</h2>
                                        <p className="text-xs text-gray-500">Current status and physical location grid</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="flex flex-col gap-2 mr-4">
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> <span className="text-[10px] font-bold uppercase text-gray-400">Available</span></div>
                                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#ffb300]"></div> <span className="text-[10px] font-bold uppercase text-gray-400">Occupied</span></div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setIsAddModalOpen(true);
                                            setAddLockerState('idle');
                                            setAddLockerMessage('');
                                        }}
                                        className="flex items-center gap-1.5 rounded-xl bg-[#024495] px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#013575] active:translate-y-[2px] active:border-b-2 shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" /> Add Locker
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 overflow-y-auto max-h-[500px] custom-scrollbar">
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                     {currentLockers.map((locker) => (
                                        <div 
                                            key={locker.RFID_NUMBER}
                                            className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                                                locker.IS_AVAILABLE.toLowerCase() === 'yes'
                                                ? 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30'
                                                : 'bg-[#ffb300]/10 border-[#ffb300]/20'
                                            }`}
                                        >
                                            {locker.IS_AVAILABLE.toLowerCase() === 'yes' && (
                                                <button
                                                    type="button"
                                                    title="Delete Locker"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLockerToDelete(locker);
                                                        setDeleteMessage({ text: '', type: null });
                                                    }}
                                                    className="absolute top-1.5 right-1.5 p-1 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            <div className={`mb-1 transition-transform group-hover:scale-110 ${locker.IS_AVAILABLE.toLowerCase() === 'yes' ? 'text-emerald-500' : 'text-[#ffb300]'}`}>
                                                {locker.IS_AVAILABLE.toLowerCase() === 'yes' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Locker</span>
                                            <span className="text-sm font-black text-gray-800 leading-none">{locker.LOCKER_NUMBER}</span>
                                            
                                            {locker.IS_AVAILABLE.toLowerCase() === 'yes' && (
                                                <div className="absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                            )}
                                        </div>
                                    ))}
                                    {lockers.length === 0 && (
                                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 italic">
                                            <Database className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest text-gray-300">No lockers configured</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                        <span className="text-xs text-gray-500">
                                            Showing <span className="font-bold text-gray-900">{((currentPage - 1) * lockersPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * lockersPerPage, lockers.length)}</span> of <span className="font-bold text-gray-900">{lockers.length}</span> lockers
                                        </span>
                                        
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            
                                            <div className="flex items-center gap-1 px-2">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                                            currentPage === i + 1 
                                                            ? 'bg-[#024495]' 
                                                            : 'bg-gray-200 hover:bg-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Same Table Style as Dashboard */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb300]/10">
                                <Clock className="h-5 w-5 text-[#ffb300]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Current Borrowers</h2>
                                <p className="text-xs text-gray-500">List of students currently holding physical locker keys</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb300]/10 px-3 py-1 text-xs font-semibold text-[#b37a00] border border-[#ffb300]/20">
                            <Calendar className="h-3 w-3" />
                            {todayDate}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="px-6 py-4">Locker</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Student No.</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Time Borrowed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                                    <Search className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-semibold text-gray-400 italic">No lockers currently in use</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    activeRecords.map((record, i) => (
                                        <tr key={i} className="transition-colors hover:bg-blue-50/50">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-[#024495] bg-blue-50 px-2 py-1 rounded">
                                                    #{record.LOCKER_NUMBER}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#024495] text-xs font-bold text-white uppercase flex-shrink-0">
                                                        {record.FN?.[0]}{record.LN?.[0]}
                                                    </div>
                                                    <p className="font-semibold text-gray-900 whitespace-nowrap">{record.FN} {record.LN}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-500">{record.STUDENT_NUMBER}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#024495] uppercase border border-blue-100">
                                                    {record.COURSE}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{formatDateTime(record.BORROW_ON)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Today's Actions Stream - Matching Dashboard's Table pattern */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                                <History className="h-5 w-5 text-[#024495]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Today's Transactions</h2>
                                <p className="text-xs text-gray-500">Live stream of borrow and return logs for today</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-[#024495]/5 px-3 py-1 text-[10px] font-bold text-[#024495] border border-[#024495]/10 uppercase tracking-widest">
                            {todayHistory.length} logs
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Locker</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {todayHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic"><div className="flex flex-col items-center gap-3">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                                    <Search className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-semibold text-gray-400 italic">No transactions recorded today</p>
                                            </div></td>
                                    </tr>
                                ) : (
                                    todayHistory.slice(0, 50).map((record, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                {record.RETURN_ON ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 uppercase">
                                                        <Lock className="h-3 w-3" />
                                                        Returned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb300]/10 px-3 py-1 text-[10px] font-bold text-[#b37a00] border border-[#ffb300]/20 uppercase">
                                                        <Unlock className="h-3 w-3" />
                                                        Borrowed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800 tracking-tight">#{record.LOCKER_NUMBER}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-700">{record.FN} {record.LN}</p>
                                                <p className="text-[10px] font-mono text-gray-400 uppercase">{record.STUDENT_NUMBER}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                {record.RETURN_ON ? formatDateTime(record.RETURN_ON) : formatDateTime(record.BORROW_ON)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Locker Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-gray-100" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#024495]">Add New Locker Key</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-gray-100 rounded-2xl mb-6 text-center min-h-[220px]">
                            {addLockerState === 'idle' && (
                                <>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4 animate-pulse relative">
                                        <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
                                        <KeyRound className="h-8 w-8 text-[#024495]" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest">Ready to Scan</p>
                                    <p className="text-xs text-gray-400 mt-2">Place an unregistered physical locker key on the reader to add it to the system.</p>
                                </>
                            )}
                            
                            {addLockerState === 'processing' && (
                                <>
                                    <Loader2 className="h-10 w-10 text-[#024495] animate-spin mb-4" />
                                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest">{addLockerMessage}</p>
                                </>
                            )}
                            
                            {addLockerState === 'success' && (
                                <>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Key Registered!</p>
                                    <p className="text-xs text-emerald-700/80 mb-6 px-4">{addLockerMessage}</p>
                                    <button onClick={() => setAddLockerState('idle')} className="px-6 py-2 text-xs font-bold text-gray-600 hover:text-[#024495] rounded-full border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm">Scan Another Key</button>
                                </>
                            )}
                            
                            {addLockerState === 'error' && (
                                <>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                                        <XCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-1">Registration Error</p>
                                    <p className="text-xs text-red-700/80 mb-6 px-4">{addLockerMessage}</p>
                                    <button onClick={() => setAddLockerState('idle')} className="px-6 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-200 rounded-full transition-colors shadow-sm">Try Again</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Locker Confirmation Modal */}
            {lockerToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setLockerToDelete(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-100">
                                <Trash2 className="h-7 w-7" />
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Locker #{lockerToDelete.LOCKER_NUMBER}?</h3>
                            <p className="text-xs text-gray-500 mb-6">
                                Are you sure you want to delete Locker #{lockerToDelete.LOCKER_NUMBER} (RFID key: <span className="font-mono text-gray-700 font-bold">{lockerToDelete.RFID_NUMBER}</span>)? This action cannot be undone.
                            </p>

                            {deleteMessage.text && (
                                <div className={`w-full mb-4 p-3 rounded-xl text-xs font-semibold ${deleteMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    {deleteMessage.text}
                                </div>
                            )}

                            <div className="flex w-full gap-3">
                                <button
                                    type="button"
                                    onClick={() => setLockerToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteLocker}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                                        </>
                                    ) : (
                                        'Delete Locker'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </>
    );
}

Depository.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Depository', href: '/depository' }]}>
        {page}
    </AppLayout>
);
