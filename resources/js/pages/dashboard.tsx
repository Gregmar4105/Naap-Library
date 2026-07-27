import { Head } from '@inertiajs/react';
import { Users, LogIn, Activity, BookOpen, LogOut, Calendar, ShieldCheck, CircleX, User, IdCard, GraduationCap, Clock, CalendarDays, KeyRound } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/media';

interface StudentLog {
    LIBRARY_ID: string;
    LOG_TIME: string;
    LOG_DATE: string;
    LOG_SESSION: string;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string | null;
    LN: string;
    COURSE: string;
    PIC: string | null;
    ID_STATUS: string;
    LOG_IMAGE: string | null;
    log_type: 'login' | 'logout';
    LOG_METHOD?: string | null;
}

interface AccessAttempt {
    id: number;
    LIBRARY_ID: string | null;
    STATUS: 'success' | 'failed';
    IMAGE_PATH: string | null;
    ATTEMPT_TYPE: 'login' | 'logout';
    LOG_DATE: string;
    LOG_TIME: string;
    FN: string | null;
    LN: string | null;
}

interface Stats {
    currentlyIn: number;
    todayLogs: number;
    totalStudents: number;
}

interface DashboardProps {
    logs: StudentLog[];
    recentAttempts?: AccessAttempt[];
    stats: Stats;
    todayDate: string;
}

