import { Head, router } from '@inertiajs/react';
import {
    CheckSquare,
    Eye,
    IdCard,
    PlusCircle,
    Printer,
    RefreshCw,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import React, { useState } from 'react';
import type { IDCardData, IDCardTemplateSettings } from '@/components/id-cards/id-card-front';
import { IDCardPreviewModal } from '@/components/id-cards/id-card-preview-modal';
import { IDCardPrintSheet } from '@/components/id-cards/id-card-print-sheet';
import { IDCardSettingsTab } from '@/components/id-cards/id-card-settings-tab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface StudentItem {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    FN: string;
    MN: string;
    LN: string;
    PIC: string | null;
    COURSE: string | null;
    current_card: IDCardData & {
        id?: number | null;
        status: string;
        issued_at?: string | null;
        printed_at?: string | null;
    };
}

interface PageProps {
    students: {
        data: StudentItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search: string;
        status: string;
    };
    templateSettings: IDCardTemplateSettings;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Library ID Cards', href: '/id-cards' },
];

export default function IDCardsPage({ students, filters, templateSettings }: PageProps) {
    const [activeTab, setActiveTab] = useState<'cards' | 'settings'>('cards');
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewCardData, setPreviewCardData] = useState<IDCardData | null>(null);

    const [isPrinting, setIsPrinting] = useState(false);
    const [printData, setPrintData] = useState<IDCardData[]>([]);
    const [printSideMode, setPrintSideMode] = useState<'front' | 'back' | 'both'>('both');

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        router.get('/id-cards', { search, status: statusFilter }, { preserveState: true });
    };

    const toggleSelectStudent = (id: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === students.data.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(students.data.map((s) => s.LIBRARY_ID));
        }
    };

    const handlePreviewSingle = (student: StudentItem) => {
        const fullName = trimName(student.FN, student.MN, student.LN);
        const card: IDCardData = {
            card_id: student.current_card?.id || null,
            student_library_id: student.LIBRARY_ID,
            student_number: student.STUDENT_NUMBER,
            full_name: fullName,
            first_name: student.FN,
            last_name: student.LN,
            course: student.COURSE || 'N/A',
            photo: formatPhotoUrl(student.PIC),
            library_id_number: student.current_card?.library_id_number || student.LIBRARY_ID,
            barcode_value: student.current_card?.barcode_value || student.LIBRARY_ID,
            barcode_image: student.current_card?.barcode_image,
            status: student.current_card?.status || 'ACTIVE',
        };
        setPreviewCardData(card);
        setPreviewModalOpen(true);
    };

    const handlePrintSingleFromModal = (card: IDCardData, side: 'front' | 'back' | 'both') => {
        setPrintData([card]);
        setPrintSideMode(side);
        setPreviewModalOpen(false);
        setIsPrinting(true);
    };

    const handleBatchPrint = async (side: 'front' | 'back' | 'both' = 'both') => {
        if (selectedStudentIds.length === 0) {
            return;
        }

        try {
            const response = await fetch('/api/id-cards/print-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    student_library_ids: selectedStudentIds,
                }),
            });
            const data = await response.json();

            if (data?.items) {
                setPrintData(data.items);
                setPrintSideMode(side);
                setIsPrinting(true);
            }
        } catch (err) {
            console.error('Failed to load batch print data', err);
        }
    };

    const handleIssueCard = (studentLibId: string) => {
        router.post(`/api/id-cards/issue/${studentLibId}`, {}, { preserveScroll: true });
    };

    const handleBatchIssue = () => {
        if (selectedStudentIds.length === 0) {
            return;
        }

        router.post('/api/id-cards/batch-issue', { student_library_ids: selectedStudentIds }, { preserveScroll: true });
    };

    const handleReprint = (cardId: number) => {
        router.post(`/api/id-cards/reprint/${cardId}`, {}, { preserveScroll: true });
    };

    function trimName(fn?: string, mn?: string, ln?: string) {
        return [fn, mn, ln].filter(Boolean).join(' ');
    }

    function formatPhotoUrl(pic?: string | null) {
        if (!pic) {
            return null;
        }

        if (pic.startsWith('http') || pic.startsWith('data:')) {
            return pic;
        }

        return `/storage/${pic.replace(/^\//, '')}`;
    }

    if (isPrinting) {
        return (
            <IDCardPrintSheet
                items={printData}
                settings={templateSettings}
                printSide={printSideMode}
                onClose={() => setIsPrinting(false)}
                onStatusUpdated={() => {
                    router.reload({ preserveScroll: true });
                }}
            />
        );
    }

    return (
        <>
            <Head title="Library ID Cards" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                            <IdCard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            Library ID Cards
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Issue, preview, manage, and batch-print standardized physical library ID cards (85.60 mm × 53.98 mm).
                        </p>
                    </div>

                    <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border">
                        <Button
                            variant={activeTab === 'cards' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('cards')}
                            className="text-xs px-4 font-semibold"
                        >
                            <IdCard className="w-4 h-4 mr-1.5" />
                            Member ID Cards
                        </Button>
                        <Button
                            variant={activeTab === 'settings' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('settings')}
                            className="text-xs px-4 font-semibold"
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                            Template Configuration
                        </Button>
                    </div>
                </div>

                {activeTab === 'cards' ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xs border">
                            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search member name, student number, course, or library ID..."
                                        className="pl-9 h-10 text-sm w-full rounded-lg border-gray-300 dark:border-gray-700"
                                    />
                                </div>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(val) => {
                                        setStatusFilter(val);
                                        router.get('/id-cards', { search, status: val }, { preserveState: true });
                                    }}
                                >
                                    <SelectTrigger className="w-[160px] h-10 text-xs font-medium border-gray-300 dark:border-gray-700">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Members</SelectItem>
                                        <SelectItem value="active">Active ID Only</SelectItem>
                                        <SelectItem value="unissued">Unissued Only</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit" variant="secondary" size="default" className="h-10 px-5 text-xs font-semibold">
                                    Filter
                                </Button>
                            </form>

                            {selectedStudentIds.length > 0 && (
                                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg">
                                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                        <CheckSquare className="w-4 h-4" />
                                        {selectedStudentIds.length} Selected
                                    </span>
                                    <div className="h-4 w-px bg-indigo-300 dark:bg-indigo-700 mx-1" />
                                    <Button size="sm" variant="outline" onClick={handleBatchIssue} className="text-xs h-8">
                                        <PlusCircle className="w-3.5 h-3.5 mr-1" />
                                        Batch Issue IDs
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="default" className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 font-bold">
                                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                                Batch Print ({selectedStudentIds.length})
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleBatchPrint('both')}>
                                                Print Both Front & Back (A4 Grid)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBatchPrint('front')}>
                                                Print Front Only (A4 Grid)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBatchPrint('back')}>
                                                Print Back Only (A4 Grid)
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </div>

                        <Card className="border shadow-xs">
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                                            <TableHead className="w-12 text-center">
                                                <Checkbox
                                                    checked={selectedStudentIds.length > 0 && selectedStudentIds.length === students.data.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead className="w-16">Photo</TableHead>
                                            <TableHead>Member Name</TableHead>
                                            <TableHead>Student No.</TableHead>
                                            <TableHead>Course / Program</TableHead>
                                            <TableHead>Library ID Number</TableHead>
                                            <TableHead>Card Status</TableHead>
                                            <TableHead className="text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                                    No members or ID cards found matching your query.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            students.data.map((student) => {
                                                const fullName = trimName(student.FN, student.MN, student.LN);
                                                const hasActiveCard = student.current_card && student.current_card.status === 'ACTIVE' && student.current_card.id;
                                                const isSelected = selectedStudentIds.includes(student.LIBRARY_ID);

                                                return (
                                                    <TableRow key={student.LIBRARY_ID} className={isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelectStudent(student.LIBRARY_ID)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="w-10 h-10 rounded-full border bg-gray-100 overflow-hidden flex items-center justify-center">
                                                                {student.PIC ? (
                                                                    <img src={formatPhotoUrl(student.PIC)!} alt={fullName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-gray-400">NO PIC</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-bold text-gray-900 dark:text-gray-100">
                                                            {fullName}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-300">
                                                            {student.STUDENT_NUMBER || '—'}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            {student.COURSE || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="font-mono font-extrabold text-sm text-indigo-700 dark:text-indigo-400">
                                                            {student.current_card?.library_id_number || student.LIBRARY_ID}
                                                        </TableCell>
                                                        <TableCell>
                                                            {student.current_card?.status === 'ISSUED' ? (
                                                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                                                                    ISSUED
                                                                </Badge>
                                                            ) : hasActiveCard ? (
                                                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                                                                    ACTIVE
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                                                                    UNISSUED
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6 space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePreviewSingle(student)}
                                                                className="text-xs"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                                                                Preview
                                                            </Button>

                                                            {hasActiveCard ? (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => handleReprint(student.current_card.id!)}
                                                                    className="text-xs"
                                                                    title="Reprint Card without changing ID sequence"
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                                                    Reprint
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => handleIssueCard(student.LIBRARY_ID)}
                                                                    className="text-xs bg-indigo-600 hover:bg-indigo-500 font-bold"
                                                                >
                                                                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                                                                    Issue ID
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <IDCardSettingsTab settings={templateSettings} />
                )}
            </div>

            <IDCardPreviewModal
                open={previewModalOpen}
                onOpenChange={setPreviewModalOpen}
                cardData={previewCardData}
                settings={templateSettings}
                onPrintSingle={handlePrintSingleFromModal}
            />
        </>
    );
}

IDCardsPage.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);
