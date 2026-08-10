import React from 'react';

export interface IDCardTemplateSettings {
    country: string;
    school_name: string;
    sub_header: string;
    address: string;
    logo?: string | null;
    librarian_name: string;
    librarian_title: string;
    librarian_signature?: string | null;
    rules: string[];
}

export interface IDCardData {
    card_id?: number | null;
    student_library_id: string;
    student_number?: string | null;
    full_name: string;
    first_name?: string;
    last_name?: string;
    course: string;
    photo?: string | null;
    library_id_number: string;
    barcode_value: string;
    barcode_image?: string | null;
    status?: string;
}

interface IDCardFrontProps {
    data: IDCardData;
    settings: IDCardTemplateSettings;
    scale?: number;
    widthMm?: number;
    heightMm?: number;
    onClick?: () => void;
}

export const IDCardFront: React.FC<IDCardFrontProps> = ({
    data,
    settings,
    scale = 1,
    widthMm = 85.6,
    heightMm = 53.98,
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className={`relative bg-white text-black font-sans border border-black shadow-none overflow-hidden select-none box-border flex flex-col justify-between ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''}`}
            style={{
                width: `${widthMm * scale}mm`,
                height: `${heightMm * scale}mm`,
                fontSize: `${7 * scale}pt`,
                lineHeight: 1.15,
                padding: `${2 * scale}mm ${2.5 * scale}mm`,
            }}
        >
            {/* Top Institution Header */}
            <div className="text-center w-full leading-tight border-b border-gray-300 pb-0.5">
                <div
                    className="font-normal uppercase tracking-wider text-gray-700"
                    style={{ fontSize: `${5.2 * scale}pt` }}
                >
                    {settings.country || 'Republic of the Philippines'}
                </div>
                <div
                    className="font-extrabold uppercase tracking-tight text-gray-900"
                    style={{ fontSize: `${7.2 * scale}pt` }}
                >
                    {settings.school_name || 'NATIONAL AVIATION ACADEMY OF THE PHILIPPINES'}
                </div>
                {settings.sub_header && (
                    <div
                        className="italic font-medium text-gray-600 whitespace-pre-line"
                        style={{ fontSize: `${4.5 * scale}pt` }}
                    >
                        {settings.sub_header}
                    </div>
                )}
                {settings.address && (
                    <div
                        className="font-normal text-gray-600"
                        style={{ fontSize: `${4.5 * scale}pt` }}
                    >
                        {settings.address}
                    </div>
                )}
            </div>

            {/* Middle & Bottom Body Content */}
            <div className="flex flex-1 items-stretch justify-between pt-1 gap-1.5 min-h-0">
                {/* Left Side: Barcode, Name, Course, Signature */}
                <div className="flex-1 flex flex-col justify-between pr-1 min-w-0">
                    {/* Barcode & ID Number */}
                    <div className="flex flex-col items-start mb-0.5">
                        {data.barcode_image ? (
                            <img
                                src={data.barcode_image}
                                alt={`Barcode ${data.library_id_number}`}
                                className="h-[22px] max-w-[125px] object-contain"
                                style={{ height: `${8 * scale}mm` }}
                            />
                        ) : (
                            <div
                                className="font-mono bg-gray-100 border border-dashed px-1 py-0.5 text-center font-bold tracking-widest"
                                style={{ fontSize: `${6.5 * scale}pt` }}
                            >
                                *{data.library_id_number}*
                            </div>
                        )}
                        <span
                            className="font-mono font-bold text-gray-900 tracking-wider mt-0.5"
                            style={{ fontSize: `${6.2 * scale}pt` }}
                        >
                            {data.library_id_number}
                        </span>
                    </div>

                    {/* Member Name & Course */}
                    <div className="my-auto">
                        <div
                            className="font-black uppercase tracking-tight text-gray-900 truncate"
                            style={{ fontSize: `${7.8 * scale}pt` }}
                            title={data.full_name}
                        >
                            {data.full_name || 'STUDENT NAME'}
                        </div>
                        <div
                            className="font-bold uppercase text-gray-700 truncate"
                            style={{ fontSize: `${6.8 * scale}pt` }}
                        >
                            {data.course || 'COURSE / PROGRAM'}
                        </div>
                    </div>

                    {/* Signature Box */}
                    <div className="mt-auto">
                        <div
                            className="w-[85px] border border-gray-900 h-[18px] relative bg-white"
                            style={{ width: `${26 * scale}mm`, height: `${5 * scale}mm` }}
                        >
                            <div className="absolute bottom-0 left-0 right-0 border-b border-gray-400" />
                        </div>
                        <div
                            className="text-gray-600 mt-0.5"
                            style={{ fontSize: `${4.2 * scale}pt` }}
                        >
                            Signature
                        </div>
                    </div>
                </div>

                {/* Right Side: Photo & Role */}
                <div className="flex flex-col items-center justify-between w-[32%] shrink-0">
                    {/* Student Photo */}
                    <div
                        className="border border-gray-900 bg-gray-50 overflow-hidden flex items-center justify-center"
                        style={{
                            width: `${24 * scale}mm`,
                            height: `${28 * scale}mm`,
                        }}
                    >
                        {data.photo ? (
                            <img
                                src={data.photo}
                                alt={data.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-gray-400 text-center p-1 text-[5.5pt]">
                                NO PHOTO
                            </div>
                        )}
                    </div>

                    {/* Student Role */}
                    <div
                        className="font-black uppercase tracking-wider text-gray-900 text-center mt-0.5"
                        style={{ fontSize: `${6.8 * scale}pt` }}
                    >
                        STUDENT
                    </div>
                </div>
            </div>
        </div>
    );
};
