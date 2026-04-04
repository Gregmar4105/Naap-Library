import { Head } from '@inertiajs/react';
import { Users, LogIn, Activity, BookOpen, LogOut, Calendar } from 'lucide-react';
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
    log_type: 'login' | 'logout';
}

interface Stats {
    currentlyIn: number;
    todayLogs: number;
    totalStudents: number;
}

interface DashboardProps {
    logs: StudentLog[];
    stats: Stats;
    todayDate: string;
}

export default function Dashboard({ logs: initialLogs = [], stats: initialStats, todayDate: initialTodayDate }: DashboardProps) {
    const [logs, setLogs] = useState<StudentLog[]>(initialLogs);
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
        setStats(initialStats);
        setTodayDate(initialTodayDate);
    }, [initialLogs, initialStats, initialTodayDate]);



    const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    const getFullName = (log: StudentLog) => {
        const parts = [log.FN, log.MN, log.LN].filter(Boolean);
        return parts.join(' ');
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
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

                {/* Recent Logs Table */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex-1">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#024495]/10">
                                <Activity className="h-5 w-5 text-[#024495]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Today's Student Logs</h2>
                                <p className="text-sm text-gray-500">Library tap-in and tap-out activity for today • Live updates every 2s</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb300]/10 px-3 py-1 text-xs font-semibold text-[#b37a00]">
                                <Calendar className="h-3 w-3" />
                                {todayDate}
                            </span>
                            <span className="rounded-full bg-[#024495]/10 px-3 py-1 text-xs font-semibold text-[#024495]">
                                {logs.length} entries
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Library ID</th>
                                    <th className="px-6 py-4">Student No.</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Session</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                                    <Activity className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-semibold text-gray-400">No logs yet today</p>
                                                <p className="text-sm text-gray-400">Student tap activity will appear here</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <tr key={`${log.LIBRARY_ID}-${log.LOG_DATE}-${log.LOG_TIME}-${log.LOG_SESSION}-${index}`} className="transition-colors hover:bg-blue-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#024495] text-xs font-bold text-white uppercase flex-shrink-0">
                                                        {log.FN?.[0]}{log.LN?.[0]}
                                                    </div>
                                                    <p className="font-semibold text-gray-900 whitespace-nowrap">{getFullName(log)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {log.LIBRARY_ID}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-700">{log.STUDENT_NUMBER}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#024495]">
                                                    {log.COURSE}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{formatTime(log.LOG_TIME)}</td>
                                            <td className="px-6 py-4">
                                                {log.log_type === 'login' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                                        <LogIn className="h-3 w-3" />
                                                        Login
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                                                        <LogOut className="h-3 w-3" />
                                                        Logout
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-mono text-gray-400">{log.LOG_SESSION}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
