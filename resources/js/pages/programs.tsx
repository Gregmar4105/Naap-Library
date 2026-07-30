import { Head } from '@inertiajs/react';
import {
    GraduationCap,
    Plus,
    Search,
    Edit2,
    Trash2,
    Calendar,
    Clock,
    Building2,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    Sparkles,
    RefreshCw,
    BookOpen
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Program {
    id: number;
    code: string;
    name: string;
    department: string | null;
    duration_years: number;
    duration_months: number;
    semester_duration_months: number;
    semester_expiration_date: string | null;
    duration_display: string | null;
    description: string | null;
    status: 'Active' | 'Inactive';
    created_at?: string;
    updated_at?: string;
}

interface Stats {
    total: number;
    active: number;
    avg_duration_years: number;
    departments_count: number;
}

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        active: 0,
        avg_duration_years: 4.0,
        departments_count: 0
    });
    const [departmentsList, setDepartmentsList] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        department: '',
        duration_years: 4.0,
        duration_months: 48,
        semester_duration_months: 5,
        semester_expiration_date: '',
        duration_display: '',
        description: '',
        status: 'Active' as 'Active' | 'Inactive'
    });

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (selectedDepartment) params.append('department', selectedDepartment);
            if (selectedStatus) params.append('status', selectedStatus);

            const res = await fetch(`/api/programs-data?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPrograms(data.programs || []);
                if (data.stats) setStats(data.stats);
                if (data.departments) setDepartmentsList(data.departments);
            }
        } catch (err) {
            console.error('Failed to fetch programs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPrograms();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, selectedDepartment, selectedStatus]);

    const openCreateModal = () => {
        setFormData({
            code: '',
            name: '',
            department: '',
            duration_years: 4.0,
            duration_months: 48,
            semester_duration_months: 5,
            semester_expiration_date: '',
            duration_display: '4 Years (8 Semesters)',
            description: '',
            status: 'Active'
        });
        setEditingProgram(null);
        setErrorMessage(null);
        setIsCreateOpen(true);
    };

    const openEditModal = (prog: Program) => {
        setEditingProgram(prog);
        setFormData({
            code: prog.code,
            name: prog.name,
            department: prog.department || '',
            duration_years: prog.duration_years,
            duration_months: prog.duration_months,
            semester_duration_months: prog.semester_duration_months || 5,
            semester_expiration_date: prog.semester_expiration_date ? prog.semester_expiration_date.split('T')[0] : '',
            duration_display: prog.duration_display || '',
            description: prog.description || '',
            status: prog.status
        });
        setErrorMessage(null);
        setIsCreateOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage(null);

        const url = editingProgram ? `/api/programs/${editingProgram.id}` : '/api/programs';
        const method = editingProgram ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessMessage(data.message || 'Saved successfully');
                setIsCreateOpen(false);
                fetchPrograms();
                setTimeout(() => setSuccessMessage(null), 4000);
            } else {
                setErrorMessage(data.message || 'Failed to save program.');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingProgram) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/programs/${deletingProgram.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessMessage('Program deleted successfully.');
                setDeletingProgram(null);
                fetchPrograms();
                setTimeout(() => setSuccessMessage(null), 4000);
            } else {
                alert(data.message || 'Failed to delete program.');
            }
        } catch (err: any) {
            alert(err.message || 'Failed to delete program.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Programs & Course Management" />

            <div className="space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    Academic Programs & Courses
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage programs, total expected duration, and semester-based expiration rules.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Program
                    </button>
                </div>

                {/* Notifications */}
                {successMessage && (
                    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800/40 dark:bg-green-900/20 dark:text-green-300">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Total Programs
                            </span>
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <BookOpen className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Active Offerings
                            </span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Avg. Program Duration
                            </span>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">
                            {stats.avg_duration_years} <span className="text-sm font-normal text-gray-500">Years</span>
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Departments
                            </span>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">{stats.departments_count}</p>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by program code, title, or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Departments</option>
                            {departmentsList.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>

                        <button
                            onClick={fetchPrograms}
                            title="Refresh List"
                            className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Programs Data Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Program Code & Title</th>
                                    <th className="px-6 py-4 font-semibold">Departments</th>
                                    <th className="px-6 py-4 font-semibold">Total Duration</th>
                                    <th className="px-6 py-4 font-semibold">Semester Expiration Rule</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                <span>Loading academic programs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : programs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No programs found matching your search criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    programs.map((prog) => (
                                        <tr key={prog.id} className="transition hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-100 px-3 font-mono font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                        {prog.code}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{prog.name}</p>
                                                        {prog.description && (
                                                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{prog.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {prog.department ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                        {prog.department}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {prog.duration_years} Years ({prog.duration_months} Months)
                                                    </span>
                                                    {prog.duration_display && (
                                                        <span className="text-xs text-gray-400">{prog.duration_display}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {prog.semester_expiration_date ? (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                        <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                        Expires: {new Date(prog.semester_expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                                        <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                        Expires every {prog.semester_duration_months || 5} Months
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {prog.status === 'Active' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(prog)}
                                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                                        title="Edit Program"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingProgram(prog)}
                                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                                        title="Delete Program"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create & Edit Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingProgram ? 'Edit Academic Program' : 'Create New Academic Program'}
                            </h2>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                        Program Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. BSCS"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Program Title / Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Bachelor of Science in Computer Science"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Departments
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. College of Computer Studies"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                        Total Duration (Years) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        max="10"
                                        required
                                        value={formData.duration_years}
                                        onChange={(e) => {
                                            const yrs = parseFloat(e.target.value) || 0;
                                            setFormData({
                                                ...formData,
                                                duration_years: yrs,
                                                duration_months: Math.round(yrs * 12)
                                            });
                                        }}
                                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                        Semester Duration (Months)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        required
                                        value={formData.semester_duration_months}
                                        onChange={(e) => setFormData({ ...formData, semester_duration_months: parseInt(e.target.value) || 5 })}
                                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Specific End-of-Semester Expiration Date <span className="text-gray-400 font-normal">(Optional Override)</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.semester_expiration_date}
                                    onChange={(e) => setFormData({ ...formData, semester_expiration_date: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    If set, all students registering under this program will expire on this exact date for the semester.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Duration Display Label
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 4 Years (8 Semesters)"
                                    value={formData.duration_display}
                                    onChange={(e) => setFormData({ ...formData, duration_display: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                                    Description / Notes
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional description of the program..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editingProgram ? 'Update Program' : 'Save Program'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingProgram && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Program</h3>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{deletingProgram.name} ({deletingProgram.code})</span>? This action cannot be undone.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeletingProgram(null)}
                                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

ProgramsPage.layout = (page: any) => (
    <AppLayout breadcrumbs={[{ title: 'Programs', href: '/programs' }]}>
        {page}
    </AppLayout>
);
