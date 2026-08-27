import { Eye, Printer, RotateCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IDCardBack } from './id-card-back';
import type { IDCardData, IDCardTemplateSettings } from './id-card-front';
import { IDCardFront } from './id-card-front';

interface IDCardPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cardData: IDCardData | null;
    settings: IDCardTemplateSettings;
    onPrintSingle: (item: IDCardData, side: 'front' | 'back' | 'both') => void;
}

export const IDCardPreviewModal: React.FC<IDCardPreviewModalProps> = ({
    open,
    onOpenChange,
    cardData,
    settings,
    onPrintSingle,
}) => {
    const [side, setSide] = useState<'front' | 'back'>('front');

    if (!cardData) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-6 overflow-hidden">
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                        <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Library ID Card Preview — {cardData.library_id_number}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center py-4 space-y-4">
                    {/* Front / Back Toggle */}
                    <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Button
                            variant={side === 'front' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSide('front')}
                            className="text-xs px-4 font-semibold"
                        >
                            FRONT SIDE
                        </Button>
                        <Button
                            variant={side === 'back' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSide('back')}
                            className="text-xs px-4 font-semibold"
                        >
                            BACK SIDE
                        </Button>
                    </div>

                    {/* CLEAN ID CARD DISPLAY ONLY (NO OUTER GREY CONTAINER / NO MOCKUP FRAME) */}
                    <div className="flex justify-center items-center py-2">
                        {side === 'front' ? (
                            <IDCardFront data={cardData} settings={settings} scale={1.45} />
                        ) : (
                            <IDCardBack data={cardData} settings={settings} scale={1.45} />
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t pt-3 flex flex-wrap gap-2 justify-between items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSide(side === 'front' ? 'back' : 'front')}
                        className="text-xs"
                    >
                        <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                        Flip Card
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onPrintSingle(cardData, 'front')}
                            className="text-xs"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Print Front Only
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onPrintSingle(cardData, 'back')}
                            className="text-xs"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Print Back Only
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onPrintSingle(cardData, 'both')}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 font-bold"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Print Both Sides
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
