import { Head, router } from '@inertiajs/react';
import { 
    Search, 
    History, 
    User, 
    Activity, 
    Tag, 
    Calendar,
    ChevronDown,
    ChevronUp,
    ArrowLeftRight,
    ArrowRight,
    LayoutGrid,
    Clock,
    UserPlus,
    Zap,
    Download,
    Globe,
    RefreshCcw
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import React from 'react';

interface AuditTrail {
    id: number;
    user_id: number;
    user_name: string;
    auditable_type: string;
    auditable_id: number;
    event: string;
    activity: string;
    ip_address: string | null;
    old_values: any;
    new_values: any;
    created_at: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Summary {
    totalLogs: number;
    totalToday: number;
    mostActiveUser: string;
    topEvent: string;
}

interface Props {
    auditTrails: PaginatedData<AuditTrail>;
    filters: {
        search?: string;
        event?: string;
    };
    summary: Summary;
}

const breadcrumbs = [
    {
        title: 'System Logs',
        href: '/system-logs',
    },
];

export default function SystemLogs({ auditTrails, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [eventFilter, setEventFilter] = useState(filters.event || 'all');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const toggleRow = (id: number) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            const query: any = {};
            if (search) query.search = search;
            if (eventFilter !== 'all') query.event = eventFilter;

            router.get('/system-logs', query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, eventFilter]);

    /* Handle manual and auto refresh */
    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['auditTrails', 'summary'],
            onFinish: () => setIsRefreshing(false),
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            handleRefresh();
        }, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const getEventBadge = (event: string) => {
        const evt = event.toLowerCase();
        return (
            <Badge 
                variant="secondary"
                className={cn(
                    "text-[10px] uppercase tracking-wider font-bold",
                    evt === 'created' && "bg-green-100 text-green-700",
                    evt === 'updated' && "bg-blue-100 text-blue-700",
                    evt === 'deleted' && "bg-red-100 text-red-700",
                    evt === 'login' && "bg-indigo-100 text-indigo-700",
                    evt === 'logout' && "bg-zinc-100 text-zinc-700"
                )}
            >
                {event}
            </Badge>
        );
    };

    const renderJson = (val: any) => {
        if (!val || Object.keys(val).length === 0) return <div className="text-muted-foreground italic text-xs p-4 border rounded-md bg-muted/20">No data changes recorded.</div>;
        return (
            <div className="rounded-md border bg-muted/20 p-4 font-mono text-[11px] overflow-auto max-h-[500px]">
                <pre className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(val, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <>
            <Head title="System Logs" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 w-full">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <History className="w-4 h-4 text-zinc-500" />
                            Comprehensive audit trail of all system changes.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-9 w-9 border-zinc-200 hover:bg-zinc-50 shadow-sm"
                        >
                            <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white/50 backdrop-blur-sm border-zinc-100 hover:border-zinc-200 transition-colors shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <LayoutGrid className="h-4 w-4 text-zinc-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalLogs.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1 lowercase">
                                System wide persistence
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/50 backdrop-blur-sm border-zinc-100 hover:border-zinc-200 transition-colors shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Activities Today</CardTitle>
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <Clock className="h-4 w-4 text-zinc-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalToday}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Entries in the last 24h
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/50 backdrop-blur-sm border-zinc-100 hover:border-zinc-200 transition-colors shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Top Event</CardTitle>
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <Zap className="h-4 w-4 text-zinc-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold uppercase tracking-wide">{summary.topEvent}</div>
                            <p className="text-xs text-muted-foreground mt-1 text-blue-600 font-medium">
                                Most frequent interaction
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Table Section */}
                <Card className="shadow-sm border-none overflow-hidden bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl font-bold">Audit Trails</CardTitle>
                            <CardDescription>Comprehensive log of all administrative actions and data changes.</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground font-medium px-3 py-1 bg-muted/20">
                            {auditTrails.total} logs recorded
                        </Badge>
                    </CardHeader>
                    
                    <div className="px-6 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground font-bold" />
                                <Input
                                    placeholder="Search by user, activity, model..."
                                    className="pl-10 h-10 border-muted-foreground/20 focus-visible:ring-zinc-500 rounded-lg shadow-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={eventFilter} onValueChange={setEventFilter}>
                                <SelectTrigger className="w-full md:w-[180px] h-10 border-muted-foreground/20 rounded-lg shadow-sm font-medium">
                                    <SelectValue placeholder="All Events" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="created">Created</SelectItem>
                                    <SelectItem value="updated">Updated</SelectItem>
                                    <SelectItem value="deleted">Deleted</SelectItem>
                                    <SelectItem value="login">Login</SelectItem>
                                    <SelectItem value="logout">Logout</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <CardContent className="p-0 border-t">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        {/* Chevron column */}
                                        <TableHead className="w-[48px]"></TableHead>
                                        
                                        {/* Separated Date and Time columns */}
                                        <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                        <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</TableHead>
                                        <TableHead className="w-[12%] text-xs font-bold uppercase tracking-wider text-muted-foreground">User</TableHead>
                                        <TableHead className="w-[12%] text-xs font-bold uppercase tracking-wider text-muted-foreground">IP Address</TableHead>
                                        <TableHead className="w-[18%] text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity Summary</TableHead>
                                        <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</TableHead>
                                        <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-muted-foreground">Models</TableHead>
                                        <TableHead className="w-[8%] text-right text-xs font-bold uppercase tracking-wider text-muted-foreground pr-8">Target ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditTrails.data.length > 0 ? (
                                        auditTrails.data.map((log) => (
                                            <React.Fragment key={log.id}>
                                                <TableRow 
                                                    className={cn(
                                                        "cursor-pointer transition-colors border-b last:border-0",
                                                        expandedRows.includes(log.id) ? "bg-zinc-50/30 hover:bg-zinc-50/50" : "hover:bg-muted/20"
                                                    )}
                                                    onClick={() => toggleRow(log.id)}
                                                >
                                                    <TableCell>
                                                        {expandedRows.includes(log.id) ? (
                                                            <ChevronUp className="h-4 w-4 text-zinc-500" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        <span className="text-sm font-medium whitespace-nowrap">{format(new Date(log.created_at), 'MMM dd, yyyy')}</span>
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        <span className="text-sm font-mono bg-muted/30 px-2 py-0.5 rounded">
                                                            {format(new Date(log.created_at), 'HH:mm:ss')}
                                                        </span>
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                            {log.user_name}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                                                            <Globe className="w-3 h-3 text-blue-400" />
                                                            {log.ip_address || 'Unrecorded'}
                                                        </div>
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                            {log.activity}
                                                        </div>
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        {getEventBadge(log.event)}
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-muted/50 border text-[11px] font-mono text-muted-foreground">
                                                            {log.auditable_type.split('\\').pop()}
                                                        </div>
                                                    </TableCell>
                                                    
                                                    <TableCell className="text-right font-mono text-xs font-bold text-zinc-600 pr-8">
                                                        #{log.auditable_id}
                                                    </TableCell>
                                                </TableRow>
                                                {expandedRows.includes(log.id) && (
                                                    <TableRow className="bg-zinc-50/10 dark:bg-zinc-900/30 font-extrabold">
                                                        <TableCell colSpan={9} className="p-6">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between border-b pb-2">
                                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                            <ArrowLeftRight className="h-3 w-3 text-blue-500" />
                                                                            Prior State (Original)
                                                                        </h4>
                                                                    </div>
                                                                    {renderJson(log.old_values)}
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between border-b pb-2">
                                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                            <ArrowRight className="h-3 w-3 text-green-500" />
                                                                            New State (Result)
                                                                        </h4>
                                                                    </div>
                                                                    {renderJson(log.new_values)}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <History className="h-10 w-10 text-muted/30" />
                                                    <p className="text-sm font-medium">No activity logs matching your criteria were found.</p>
                                                    <Button variant="link" onClick={() => { setSearch(''); setEventFilter('all'); }} className="text-zinc-500">
                                                        Clear all filters
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination Section */}
                {auditTrails.total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pb-10">
                        <p className="text-sm text-muted-foreground italic">
                            Displaying audit reports <span className="font-semibold text-foreground">{auditTrails.from}</span> through <span className="font-semibold text-foreground">{auditTrails.to}</span> out of <span className="font-semibold text-foreground">{auditTrails.total}</span> total entries.
                        </p>
                        <div className="flex items-center gap-1">
                            {auditTrails.links.map((link, i) => {
                                const isPrev = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');

                                if (isPrev || isNext) {
                                    return (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={cn(
                                                "rounded-lg h-9 px-4 border-muted-foreground/20 hover:bg-zinc-50 hover:text-zinc-600 transition-colors shadow-sm",
                                                !link.url && "opacity-40 cursor-not-allowed"
                                            )}
                                        >
                                            {isPrev ? 'Previous' : 'Next'}
                                        </Button>
                                    );
                                }
                                
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

SystemLogs.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);
