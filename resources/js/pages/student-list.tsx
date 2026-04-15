import { Head } from '@inertiajs/react';
import {
    Search,
    UserPen,
    Trash2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    User,
    IdCard,
    Mail,
    Phone,
    MailPlus,
    Minus,
    Send,
    Paperclip,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useEmailCompose } from '@/contexts/email-compose-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { resolveImageUrl } from '@/lib/media';

interface Student {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    STUDENT_RFID_NUMBER: string | null;
    FN: string;
    MN: string | null;
    LN: string;
    SEX: string | null;
    BIRTHDAY: string | null;
    CONTACT_NUMBER: string | null;
    EMAIL: string | null;
    COURSE: string | null;
    PIC: string | null;
    ID_STATUS: string | null;
    REGISTERED_ON: string | null;
    RENEW_ON: string | null;
    FACE_EMBEDDING: any;
    QR_SENT: boolean;
}

interface PaginationData {
    data: Student[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

const breadcrumbs = [{ title: 'Student List', href: '/student-list' }];

export default function StudentList() {
    const [students, setStudents] = useState<Student[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isDeleting, setIsDeleting] = useState<Student | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Global email compose
    const { openEmail } = useEmailCompose();

    // Edit form state
    const [editForm, setEditForm] = useState({
        LIBRARY_ID: '',
        STUDENT_NUMBER: '',
        FN: '',
        MN: '',
        LN: '',
        SEX: '',
        BIRTHDAY: '',
        CONTACT_NUMBER: '',
        EMAIL: '',
        COURSE: '',
        REGISTERED_ON: '',
        RENEW_ON: '',
    });

    const fetchStudents = useCallback(async (page = 1, query = '') => {
        setLoading(true);

        try {
            const response = await fetch(
                `/api/student-list-data?page=${page}&search=${encodeURIComponent(query)}`,
            );
            const data = await response.json();
            setStudents(data.data);
            setPagination(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchStudents(1, search);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, fetchStudents]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchStudents(page, search);
    };

    const handleEditClick = (student: Student) => {
        setEditingStudent(student);
        setEditForm({
            LIBRARY_ID: student.LIBRARY_ID || '',
            STUDENT_NUMBER: student.STUDENT_NUMBER || '',
            FN: student.FN || '',
            MN: student.MN || '',
            LN: student.LN || '',
            SEX: student.SEX || '',
            BIRTHDAY: student.BIRTHDAY || '',
            CONTACT_NUMBER: student.CONTACT_NUMBER || '',
            EMAIL: student.EMAIL || '',
            COURSE: student.COURSE || '',
            REGISTERED_ON: student.REGISTERED_ON || '',
            RENEW_ON: student.RENEW_ON || '',
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingStudent) {
            return;
        }

        setIsUpdating(true);

        try {
            const response = await fetch(
                `/api/students/${editingStudent.LIBRARY_ID}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(editForm),
                },
            );

            if (response.ok) {
                setEditingStudent(null);
                fetchStudents(currentPage, search);
            }
        } catch (error) {
            console.error('Error updating student:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!isDeleting) {
            return;
        }

        try {
            const response = await fetch(
                `/api/students/${isDeleting.LIBRARY_ID}`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                },
            );

            if (response.ok) {
                setIsDeleting(null);
                fetchStudents(currentPage, search);
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const handleComposeClick = (student: Student) => {
        openEmail(student);
    };


    return (
        <TooltipProvider>
            <Head title="Student List" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#024495]">
                            Student Directory
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage library members and their access status.
                        </p>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search name, ID, or email..."
                            className="h-11 rounded-xl border-gray-200 pl-10 focus:ring-2 focus:ring-[#024495]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-4 py-4 font-bold text-gray-500 uppercase">
                                        Avatar
                                    </th>
                                    <th className="px-4 py-4 font-bold text-gray-500 uppercase">
                                        Name
                                    </th>
                                    <th className="px-4 py-4 font-bold text-gray-500 uppercase">
                                        ID Information
                                    </th>
                                    <th className="px-4 py-4 font-bold text-gray-500 uppercase">
                                        Course
                                    </th>
                                    <th className="px-4 py-4 font-bold text-gray-500 uppercase">
                                        Contact Info
                                    </th>
                                    <th className="px-4 py-4 text-center font-bold text-gray-500 uppercase">
                                        Face
                                    </th>
                                    <th className="px-4 py-4 text-center font-bold text-gray-500 uppercase">
                                        QR
                                    </th>
                                    <th className="px-4 py-4 font-bold whitespace-nowrap text-gray-500 uppercase">
                                        RFID #
                                    </th>
                                    <th className="px-4 py-4 text-center font-bold whitespace-nowrap text-gray-500 uppercase">
                                        Registered On
                                    </th>
                                    <th className="px-4 py-4 text-center font-bold whitespace-nowrap text-gray-500 uppercase">
                                        Renew On
                                    </th>
                                    <th className="px-4 py-4 font-bold text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-4 text-right font-bold text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-[#024495]" />
                                                <p className="text-sm font-medium text-gray-500">
                                                    Loading student data...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="px-6 py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <User className="h-12 w-12 text-gray-400" />
                                                <p className="text-sm font-medium text-gray-500">
                                                    No students found.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr
                                            key={student.LIBRARY_ID}
                                            className="group transition-colors hover:bg-[#024495]/[0.02]"
                                        >
                                            <td className="px-4 py-4">
                                                <div
                                                    className="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow-sm ring-2 ring-gray-100 transition-all hover:scale-110"
                                                    onClick={() =>
                                                        setSelectedAvatar(
                                                            student.PIC,
                                                        )
                                                    }
                                                >
                                                    {student.PIC ? (
                                                        <img
                                                            src={resolveImageUrl(
                                                                student.PIC,
                                                            )}
                                                            alt={`${student.FN} ${student.LN}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-bold whitespace-nowrap text-gray-900">
                                                {student.FN} {student.LN}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono font-bold text-gray-900">
                                                        LD:{student.LIBRARY_ID}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        SN:{' '}
                                                        {student.STUDENT_NUMBER ||
                                                            '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600">
                                                {student.COURSE || '—'}
                                            </td>
                                            <td className="px-4 py-4 text-gray-600">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="flex gap-1 font-medium text-gray-900">
                                                        <Mail className="h-3.5 w-3.5" />{' '}
                                                        {student.EMAIL || '—'}
                                                    </span>
                                                    <span className="flex gap-1 text-xs text-gray-500">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {student.CONTACT_NUMBER ||
                                                            '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex justify-center">
                                                    {student.FACE_EMBEDDING ? (
                                                        <span className="font-bold text-green-600">
                                                            Registered
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex justify-center">
                                                    {student.QR_SENT ? (
                                                        <span className="font-bold text-green-600">
                                                            Sent
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <IdCard className="h-4 w-4 text-gray-400" />
                                                    {student.STUDENT_RFID_NUMBER ||
                                                        '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center text-xs whitespace-nowrap text-gray-500">
                                                {student.REGISTERED_ON || '—'}
                                            </td>
                                            <td className="px-4 py-4 text-center text-xs whitespace-nowrap text-gray-500">
                                                {student.RENEW_ON || '—'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                        student.ID_STATUS ===
                                                        'Active'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                                >
                                                    {student.ID_STATUS ||
                                                        'Active'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() =>
                                                            handleEditClick(
                                                                student,
                                                            )
                                                        }
                                                        title="Edit student"
                                                    >
                                                        <UserPen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                        onClick={() =>
                                                            handleComposeClick(
                                                                student,
                                                            )
                                                        }
                                                        title={
                                                            student.EMAIL
                                                                ? `Compose email to ${student.FN}`
                                                                : 'No email on record'
                                                        }
                                                        disabled={
                                                            !student.EMAIL
                                                        }
                                                    >
                                                        <MailPlus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() =>
                                                            setIsDeleting(
                                                                student,
                                                            )
                                                        }
                                                        title="Deactivate student"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                            <div className="text-sm text-gray-500">
                                Showing{' '}
                                <span className="font-bold text-gray-900">
                                    {students.length}
                                </span>{' '}
                                of{' '}
                                <span className="font-bold text-gray-900">
                                    {pagination.total}
                                </span>{' '}
                                students
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.current_page === 1}
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.current_page - 1,
                                        )
                                    }
                                    className="h-9 rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from(
                                        { length: pagination.last_page },
                                        (_, i) => i + 1,
                                    ).map((page) => (
                                        <Button
                                            key={page}
                                            variant={
                                                pagination.current_page === page
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            className={`h-9 w-9 rounded-lg ${pagination.current_page === page ? 'bg-[#024495]' : ''}`}
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        pagination.current_page ===
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.current_page + 1,
                                        )
                                    }
                                    className="h-9 rounded-lg"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar Preview Modal */}
                <Dialog
                    open={!!selectedAvatar}
                    onOpenChange={() => setSelectedAvatar(null)}
                >
                    <DialogContent className="max-w-2xl border-none bg-transparent p-0 shadow-none">
                        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <button
                                className="absolute top-4 right-4 z-10 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40"
                                onClick={() => setSelectedAvatar(null)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                            {selectedAvatar && (
                                <img
                                    src={resolveImageUrl(selectedAvatar)}
                                    className="h-auto max-h-[80vh] w-full object-contain"
                                    alt="Student Avatar"
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog
                    open={!!editingStudent}
                    onOpenChange={() => setEditingStudent(null)}
                >
                    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[650px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-[#024495]">
                                Edit Student Details
                            </DialogTitle>
                            <DialogDescription>
                                Update the information for {editingStudent?.FN}{' '}
                                {editingStudent?.LN}.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleUpdate}
                            className="grid grid-cols-2 gap-4 py-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Library ID (Read Only)
                                </label>
                                <Input
                                    value={editForm.LIBRARY_ID}
                                    readOnly
                                    className="bg-gray-50 font-mono text-gray-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Student Number
                                </label>
                                <Input
                                    value={editForm.STUDENT_NUMBER}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            STUDENT_NUMBER: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    First Name
                                </label>
                                <Input
                                    value={editForm.FN}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            FN: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Last Name
                                </label>
                                <Input
                                    value={editForm.LN}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            LN: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Course
                                </label>
                                <Input
                                    value={editForm.COURSE}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            COURSE: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Sex
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                    value={editForm.SEX || ''}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            SEX: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={editForm.EMAIL || ''}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            EMAIL: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">
                                    Contact Number
                                </label>
                                <Input
                                    value={editForm.CONTACT_NUMBER || ''}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            CONTACT_NUMBER: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <Calendar className="h-3 w-3" /> Registered
                                    On
                                </label>
                                <Input
                                    type="date"
                                    value={editForm.REGISTERED_ON || ''}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            REGISTERED_ON: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <Calendar className="h-3 w-3" /> Renew On
                                </label>
                                <Input
                                    type="date"
                                    value={editForm.RENEW_ON || ''}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            RENEW_ON: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <DialogFooter className="col-span-2 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setEditingStudent(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="bg-[#024495] hover:bg-[#013575]"
                                >
                                    {isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog
                    open={!!isDeleting}
                    onOpenChange={() => setIsDeleting(null)}
                >
                    <DialogContent className="rounded-2xl sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-red-600">
                                Deactivate Student Account?
                            </DialogTitle>
                            <DialogDescription>
                                This will change the status of{' '}
                                <strong>
                                    {isDeleting?.FN} {isDeleting?.LN}
                                </strong>{' '}
                                to{' '}
                                <span className="font-bold text-red-600 italic">
                                    Inactive
                                </span>
                                . The student's record will remain in the
                                database but they will be marked as inactive.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleting(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Yes, Deactivate
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

        </TooltipProvider>
    );
}

StudentList.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
