import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    RefreshCw,
    ShieldAlert,
    UserX,
    UserCheck,
    FileText,
    Mail,
    Calendar,
    Shield,
    Info,
    Ban
} from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { resolveImageUrl } from '@/lib/media';
import type { BreadcrumbItem } from '@/types';

interface ViolationType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    severity: 'Minor' | 'Moderate' | 'Major' | 'Critical';
    status: 'Active' | 'Inactive';
    created_at?: string;
    updated_at?: string;
}

interface StudentInfo {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    full_name: string;
    FN: string;
    LN: string;
    COURSE: string;
    PIC: string | null;
    EMAIL: string | null;
    ID_STATUS: string;
    DEACTIVATION_NOTE?: string | null;
    active_violations_count: number;
    is_expired?: boolean;
}

interface StudentViolation {
    id: number;
    student_library_id: string;
    violation_type_id: number;
    notes: string | null;
    occurred_at: string | null;
    occurred_at_display: string;
    issued_by: string | null;
    status: 'Active' | 'Resolved' | 'Dismissed';
    resolved_at: string | null;
    resolution_notes: string | null;
    student: StudentInfo | null;
    violation_type: {
        id: number;
        code: string;
        name: string;
        severity: 'Minor' | 'Moderate' | 'Major' | 'Critical';
    } | null;
}

interface Stats {
    total_types: number;
    total_violations: number;
    active_violations: number;
    expired_students: number;
    max_allowed: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Violations',
        href: '/violations',
    },
];

