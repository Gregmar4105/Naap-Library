import { Head } from '@inertiajs/react';
import { Users, LogIn, Activity, BookOpen, LogOut, Calendar, ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useState } from 'react';

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

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="px-6 py-4">Action Photo</th>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Time / Type</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-gray-400 font-medium">No logs yet today</td>
                                        </tr>
                                    ) : (
                                        logs.map((log, index) => (
                                            <tr key={index} className="transition-colors hover:bg-blue-50/50">
                                                <td className="px-6 py-3">
                                                    <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-gray-200 shadow-sm transition-transform hover:scale-150 relative z-20 origin-left">
                                                        {log.LOG_IMAGE ? (
                                                            <img src={`/storage/${log.LOG_IMAGE}`} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Photo</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{getFullName(log)}</span>
                                                        <span className="text-[10px] items-center gap-1 flex text-gray-500 font-mono">
                                                            ID: {log.LIBRARY_ID} • {log.STUDENT_NUMBER}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono font-bold text-[#024495]">{formatTime(log.LOG_TIME)}</span>
                                                        {log.log_type === 'login' ? (
                                                            <span className="text-[10px] font-black uppercase text-emerald-600">Entry</span>
                                                        ) : (
                                                            <span className="text-[10px] font-black uppercase text-rose-600">Exit</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#024495] border border-blue-100 uppercase tracking-tighter">
                                                        {log.ID_STATUS}
                                                    </span>
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
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-slate-50 italic">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-rose-600" />
                                <h2 className="text-lg font-black text-rose-900">Access Audits</h2>
                            </div>
                            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-1 rounded animate-pulse uppercase tracking-wider">Live Feed</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[600px]">
                            {attempts.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 italic text-sm">No attempts recorded yet.</div>
                            ) : (
                                attempts.map((attempt) => (
                                    <div key={attempt.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 ${attempt.STATUS === 'failed' ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'border-emerald-500'}`}>
                                            {attempt.IMAGE_PATH ? (
                                                <img src={`/storage/${attempt.IMAGE_PATH}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 italic">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className={`font-black text-xs truncate ${attempt.STATUS === 'failed' ? 'text-rose-600' : 'text-gray-900'}`}>
                                                    {attempt.STATUS === 'failed' ? 'UNKNOWN DETECTION' : getFullName(attempt)}
                                                </p>
                                                <span className="text-[9px] font-mono text-gray-400">{formatTime(attempt.LOG_TIME)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${attempt.STATUS === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
        </>
    );
}

Dashboard.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
        {page}
    </AppLayout>
);