export default function Dashboard({ 
    logs: initialLogs = [], 
    recentAttempts: initialAttempts = [],
    stats: initialStats, 
    todayDate: initialTodayDate 
}: DashboardProps) {
    const [logs, setLogs] = useState<StudentLog[]>(initialLogs);
    const [attempts, setAttempts] = useState<AccessAttempt[]>(initialAttempts);
    const [stats, setStats] = useState<Stats>(initialStats);
    const [todayDate, setTodayDate] = useState<string>(initialTodayDate);

    const [selectedItem, setSelectedItem] = useState<{ 
        image: string; 
        name: string; 
        course?: string;
        record?: StudentLog | AccessAttempt;
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // Poll every 2 seconds via fetch for live updates
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/dashboard-data', {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs ?? []);
                    setAttempts(data.recentAttempts ?? []);
                    setStats(data.stats ?? stats);
                    if (data.todayDate) setTodayDate(data.todayDate);
                }
            } catch {
                // silently ignore fetch errors
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Sync with incoming props on first load
    useEffect(() => {
        setLogs(initialLogs);
        setAttempts(initialAttempts);
        setStats(initialStats);
        setTodayDate(initialTodayDate);
    }, [initialLogs, initialAttempts, initialStats, initialTodayDate]);

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    const getFullName = (log: StudentLog | AccessAttempt) => {
        if (!log.FN && !log.LN) return 'Unknown Guest';
        const parts = [log.FN, log.LN].filter(Boolean);
        return parts.join(' ');
    };

    const renderModuleBadge = (method: string | null | undefined) => {
        const m = (method || '').toLowerCase();
        switch (m) {
            case 'face':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-600 border border-indigo-100">
                        Face
                    </span>
                );
            case 'qr':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-600 border border-amber-100">
                        QR Code
                    </span>
                );
            case 'barcode':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-600 border border-cyan-100">
                        Barcode
                    </span>
                );
            case 'rfid':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black uppercase text-purple-600 border border-purple-100">
                        RFID
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-black uppercase text-gray-500 border border-gray-200">
                        Unknown
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Currently In Library</p>
                                <p className="mt-2 text-4xl font-black text-[#024495]">{stats?.currentlyIn ?? 0}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#024495]/10">
                                <Users className="h-7 w-7 text-[#024495]" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#024495] to-[#024495]/40"></div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today's Tap Logs</p>
                                <p className="mt-2 text-4xl font-black text-[#ffb300]">{stats?.todayLogs ?? 0}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffb300]/10">
                                <LogIn className="h-7 w-7 text-[#ffb300]" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#ffb300] to-[#ffb300]/40"></div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Registered Students</p>
                                <p className="mt-2 text-4xl font-black text-emerald-600">{stats?.totalStudents ?? 0}</p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                                <BookOpen className="h-7 w-7 text-emerald-600" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-600 to-emerald-600/40"></div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Logs Table (Main) */}
                    <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                                    <Activity className="h-5 w-5 text-[#024495]" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Student Logs</h2>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb300]/10 px-3 py-1 text-xs font-semibold text-[#b37a00]">
                                <Calendar className="h-3 w-3" /> {todayDate}
                            </span>
                        </div>

                        <div className="overflow-auto flex-1 max-h-[600px]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="px-6 py-4">Action Photo</th>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Library ID</th>
                                        <th className="px-6 py-4">Student No.</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Module</th>
                                        <th className="px-6 py-4">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center text-gray-400 font-medium">No logs yet today</td>
                                        </tr>
                                    ) : (
                                        logs.map((log, index) => (
                                            <tr key={index} className="transition-colors hover:bg-blue-50/50">
                                                <td className="px-6 py-3">
                                                    <div 
                                                        onClick={() => {
                                                            if (log.LOG_IMAGE) {
                                                                setSelectedItem({
                                                                    image: log.LOG_IMAGE,
                                                                    name: getFullName(log),
                                                                    course: log.COURSE,
                                                                    record: log
                                                                });
                                                                setIsInfoOpen(false);
                                                                setIsModalOpen(true);
                                                            }
                                                        }}
                                                        className={`w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-gray-200 shadow-sm transition-transform hover:scale-110 relative z-20 origin-left ${log.LOG_IMAGE ? 'cursor-pointer hover:border-blue-400' : ''}`}
                                                    >
                                                        {log.LOG_IMAGE ? (
                                                            <img src={resolveImageUrl(log.LOG_IMAGE)} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Photo</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900 whitespace-nowrap">{getFullName(log)}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[15px] text-gray-500">
                                                    {log.LIBRARY_ID}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[15px] text-gray-500">
                                                    {log.STUDENT_NUMBER}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#024495] border border-blue-100 uppercase whitespace-nowrap">
                                                        {log.COURSE}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-[#024495]">
                                                    {formatTime(log.LOG_TIME)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {renderModuleBadge(log.LOG_METHOD)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.log_type === 'login' ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-600 border border-emerald-100">
                                                            Entry
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase text-rose-600 border border-rose-100">
                                                            Exit
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Security Audits (Sidebar) */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-rose-600" />
                                <h2 className="text-lg font-black text-rose-900">Access Attempts</h2>
                            </div>
                            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-1 rounded animate-pulse uppercase tracking-wider">Live Feed</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[600px]">
                            {attempts.filter(a => a.STATUS === 'failed').length === 0 ? (
                                <div className="p-10 text-center text-gray-400 italic text-sm">No unknown detections today.</div>
                            ) : (
                                attempts.filter(a => a.STATUS === 'failed').map((attempt) => (
                                    <div key={attempt.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                                            {attempt.IMAGE_PATH ? (
                                                <img 
                                                    src={resolveImageUrl(attempt.IMAGE_PATH)} 
                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                                                    onClick={() => {
                                                        if (attempt.IMAGE_PATH) {
                                                            setSelectedItem({
                                                                image: attempt.IMAGE_PATH,
                                                                name: attempt.STATUS === 'failed' ? 'UNKNOWN DETECTION' : getFullName(attempt),
                                                                course: '',
                                                                record: attempt
                                                            });
                                                            setIsInfoOpen(false);
                                                            setIsModalOpen(true);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 italic">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className="font-black text-xs truncate text-rose-600">
                                                    UNKNOWN DETECTION
                                                </p>
                                                <span className="text-[14px] font-mono text-blue-800 font-bold">{formatTime(attempt.LOG_TIME)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                                                    {attempt.STATUS}
                                                </span>
                                                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">{attempt.ATTEMPT_TYPE}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Detail Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => {
                        setIsModalOpen(false);
                        setIsInfoOpen(false);
                    }}
                >
                    <div 
                        className={`relative transition-all duration-500 bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex overflow-hidden ${isInfoOpen ? 'max-w-6xl lg:h-[70vh]' : 'max-w-4xl'} w-full mx-4 p-2`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => {
                                setIsModalOpen(false);
                                setIsInfoOpen(false);
                            }}
                            className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <CircleX className="h-6 w-6" />
                        </button>
                        
                        {/* Main Detection Image Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="overflow-hidden rounded-2xl bg-slate-900 aspect-video flex-1 flex items-center justify-center relative group">
                                {selectedItem?.image ? (
                                    <img 
                                        src={resolveImageUrl(selectedItem.image)} 
                                        className="w-full h-full object-contain" 
                                        alt="Detection Capture" 
                                    />
                                ) : (
                                    <div className="text-white/20 italic">No Image Selected</div>
                                )}
                                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Action Capture</span>
                                </div>
                            </div>
                            
                            <div className="p-4 flex items-center justify-between bg-white">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Library Security System</span>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase">
                                            {selectedItem?.record && 'log_type' in selectedItem.record ? selectedItem.record.log_type : (selectedItem?.record as AccessAttempt)?.ATTEMPT_TYPE}
                                        </div>
                                        <span className="text-xs font-mono font-bold text-gray-500">
                                            {selectedItem?.record?.LOG_DATE} {formatTime(selectedItem?.record?.LOG_TIME ?? '')}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsInfoOpen(!isInfoOpen)}
                                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isInfoOpen ? 'bg-gray-100 text-gray-600' : 'bg-[#024495] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700'}`}
                                >
                                    {isInfoOpen ? 'Hide Student Info' : `${selectedItem?.name} ${selectedItem?.course ? `• ${selectedItem.course}` : ''}`}
                                </button>
                            </div>
                        </div>

                        {/* Right Side Info Panel */}
                        {isInfoOpen && (
                            <div className="w-[380px] border-l border-gray-100 flex flex-col bg-slate-50/50 animate-in slide-in-from-right duration-500 overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    {/* Student Profile Header */}
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white">
                                                {selectedItem?.record && 'PIC' in selectedItem.record && selectedItem.record.PIC ? (
                                                    <img 
                                                        src={resolveImageUrl(selectedItem.record.PIC)} 
                                                        className="w-full h-full object-cover" 
                                                        alt="Profile"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                        <User className="h-12 w-12" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${selectedItem?.record && 'log_type' in selectedItem.record && selectedItem.record.log_type === 'login' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                {selectedItem?.record && 'log_type' in selectedItem.record && selectedItem.record.log_type === 'login' ? (
                                                    <LogIn className="h-3 w-3 text-white" />
                                                ) : (
                                                    <LogOut className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                                                {selectedItem?.name}
                                            </h3>
                                            <p className="text-sm font-bold text-blue-600 mt-1 uppercase">
                                                {selectedItem?.course || 'UNREGISTERED GUEST'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detailed Stats */}
                                    <div className="space-y-3">
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                                    <IdCard className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Library ID</p>
                                                    <p className="font-mono font-bold text-gray-900">{(selectedItem?.record as StudentLog)?.LIBRARY_ID || 'N/A'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                                                    <KeyRound className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Number</p>
                                                    <p className="font-mono font-bold text-gray-900">{(selectedItem?.record as StudentLog)?.STUDENT_NUMBER || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                                    <GraduationCap className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Status</p>
                                                    <p className="font-bold text-gray-900 uppercase text-xs">{(selectedItem?.record as StudentLog)?.ID_STATUS || 'UNKNOWN'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                                                    <CalendarDays className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Date</p>
                                                    <p className="font-bold text-gray-900">{selectedItem?.record?.LOG_DATE}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Time</p>
                                                    <p className="font-bold text-gray-900">{formatTime(selectedItem?.record?.LOG_TIME ?? '')}</p>
                                                </div>
                                            </div>

                                            {selectedItem?.record && 'LOG_SESSION' in selectedItem.record && (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                                                        <Activity className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Session ID</p>
                                                        <p className="font-mono font-bold text-gray-900">{selectedItem.record.LOG_SESSION}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

Dashboard.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
        {page}
    </AppLayout>
);