export default function ViolationsPage() {
    const [activeTab, setActiveTab] = useState<'student_violations' | 'violation_types'>('student_violations');
    const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
    const [studentViolations, setStudentViolations] = useState<StudentViolation[]>([]);
    const [students, setStudents] = useState<StudentInfo[]>([]);
    const [stats, setStats] = useState<Stats>({
        total_types: 0,
        total_violations: 0,
        active_violations: 0,
        expired_students: 0,
        max_allowed: 3
    });
    const [loading, setLoading] = useState<boolean>(true);

    // Filters
    const [searchStudent, setSearchStudent] = useState<string>('');
    const [filterTypeId, setFilterTypeId] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Modal States - Violation Types
    const [isCreateTypeOpen, setIsCreateTypeOpen] = useState<boolean>(false);
    const [editingType, setEditingType] = useState<ViolationType | null>(null);
    const [deletingType, setDeletingType] = useState<ViolationType | null>(null);

    // Modal States - Student Violations
    const [isIssueViolationOpen, setIsIssueViolationOpen] = useState<boolean>(false);
    const [editingStudentViolation, setEditingStudentViolation] = useState<StudentViolation | null>(null);
    const [deletingStudentViolation, setDeletingStudentViolation] = useState<StudentViolation | null>(null);
    const [reactivatingStudent, setReactivatingStudent] = useState<StudentInfo | null>(null);

    // Form States
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Violation Type Form Data
    const [typeFormData, setTypeFormData] = useState({
        code: '',
        name: '',
        description: '',
        severity: 'Minor' as 'Minor' | 'Moderate' | 'Major' | 'Critical',
        status: 'Active' as 'Active' | 'Inactive'
    });

    // Student Violation Form Data
    const [violationFormData, setViolationFormData] = useState({
        student_library_id: '',
        violation_type_id: '',
        notes: '',
        occurred_at: new Date().toISOString().slice(0, 16),
        send_email: true
    });

    // Student Violation Edit Form Data
    const [editViolationFormData, setEditViolationFormData] = useState({
        violation_type_id: '',
        notes: '',
        occurred_at: '',
        status: 'Active' as 'Active' | 'Resolved' | 'Dismissed',
        resolution_notes: ''
    });

    // Student Search with Debounce State (for Issue Violation modal)
    const [studentSearchInput, setStudentSearchInput] = useState<string>('');
    const [debouncedStudentQuery, setDebouncedStudentQuery] = useState<string>('');
    const [isDebouncingStudent, setIsDebouncingStudent] = useState<boolean>(false);
    const [showStudentSuggestions, setShowStudentSuggestions] = useState<boolean>(false);
    const studentSearchRef = useRef<HTMLDivElement>(null);

    // Debounce effect for student search input in Issue Violation modal
    useEffect(() => {
        setIsDebouncingStudent(true);
        const timer = setTimeout(() => {
            setDebouncedStudentQuery(studentSearchInput);
            setIsDebouncingStudent(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [studentSearchInput]);

    // Click outside listener for student search suggestions dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentSearchRef.current && !studentSearchRef.current.contains(event.target as Node)) {
                setShowStudentSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtered student suggestions based on debounced search query
    const filteredStudentSuggestions = useMemo(() => {
        if (!debouncedStudentQuery.trim()) {
            return students.slice(0, 15);
        }
        const q = debouncedStudentQuery.toLowerCase().trim();
        return students.filter((s) => {
            const fullName = (s.full_name || '').toLowerCase();
            const studentNum = (s.STUDENT_NUMBER || '').toLowerCase();
            const libraryId = (s.LIBRARY_ID || '').toLowerCase();
            const course = (s.COURSE || '').toLowerCase();
            const email = (s.EMAIL || '').toLowerCase();
            return (
                fullName.includes(q) ||
                studentNum.includes(q) ||
                libraryId.includes(q) ||
                course.includes(q) ||
                email.includes(q)
            );
        }).slice(0, 20);
    }, [students, debouncedStudentQuery]);

    // Currently selected student object
    const selectedStudent = useMemo(() => {
        if (!violationFormData.student_library_id) return null;
        return students.find((s) => s.LIBRARY_ID === violationFormData.student_library_id) || null;
    }, [students, violationFormData.student_library_id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchStudent) params.append('search', searchStudent);
            if (filterTypeId) params.append('type_id', filterTypeId);
            if (filterStatus) params.append('status', filterStatus);

            const res = await fetch(`/api/violations-data?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setViolationTypes(data.violation_types || []);
                setStudentViolations(data.student_violations || []);
                setStudents(data.students || []);
                if (data.stats) setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch violations data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchStudent, filterTypeId, filterStatus]);

    // Handle Toast Banner Auto-dismiss
    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setErrorMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    // Save Violation Type (Create / Update)
    const handleSaveViolationType = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage(null);

        try {
            const url = editingType ? `/api/violation-types/${editingType.id}` : '/api/violation-types';
            const method = editingType ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(typeFormData)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(data.message || 'Violation type saved successfully.');
                setIsCreateTypeOpen(false);
                setEditingType(null);
                setTypeFormData({
                    code: '',
                    name: '',
                    description: '',
                    severity: 'Minor',
                    status: 'Active'
                });
                fetchData();
            } else {
                setErrorMessage(data.message || 'Failed to save violation type.');
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Violation Type
    const handleDeleteViolationType = async () => {
        if (!deletingType) return;
        setSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/violation-types/${deletingType.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                }
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMessage('Violation type deleted successfully.');
                setDeletingType(null);
                fetchData();
            } else {
                setErrorMessage(data.message || 'Failed to delete violation type.');
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    // Issue Violation to Student
    const handleIssueStudentViolation = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!violationFormData.student_library_id) {
            setErrorMessage('Please search and select a student first.');
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await fetch('/api/student-violations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(violationFormData)
            });

            const data = await res.json();

            if (res.ok) {
                let msg = data.message || 'Student violation recorded successfully.';
                if (data.is_expired) {
                    msg += ' 🚨 Student has reached 3 active violations and their Library ID registration is now EXPIRED!';
                }
                setSuccessMessage(msg);
                setIsIssueViolationOpen(false);
                setViolationFormData({
                    student_library_id: '',
                    violation_type_id: '',
                    notes: '',
                    occurred_at: new Date().toISOString().slice(0, 16),
                    send_email: true
                });
                setStudentSearchInput('');
                setDebouncedStudentQuery('');
                setShowStudentSuggestions(false);
                fetchData();
            } else {
                setErrorMessage(data.message || 'Failed to record student violation.');
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    // Update Student Violation Record
    const handleUpdateStudentViolation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudentViolation) return;
        setSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/student-violations/${editingStudentViolation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(editViolationFormData)
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMessage('Student violation record updated.');
                setEditingStudentViolation(null);
                fetchData();
            } else {
                setErrorMessage(data.message || 'Failed to update student violation.');
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Student Violation Record
    const handleDeleteStudentViolation = async () => {
        if (!deletingStudentViolation) return;
        setSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/student-violations/${deletingStudentViolation.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                }
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMessage('Student violation record deleted.');
                setDeletingStudentViolation(null);
                fetchData();
            } else {
                setErrorMessage(data.message || 'Failed to delete record.');
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    // Reactivate Expired Student
    const handleReactivateStudent = async () => {
        if (!reactivatingStudent) return;
        setSubmitting(true);
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/student-violations/reactivate-student/${reactivatingStudent.LIBRARY_ID}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                }
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMessage(`Account for ${reactivatingStudent.full_name} has been reactivated!`);
                setReactivatingStudent(null);
                fetchData();
            } else {
                setErrorMessage(data.message || 'Failed to reactivate student.');
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    // Open Edit Violation Type Modal
    const openEditType = (type: ViolationType) => {
        setEditingType(type);
        setTypeFormData({
            code: type.code,
            name: type.name,
            description: type.description || '',
            severity: type.severity,
            status: type.status
        });
        setIsCreateTypeOpen(true);
    };

    // Open Edit Student Violation Modal
    const openEditStudentViolation = (sv: StudentViolation) => {
        setEditingStudentViolation(sv);
        setEditViolationFormData({
            violation_type_id: sv.violation_type_id.toString(),
            notes: sv.notes || '',
            occurred_at: sv.occurred_at ? sv.occurred_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
            status: sv.status,
            resolution_notes: sv.resolution_notes || ''
        });
    };

    const renderSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'Minor':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">Minor</Badge>;
            case 'Moderate':
                return <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700">Moderate</Badge>;
            case 'Major':
                return <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700">Major</Badge>;
            case 'Critical':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700">Critical</Badge>;
            default:
                return <Badge variant="outline">{severity}</Badge>;
        }
    };

    return (
        <>
            <Head title="Library Violations & Discipline" />

            <div className="flex flex-col gap-6 p-6">
                {/* Toast Alerts */}
                {successMessage && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-xs font-semibold">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200 rounded-xl flex items-center gap-3 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <p className="text-xs font-semibold">{errorMessage}</p>
                    </div>
                )}

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <span>Violation Types</span>
                            <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_types}</div>
                        <p className="text-[11px] text-slate-500">Configured offenses</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <span>Total Violations</span>
                            <FileText className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_violations}</div>
                        <p className="text-[11px] text-slate-500">All recorded infractions</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <span>Active Violations</span>
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.active_violations}</div>
                        <p className="text-[11px] text-slate-500">Pending or active</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <span>Expired Students</span>
                            <UserX className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.expired_students}</div>
                        <p className="text-[11px] text-slate-500">Reached 3 active limit</p>
                    </div>
                </div>

                {/* Tab Navigation & Action Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Tab Buttons */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl gap-1">
                            <button
                                onClick={() => setActiveTab('student_violations')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    activeTab === 'student_violations'
                                        ? 'bg-white dark:bg-slate-900 text-[#024495] dark:text-blue-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                Student Violations
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    activeTab === 'student_violations'
                                        ? 'bg-blue-100 text-[#024495] dark:bg-blue-950 dark:text-blue-300'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {stats.total_violations}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('violation_types')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    activeTab === 'violation_types'
                                        ? 'bg-white dark:bg-slate-900 text-[#024495] dark:text-blue-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Shield className="w-4 h-4" />
                                Violation Types
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                    activeTab === 'violation_types'
                                        ? 'bg-blue-100 text-[#024495] dark:bg-blue-950 dark:text-blue-300'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                    {stats.total_types}
                                </span>
                            </button>
                        </div>

                        {/* Action Buttons depending on active tab */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                className="text-xs rounded-xl"
                                title="Refresh Data"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>

                            {activeTab === 'student_violations' ? (
                                <Button
                                    onClick={() => setIsIssueViolationOpen(true)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                >
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Issue Student Violation
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        setEditingType(null);
                                        setTypeFormData({
                                            code: '',
                                            name: '',
                                            description: '',
                                            severity: 'Minor',
                                            status: 'Active'
                                        });
                                        setIsCreateTypeOpen(true);
                                    }}
                                    className="bg-[#024495] hover:bg-[#023370] text-white font-bold text-xs rounded-xl shadow-xs"
                                >
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Violation Type
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* TAB 1: STUDENT VIOLATIONS */}
                    {activeTab === 'student_violations' && (
                        <div>
                            {/* Filter Controls */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search student name, ID, or student #..."
                                        value={searchStudent}
                                        onChange={(e) => setSearchStudent(e.target.value)}
                                        className="pl-9 bg-white dark:bg-slate-900 text-xs rounded-xl"
                                    />
                                </div>

                                <div>
                                    <select
                                        value={filterTypeId}
                                        onChange={(e) => setFilterTypeId(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-slate-900 dark:text-white"
                                    >
                                        <option value="">All Violation Types</option>
                                        {violationTypes.map((vt) => (
                                            <option key={vt.id} value={vt.id}>{vt.name} ({vt.severity})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-slate-900 dark:text-white"
                                    >
                                        <option value="">All Infraction Statuses</option>
                                        <option value="Active">Active Infractions</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Dismissed">Dismissed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Table of Student Violations */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="py-3 px-4">Student Info</th>
                                            <th className="py-3 px-4">Violation Details</th>
                                            <th className="py-3 px-4">Date & Time</th>
                                            <th className="py-3 px-4 text-center">Active Violations</th>
                                            <th className="py-3 px-4 text-center">ID Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-slate-400">
                                                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#024495]" />
                                                    Loading student violations directory...
                                                </td>
                                            </tr>
                                        ) : studentViolations.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-slate-400">
                                                    <AlertCircle className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                                                    No student violations found matching the criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            studentViolations.map((sv) => (
                                                <tr key={sv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                    {/* Student Details */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {resolveImageUrl(sv.student?.PIC) ? (
                                                                <img
                                                                    src={resolveImageUrl(sv.student?.PIC)}
                                                                    alt={sv.student?.full_name || 'Student Avatar'}
                                                                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                                />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-[#024495]/10 text-[#024495] dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                                                    {sv.student?.FN?.[0] || 'S'}{sv.student?.LN?.[0] || 'T'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                                                    {sv.student?.full_name || sv.student_library_id}
                                                                </div>
                                                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                                                    <span>ID: {sv.student_library_id}</span>
                                                                    {sv.student?.COURSE && (
                                                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-[10px]">
                                                                            {sv.student.COURSE}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Violation Details */}
                                                    <td className="py-3 px-4 max-w-xs">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {sv.violation_type?.name || 'Violation'}
                                                                </span>
                                                                {sv.violation_type?.severity && renderSeverityBadge(sv.violation_type.severity)}
                                                            </div>
                                                            {sv.notes && (
                                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
                                                                    "{sv.notes}"
                                                                </p>
                                                            )}
                                                            {sv.issued_by && (
                                                                <span className="text-[10px] text-slate-400 block">Issued by: {sv.issued_by}</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-3 px-4 text-xs">
                                                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {sv.occurred_at_display}
                                                        </div>
                                                    </td>

                                                    {/* Active Violations Count */}
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className={`text-xs font-black ${
                                                                (sv.student?.active_violations_count || 0) >= stats.max_allowed
                                                                    ? 'text-rose-600 dark:text-rose-400'
                                                                    : 'text-amber-600 dark:text-amber-400'
                                                            }`}>
                                                                {sv.student?.active_violations_count || 1} / {stats.max_allowed}
                                                            </span>
                                                            <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                                                <div
                                                                    className={`h-full ${
                                                                        (sv.student?.active_violations_count || 0) >= stats.max_allowed
                                                                            ? 'bg-rose-600'
                                                                            : 'bg-amber-500'
                                                                    }`}
                                                                    style={{
                                                                        width: `${Math.min(100, (((sv.student?.active_violations_count || 1) / stats.max_allowed) * 100))}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* ID Status & Reactivate Action */}
                                                    <td className="py-3 px-4 text-center">
                                                        {sv.student?.is_expired ? (
                                                            <div className="inline-flex flex-col items-center gap-1">
                                                                <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-black rounded-full animate-pulse flex items-center gap-1">
                                                                    <Ban className="w-3 h-3" /> EXPIRED
                                                                </span>
                                                                <button
                                                                    onClick={() => setReactivatingStudent(sv.student)}
                                                                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline flex items-center gap-1 mt-0.5"
                                                                >
                                                                    <UserCheck className="w-3 h-3" /> Reactivate Account
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                                {sv.student?.ID_STATUS || 'Active'}
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditStudentViolation(sv)}
                                                                className="h-7 w-7 p-0"
                                                                title="Edit Violation Record"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeletingStudentViolation(sv)}
                                                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                                title="Delete Violation Record"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: VIOLATION TYPES */}
                    {activeTab === 'violation_types' && (
                        <div>
                            {violationTypes.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">
                                    <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No violation types defined yet.</p>
                                    <p className="text-xs text-slate-500 mt-1">Click "Add Violation Type" to create the first library violation category.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                                    {violationTypes.map((vt) => (
                                        <div
                                            key={vt.id}
                                            className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                                                        {vt.code}
                                                    </span>
                                                    {renderSeverityBadge(vt.severity)}
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{vt.name}</h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    {vt.description || 'No detailed description provided.'}
                                                </p>
                                            </div>

                                            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                                                <Badge variant={vt.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                                                    {vt.status}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditType(vt)}
                                                        className="h-7 w-7 p-0"
                                                        title="Edit Violation Type"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingType(vt)}
                                                        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        title="Delete Violation Type"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: CREATE / EDIT VIOLATION TYPE */}
            <Dialog open={isCreateTypeOpen} onOpenChange={setIsCreateTypeOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-[#024495] flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#024495]" />
                            {editingType ? 'Edit Violation Type' : 'Create New Violation Type'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure infraction code, name, severity, and description.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveViolationType} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Violation Code <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                required
                                placeholder="e.g. LOUD_NOISE"
                                value={typeFormData.code}
                                onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                className="font-mono text-xs rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Violation Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                required
                                placeholder="e.g. Loud Audio / Noise Violation"
                                value={typeFormData.name}
                                onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                                className="text-xs rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Severity Level
                                </label>
                                <select
                                    value={typeFormData.severity}
                                    onChange={(e) => setTypeFormData({ ...typeFormData, severity: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                >
                                    <option value="Minor">Minor</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Major">Major</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={typeFormData.status}
                                    onChange={(e) => setTypeFormData({ ...typeFormData, status: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Detailed Policy Description
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Describe what constitutes this violation..."
                                value={typeFormData.description}
                                onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateTypeOpen(false)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#024495] hover:bg-[#023370] text-white rounded-xl text-xs font-bold"
                            >
                                {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                                Save Violation Type
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: ISSUE STUDENT VIOLATION */}
            <Dialog open={isIssueViolationOpen} onOpenChange={setIsIssueViolationOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            Issue Student Violation
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Select student and violation category. Sends HTML email notification via SMTP.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleIssueStudentViolation} className="space-y-4 pt-2">
                        {selectedStudent ? (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Selected Student <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {selectedStudent.PIC ? (
                                            <img
                                                src={resolveImageUrl(selectedStudent.PIC)}
                                                alt={selectedStudent.full_name}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold text-sm flex items-center justify-center shrink-0">
                                                {selectedStudent.FN?.[0] || ''}{selectedStudent.LN?.[0] || ''}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                {selectedStudent.full_name}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                No: <span className="font-mono">{selectedStudent.STUDENT_NUMBER}</span> | ID: <span className="font-mono">{selectedStudent.LIBRARY_ID}</span>
                                            </div>
                                            {selectedStudent.COURSE && (
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                                    {selectedStudent.COURSE}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                            selectedStudent.active_violations_count >= 3
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                                : selectedStudent.active_violations_count > 0
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        }`}>
                                            {selectedStudent.active_violations_count}/3 Active Violations
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setViolationFormData({ ...violationFormData, student_library_id: '' });
                                                setStudentSearchInput('');
                                                setDebouncedStudentQuery('');
                                                setTimeout(() => setShowStudentSuggestions(true), 50);
                                            }}
                                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            title="Change Student"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative" ref={studentSearchRef}>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Search Student <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search student by name, student number, or library ID..."
                                        value={studentSearchInput}
                                        onChange={(e) => {
                                            setStudentSearchInput(e.target.value);
                                            setShowStudentSuggestions(true);
                                        }}
                                        onFocus={() => setShowStudentSuggestions(true)}
                                        className="pl-9 pr-9 text-xs rounded-xl h-10"
                                    />
                                    {isDebouncingStudent ? (
                                        <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                                    ) : studentSearchInput ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStudentSearchInput('');
                                                setDebouncedStudentQuery('');
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    ) : null}
                                </div>

                                {/* Debounced Suggestions Dropdown */}
                                {showStudentSuggestions && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                        {isDebouncingStudent ? (
                                            <div className="p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                                Searching students...
                                            </div>
                                        ) : filteredStudentSuggestions.length > 0 ? (
                                            filteredStudentSuggestions.map((s) => (
                                                <button
                                                    key={s.LIBRARY_ID}
                                                    type="button"
                                                    onClick={() => {
                                                        setViolationFormData({ ...violationFormData, student_library_id: s.LIBRARY_ID });
                                                        setShowStudentSuggestions(false);
                                                    }}
                                                    className="w-full p-2.5 text-left hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between gap-3 group"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {s.PIC ? (
                                                            <img
                                                                src={resolveImageUrl(s.PIC)}
                                                                alt={s.full_name}
                                                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600">
                                                                {s.FN?.[0] || ''}{s.LN?.[0] || ''}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                {s.full_name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                                <span className="font-mono">{s.STUDENT_NUMBER}</span> • ID: <span className="font-mono">{s.LIBRARY_ID}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                                            s.active_violations_count >= 3
                                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                                                : s.active_violations_count > 0
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {s.active_violations_count}/3 Active
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                                No students found matching &quot;{debouncedStudentQuery}&quot;
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Violation Category / Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={violationFormData.violation_type_id}
                                onChange={(e) => setViolationFormData({ ...violationFormData, violation_type_id: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            >
                                <option value="">-- Select Violation Type --</option>
                                {violationTypes.filter(vt => vt.status === 'Active').map((vt) => (
                                    <option key={vt.id} value={vt.id}>
                                        {vt.name} (Severity: {vt.severity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Occurred Date & Time
                            </label>
                            <Input
                                type="datetime-local"
                                value={violationFormData.occurred_at}
                                onChange={(e) => setViolationFormData({ ...violationFormData, occurred_at: e.target.value })}
                                className="text-xs rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Incident Remarks / Staff Notes
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Provide specific details about this incident (e.g. location, staff observer, items involved)..."
                                value={violationFormData.notes}
                                onChange={(e) => setViolationFormData({ ...violationFormData, notes: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
                                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Send HTML Email notification using SMTP config</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={violationFormData.send_email}
                                onChange={(e) => setViolationFormData({ ...violationFormData, send_email: e.target.checked })}
                                className="w-4 h-4 accent-amber-600 rounded"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsIssueViolationOpen(false)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                            >
                                {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                                Issue Violation & Notify
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: EDIT STUDENT VIOLATION RECORD */}
            <Dialog open={!!editingStudentViolation} onOpenChange={(open) => !open && setEditingStudentViolation(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-[#024495] flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-[#024495]" />
                            Edit Violation Record #{editingStudentViolation?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Update violation category, incident date, or resolution status.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateStudentViolation} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Violation Type
                            </label>
                            <select
                                required
                                value={editViolationFormData.violation_type_id}
                                onChange={(e) => setEditViolationFormData({ ...editViolationFormData, violation_type_id: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            >
                                {violationTypes.map((vt) => (
                                    <option key={vt.id} value={vt.id}>{vt.name} ({vt.severity})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={editViolationFormData.status}
                                    onChange={(e) => setEditViolationFormData({ ...editViolationFormData, status: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Dismissed">Dismissed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                    Occurred Date
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={editViolationFormData.occurred_at}
                                    onChange={(e) => setEditViolationFormData({ ...editViolationFormData, occurred_at: e.target.value })}
                                    className="text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Incident Notes
                            </label>
                            <textarea
                                rows={2}
                                value={editViolationFormData.notes}
                                onChange={(e) => setEditViolationFormData({ ...editViolationFormData, notes: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Resolution Notes (if Resolved/Dismissed)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Explain resolution details..."
                                value={editViolationFormData.resolution_notes}
                                onChange={(e) => setEditViolationFormData({ ...editViolationFormData, resolution_notes: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingStudentViolation(null)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#024495] hover:bg-[#023370] text-white rounded-xl text-xs font-bold"
                            >
                                {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                                Update Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: DELETE VIOLATION TYPE */}
            <Dialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl text-center">
                    <DialogHeader className="items-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Delete Violation Type?</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingType?.name}</strong> ({deletingType?.code})?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="sm:justify-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingType(null)}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteViolationType}
                            disabled={submitting}
                            className="rounded-xl text-xs font-bold"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                            Yes, Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: DELETE STUDENT VIOLATION */}
            <Dialog open={!!deletingStudentViolation} onOpenChange={(open) => !open && setDeletingStudentViolation(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl text-center">
                    <DialogHeader className="items-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Delete Violation Record?</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Delete recorded violation for <strong className="text-slate-900 dark:text-white">{deletingStudentViolation?.student?.full_name || deletingStudentViolation?.student_library_id}</strong>?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="sm:justify-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingStudentViolation(null)}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteStudentViolation}
                            disabled={submitting}
                            className="rounded-xl text-xs font-bold"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                            Delete Record
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: REACTIVATE EXPIRED STUDENT */}
            <Dialog open={!!reactivatingStudent} onOpenChange={(open) => !open && setReactivatingStudent(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl text-center">
                    <DialogHeader className="items-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Reactivate Student Account?</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            This will restore status for <strong className="text-slate-900 dark:text-white">{reactivatingStudent?.full_name}</strong> back to <span className="text-emerald-600 font-bold">Active</span>, enabling library access and barcode scanning.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="sm:justify-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReactivatingStudent(null)}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleReactivateStudent}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                            Reactivate Student ID
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ViolationsPage.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);
