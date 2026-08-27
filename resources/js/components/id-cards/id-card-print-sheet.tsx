import { ArrowLeft, FileText, Printer, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IDCardBack } from './id-card-back';
import type { IDCardData, IDCardTemplateSettings } from './id-card-front';
import { IDCardFront } from './id-card-front';
import { IDCardPreviewModal } from './id-card-preview-modal';

interface IDCardPrintSheetProps {
    items: IDCardData[];
    settings: IDCardTemplateSettings;
    printSide: 'front' | 'back' | 'both';
    onClose: () => void;
    onStatusUpdated?: () => void;
}

export const IDCardPrintSheet: React.FC<IDCardPrintSheetProps> = ({
    items,
    settings,
    printSide: initialPrintSide,
    onClose,
    onStatusUpdated,
}) => {
    // Layout Mode: 'combo' (3 IDs / 6 Cards per A4 Sheet: Front & Back side-by-side per row)
    const [layoutMode, setLayoutMode] = useState<string>(
        initialPrintSide === 'both' ? 'combo' : initialPrintSide === 'front' ? 'front-only' : 'back-only'
    );

    // Customizable physical card dimensions in mm (default from settings or 85.60 mm x 53.98 mm)
    const [cardWidthMm, setCardWidthMm] = useState<number>(settings.card_width_mm || 85.60);
    const [cardHeightMm, setCardHeightMm] = useState<number>(settings.card_height_mm || 53.98);

    // Interactive Preview Modal state
    const [selectedCardForPreview, setSelectedCardForPreview] = useState<IDCardData | null>(null);

    // Each A4 page fits 3 Students (Row 1: Student 1, Row 2: Student 2, Row 3: Student 3)
    const studentsPerPage = layoutMode === 'combo' ? 3 : 6;
    const studentPages: IDCardData[][] = [];

    for (let i = 0; i < items.length; i += studentsPerPage) {
        studentPages.push(items.slice(i, i + studentsPerPage));
    }

    // Attach afterprint listener so status is updated to ISSUED on print completion
    useEffect(() => {
        const handleAfterPrint = async () => {
            try {
                const studentIds = items.map((item) => item.student_library_id);
                const response = await fetch('/api/id-cards/mark-issued', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({
                        student_library_ids: studentIds,
                    }),
                });
                const data = await response.json();

                if (data?.success && onStatusUpdated) {
                    onStatusUpdated();
                }
            } catch (err) {
                console.error('Failed to mark status as ISSUED:', err);
            }
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [items, onStatusUpdated]);

    const handlePrintClick = () => {
        window.print();
    };

    const handleResetDimensions = () => {
        setCardWidthMm(settings.card_width_mm || 85.60);
        setCardHeightMm(settings.card_height_mm || 53.98);
    };

    return (
        <div className="print-sheet-wrapper min-h-screen bg-slate-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6 flex flex-col items-center select-none print:bg-white print:p-0 print:m-0 print:min-h-0 print:text-black print:block">
            {/* Top Toolbar */}
            <div className="no-print w-full max-w-6xl mb-6 flex flex-wrap items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Cards
                    </Button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Print / PDF Layout ({items.length} {items.length === 1 ? 'Card' : 'Cards'} — {studentPages.length} {studentPages.length === 1 ? 'Page' : 'Pages'})
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Physical Dimensions: <span className="font-mono text-indigo-600 dark:text-indigo-300 font-bold">{cardWidthMm}mm × {cardHeightMm}mm</span> — 3 IDs / Page
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Dimension Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">W (mm):</span>
                        <Input
                            type="number"
                            step="0.1"
                            value={cardWidthMm}
                            onChange={(e) => setCardWidthMm(Number(e.target.value) || 85.6)}
                            className="w-16 h-7 text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">H (mm):</span>
                        <Input
                            type="number"
                            step="0.1"
                            value={cardHeightMm}
                            onChange={(e) => setCardHeightMm(Number(e.target.value) || 53.98)}
                            className="w-16 h-7 text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleResetDimensions}
                            title="Reset to Standard Dimensions (85.60 mm × 53.98 mm)"
                            className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* Layout Selector */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Layout:</span>
                        <Select value={layoutMode} onValueChange={setLayoutMode}>
                            <SelectTrigger className="w-[230px] h-9 text-xs bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                                <SelectItem value="combo">3 IDs / Page (Front & Back Pair)</SelectItem>
                                <SelectItem value="front-only">Front Side Only (6 per page)</SelectItem>
                                <SelectItem value="back-only">Back Side Only (6 per page)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Print / Save PDF Button */}
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handlePrintClick}
                        className="h-9 bg-indigo-600 hover:bg-indigo-500 font-bold px-5 text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                        <Printer className="w-4 h-4 mr-1.5" />
                        Print / Save as PDF
                    </Button>
                </div>
            </div>

            {/* Print CSS Rules */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    *, ::before, ::after {
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    html, body, #app, main, .print-sheet-wrapper {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 210mm !important;
                        height: auto !important;
                        min-height: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    aside, header, nav, [role="sidebar"], [data-sidebar], .no-print, .w-13 {
                        display: none !important;
                    }
                    .page-break {
                        page-break-after: always;
                        break-after: page;
                    }
                    .print-sheet-container {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        position: relative !important;
                    }
                }
            ` }} />

            {/* A4 Printable Pages Container */}
            <div className="space-y-10 print:space-y-0 w-full flex flex-col items-center">
                {studentPages.map((pageStudents, pageIdx) => (
                    <div
                        key={`page-${pageIdx}`}
                        className="print-sheet-container bg-white text-black w-[210mm] h-[297mm] p-[10mm] shadow-2xl rounded-sm box-border flex flex-col justify-between page-break border border-gray-200 print:border-none print:shadow-none"
                    >
                        {/* Header Banner (Screen Preview Only) */}
                        <div className="no-print text-xs font-mono text-gray-400 border-b pb-1 flex justify-between">
                            <span>
                                Page {pageIdx + 1} of {studentPages.length} — {layoutMode === 'combo' ? '3 IDs COMBO LAYOUT' : layoutMode === 'front-only' ? 'FRONT SIDE ONLY' : 'BACK SIDE ONLY'} ({pageStudents.length} {pageStudents.length === 1 ? 'ID' : 'IDs'})
                            </span>
                            <span>Scale: {cardWidthMm}mm × {cardHeightMm}mm</span>
                        </div>

                        {/* 3 ROWS LAYOUT (3 IDs / 6 CARDS PER A4 PAGE) */}
                        {layoutMode === 'combo' ? (
                            <div className="flex-1 flex flex-col justify-around py-4">
                                {pageStudents.map((student, sIdx) => (
                                    <div key={`student-row-${pageIdx}-${sIdx}`} className="flex flex-col items-center">
                                        <div className="no-print text-[9pt] font-bold text-indigo-600 uppercase tracking-wider mb-1 text-center">
                                            ID #{pageIdx * 3 + sIdx + 1}: {student.full_name} ({student.library_id_number})
                                        </div>
                                        <div className="flex justify-center items-center gap-0">
                                            <div className="box-border">
                                                <IDCardFront
                                                    data={student}
                                                    settings={settings}
                                                    widthMm={cardWidthMm}
                                                    heightMm={cardHeightMm}
                                                    onClick={() => setSelectedCardForPreview(student)}
                                                />
                                            </div>
                                            <div className="box-border">
                                                <IDCardBack
                                                    data={student}
                                                    settings={settings}
                                                    widthMm={cardWidthMm}
                                                    heightMm={cardHeightMm}
                                                    onClick={() => setSelectedCardForPreview(student)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : layoutMode === 'front-only' ? (
                            /* FRONT ONLY 6-GRID */
                            <div className="grid grid-cols-2 gap-x-[10mm] gap-y-[8mm] justify-items-center items-center my-auto py-4">
                                {pageStudents.map((student, sIdx) => (
                                    <div key={`front-only-${pageIdx}-${sIdx}`} className="box-border">
                                        <IDCardFront
                                            data={student}
                                            settings={settings}
                                            widthMm={cardWidthMm}
                                            heightMm={cardHeightMm}
                                            onClick={() => setSelectedCardForPreview(student)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* BACK ONLY 6-GRID */
                            <div className="grid grid-cols-2 gap-x-[10mm] gap-y-[8mm] justify-items-center items-center my-auto py-4">
                                {pageStudents.map((student, sIdx) => (
                                    <div key={`back-only-${pageIdx}-${sIdx}`} className="box-border">
                                        <IDCardBack
                                            data={student}
                                            settings={settings}
                                            widthMm={cardWidthMm}
                                            heightMm={cardHeightMm}
                                            onClick={() => setSelectedCardForPreview(student)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto pt-2 text-[8pt] font-mono text-gray-400 text-center no-print">
                            Anti Gravity Library System — 3 IDs / Page Print Layout
                        </div>
                    </div>
                ))}
            </div>

            {/* Interactive Preview Modal on Card Click */}
            {selectedCardForPreview && (
                <IDCardPreviewModal
                    open={!!selectedCardForPreview}
                    onOpenChange={(open) => {
                        if (!open) {
setSelectedCardForPreview(null);
}
                    }}
                    cardData={selectedCardForPreview}
                    settings={settings}
                    onPrintSingle={(item, side) => {
                        setSelectedCardForPreview(null);

                        if (side === 'front') {
                            setLayoutMode('front-only');
                        } else if (side === 'back') {
                            setLayoutMode('back-only');
                        } else {
                            setLayoutMode('combo');
                        }
                    }}
                />
            )}
        </div>
    );
};
