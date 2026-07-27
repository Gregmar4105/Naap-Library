import { Head, router } from '@inertiajs/react';
import { format, subDays } from 'date-fns';
import { 
    Download, TrendingUp, Users, Calendar as CalendarIcon, 
    Sparkles, FileText, ClipboardList, BookOpen, Search,
    HardDrive, Trash2, ShieldCheck, Server
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DateRange } from 'react-day-picker';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { DailyLogsChart } from '@/components/DailyLogsChart';
import { DateRangePicker } from '@/components/DateRangePicker';
import { CoursePieChart } from '@/components/CoursePieChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface ActivityRecord {
    LIBRARY_ID: string;
    FN: string;
    LN: string;
    COURSE: string;
    date: string;
    type: 'Registration' | 'Lost ID Report';
}

interface CleanupLogRecord {
    id: number;
    cleanup_date: string;
    cutoff_date: string;
    student_logs_photos_deleted: number;
    access_attempts_photos_deleted: number;
    total_photos_deleted: number;
    total_bytes_freed: number;
    formatted_bytes_freed: string;
    trigger_type: string;
    executed_by: string | null;
    status: string;
    notes: string | null;
}

interface Props {
    summary: {
        totalLogs: number;
        totalRegistrations: number;
        totalLostIds: number;
        totalSurveys: number;
    };
    logsTrend: Array<{ name: string; logs: number }>;
    courseDistribution: Array<{ name: string; value: number }>;
    recentActivity: ActivityRecord[];
    cleanupReports?: {
        logs: CleanupLogRecord[];
        total_bytes_freed: number;
        formatted_total_bytes_freed: string;
        total_photos_deleted: number;
        last_cleanup_date: string | null;
    };
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function Reports({ summary, logsTrend, courseDistribution, recentActivity, cleanupReports, filters }: Props) {
    const AI_TEXTS = ["AI Insights", "Descriptive", "Diagnostic", "Predictive", "Prescriptive"];
    const [textIndex, setTextIndex] = useState(0);
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(filters.start_date),
        to: new Date(filters.end_date),
    });

    useEffect(() => {
        if (!dateRange?.from || !dateRange?.to) return;

        const query: Record<string, string> = {
            start_date: format(dateRange.from, 'yyyy-MM-dd'),
            end_date: format(dateRange.to, 'yyyy-MM-dd'),
        };

        router.get('/reports', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [dateRange]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTextIndex(prev => (prev + 1) % AI_TEXTS.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const getDateRangeDescription = () => {
        if (!dateRange?.from) return 'Select a date range';
        if (!dateRange?.to) return `From ${format(dateRange.from, 'LLL dd, y')}`;
        return `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`;
    };

    return (
        <>
            <Head title="Reports & Analytics" />
            <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 w-full max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-black tracking-tight text-[#024495]">Reports & Analytics</h1>
                        <p className="text-muted-foreground mt-2 flex items-center gap-2 font-medium">
                            <CalendarIcon className="w-4 h-4 text-[#ffb300]" />
                            {getDateRangeDescription()}
                        </p>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
                    >
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                        />
                        
                        <Button 
                            className="bg-[#024495] hover:bg-[#013575] text-white shadow-lg shadow-blue-500/10 font-bold gap-2 h-11 px-6 rounded-xl"
                            onClick={() => window.location.href = `/reports/export?start_date=${filters.start_date}&end_date=${filters.end_date}`}
                        >
                            <Download className="w-4 h-4" /> Export Data
                        </Button>

                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="relative group min-w-[180px] h-11 rounded-xl focus:outline-none overflow-hidden shadow-xl p-[2px]">
                                    <div className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,#024495_0%,#ffb300_50%,#024495_100%)] opacity-100"></div>
                                    <div className="relative flex h-full w-full items-center justify-center gap-2 rounded-[10px] bg-white dark:bg-slate-950 px-4 py-1.5 text-sm font-black text-[#024495] dark:text-[#ffb300] transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-900">
                                        <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-[#ffb300]" />
                                        <div className="overflow-hidden h-5 min-w-[100px] relative flex items-center">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                <motion.span
                                                    key={textIndex}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -15 }}
                                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                                    className="absolute whitespace-nowrap text-left"
                                                >
                                                    {AI_TEXTS[textIndex]}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-xl p-0 border-l border-border bg-card">
                                <AIInsightsPanel dateRange={dateRange} />
                            </SheetContent>
                        </Sheet>
                    </motion.div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { title: 'Student Access Logs', value: summary.totalLogs, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Total entries/exits' },
                        { title: 'New Registrations', value: summary.totalRegistrations, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Onboarded students' },
                        { title: 'Lost ID Reports', value: summary.totalLostIds, icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Active incidents' },
                        { title: 'Survey Responses', value: summary.totalSurveys, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Feedback submissions' },
                    ].map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                        >
                            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
                                <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-125", card.bg)} />
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-wider">{card.title}</CardTitle>
                                    <div className={cn("p-2.5 rounded-xl shadow-sm transition-transform group-hover:rotate-12", card.bg)}>
                                        <card.icon className={cn("h-4 w-4", card.color)} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black tracking-tight">{card.value.toLocaleString()}</div>
                                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter">
                                        {card.sub}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    <motion.div 
                        className="lg:col-span-2"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card className="border-border/50 shadow-sm h-full overflow-hidden">
                            <CardHeader className="border-b border-border/50 bg-muted/5">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingUp className="h-5 w-5 text-[#024495]" />
                                    Daily Entry Trends
                                </CardTitle>
                                <CardDescription>Frequency of student taps over the selected period</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <DailyLogsChart data={logsTrend} />
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Card className="border-border/50 shadow-sm h-full overflow-hidden">
                            <CardHeader className="border-b border-border/50 bg-muted/5">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="h-5 w-5 text-[#ffb300]" />
                                    User Distribution
                                </CardTitle>
                                <CardDescription>Active users by department/course</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <CoursePieChart data={courseDistribution} />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Recent Activity Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/5 py-6">
                            <div>
                                <CardTitle className="text-lg">Detailed Activity Feed</CardTitle>
                                <CardDescription>Latest significant events within the library system</CardDescription>
                            </div>
                            <Badge variant="secondary" className="px-3 py-1 font-black text-[10px] bg-primary/10 text-primary border-primary/20">
                                {recentActivity.length} ENTRIES FOUND
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest">Type</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Student Name</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Library ID</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Department</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Time Recorded</TableHead>
                                        <TableHead className="px-8 text-right font-black text-[10px] uppercase tracking-widest">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentActivity.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic font-medium">
                                                No activity records found for this date range.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentActivity.map((item, idx) => (
                                            <TableRow key={idx} className="group hover:bg-muted/10 transition-colors">
                                                <TableCell className="px-8">
                                                    <Badge 
                                                        className={cn(
                                                            "font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 border-none",
                                                            item.type === 'Registration' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                        )}
                                                    >
                                                        {item.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-gray-900">
                                                    {item.FN} {item.LN}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                                    #{item.LIBRARY_ID}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-bold text-gray-600 bg-muted/50 px-2 py-1 rounded-md">
                                                        {item.COURSE}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-muted-foreground">
                                                    {format(new Date(item.date), 'MMM dd, yyyy • HH:mm')}
                                                </TableCell>
                                                <TableCell className="px-8 text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Search className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Storage & Photo Cleanup Audit Summary Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="space-y-6"
                >
                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 border-b border-gray-100 bg-linear-to-r from-blue-50/50 via-white to-transparent">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[#024495]/10 flex items-center justify-center text-[#024495]">
                                        <HardDrive className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-extrabold text-[#024495]">
                                            Storage & Photo Cleanup Summary
                                        </CardTitle>
                                        <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                            Automated monthly date-based host photo purges & storage optimization logs
                                        </CardDescription>
                                    </div>
                                </div>

                                {cleanupReports && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-2">
                                            <Trash2 className="h-4 w-4 text-emerald-600" />
                                            <div>
                                                <span className="block text-[9px] font-extrabold uppercase text-emerald-600 tracking-wider">Total Storage Freed</span>
                                                <span className="text-sm font-black text-emerald-900">{cleanupReports.formatted_total_bytes_freed}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-2">
                                            <ShieldCheck className="h-4 w-4 text-[#024495]" />
                                            <div>
                                                <span className="block text-[9px] font-extrabold uppercase text-[#024495] tracking-wider">Total Purged Host Photos</span>
                                                <span className="text-sm font-black text-[#024495]">{cleanupReports.total_photos_deleted.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest">Cleanup Date</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Cutoff Date</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Student Photos</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Attempt Photos</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Total Cleared</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Space Freed</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Trigger & Executor</TableHead>
                                        <TableHead className="px-8 text-right font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!cleanupReports || cleanupReports.logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-16 text-muted-foreground italic font-medium">
                                                No photo cleanup logs recorded yet. Automated cleanup runs at the end of every month.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cleanupReports.logs.map((log) => (
                                            <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors">
                                                <TableCell className="px-8 font-bold text-gray-900 text-xs">
                                                    {format(new Date(log.cleanup_date), 'MMM dd, yyyy • HH:mm')}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {format(new Date(log.cutoff_date), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-gray-700">
                                                    {log.student_logs_photos_deleted.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-gray-700">
                                                    {log.access_attempts_photos_deleted.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-gray-900">
                                                    {log.total_photos_deleted.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border-none">
                                                        {log.formatted_bytes_freed}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="font-bold text-gray-800">{log.trigger_type}</span>
                                                    <span className="text-gray-400 block text-[10px]">{log.executed_by || 'SYSTEM'}</span>
                                                </TableCell>
                                                <TableCell className="px-8 text-right">
                                                    <Badge 
                                                        className={cn(
                                                            "font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 border-none",
                                                            log.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                        )}
                                                    >
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
}

Reports.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
        {page}
    </AppLayout>
);
