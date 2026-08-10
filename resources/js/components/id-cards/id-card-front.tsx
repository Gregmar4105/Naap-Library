import React from 'react';

export interface IDCardTemplateSettings {
    country: string;
    school_name: string;
    sub_header: string;
    address: string;
    card_width_mm?: number;
    card_height_mm?: number;
    logo?: string | null;
    librarian_name: string;
    librarian_title: string;
    librarian_signature?: string | null;
    rules: string[];
    // Customizable Font Sizes (pt)
    font_size_country?: number;
    font_size_school_name?: number;
    font_size_sub_header?: number;
    font_size_address?: number;
    font_size_student_name?: number;
    font_size_id_number?: number;
    font_size_course?: number;
    font_size_role?: number;
    font_size_librarian_name?: number;
    font_size_librarian_title?: number;
    font_size_rules?: number;
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
    // Dynamic Font Sizes (fallback to reference defaults)
    const fontSizeCountry = (settings.font_size_country ?? 4.8) * scale;
    const fontSizeSchoolName = (settings.font_size_school_name ?? 6.8) * scale;
    const fontSizeSubHeader = (settings.font_size_sub_header ?? 4.2) * scale;
    const fontSizeAddress = (settings.font_size_address ?? 4.2) * scale;
    const fontSizeIdNumber = (settings.font_size_id_number ?? 6.2) * scale;
    const fontSizeStudentName = (settings.font_size_student_name ?? 7.8) * scale;
    const fontSizeCourse = (settings.font_size_course ?? 6.8) * scale;
    const fontSizeRole = (settings.font_size_role ?? 6.8) * scale;

    return (
        <div
            onClick={onClick}
            className={`relative bg-white text-black font-sans border border-black shadow-none overflow-hidden select-none box-border flex flex-col justify-between ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''}`}
            style={{
                width: `${widthMm * scale}mm`,
                height: `${heightMm * scale}mm`,
                fontSize: `${7 * scale}pt`,
                lineHeight: 1.15,
                padding: `${2 * scale}mm ${3.5 * scale}mm`,
            }}
        >
            {/* 1. TOP CENTER / HEADER */}
            <div className="w-full text-center leading-tight pb-0.5">
                <div
                    className="font-normal uppercase tracking-wider text-black truncate"
                    style={{ fontSize: `${fontSizeCountry}pt` }}
                >
                    {settings.country || 'Republic of the Philippines'}
                </div>
                <div
                    className="font-black uppercase tracking-tight text-black truncate"
                    style={{ fontSize: `${fontSizeSchoolName}pt` }}
                >
                    {settings.school_name || 'NATIONAL AVIATION ACADEMY OF THE PHILIPPINES'}
                </div>
                <div
                    className="font-medium text-black leading-none truncate"
                    style={{ fontSize: `${fontSizeSubHeader}pt` }}
                >
                    The National Professional Institution for Aviation
                </div>
                <div
                    className="font-medium text-black leading-none truncate"
                    style={{ fontSize: `${fontSizeSubHeader}pt` }}
                >
                    (Formerly Philippine State College of Aeronautics)
                </div>
                <div
                    className="font-normal text-black truncate"
                    style={{ fontSize: `${fontSizeAddress}pt` }}
                >
                    {settings.address || 'Piccio Garden, Villamor, Pasay City'}
                </div>
            </div>

            {/* 2. BODY SECTION (LEFT: Barcode, Info, Signature; RIGHT: Photo + Role) */}
            <div className="flex flex-1 items-stretch justify-between pt-1.5 gap-2 min-h-0">
                {/* LEFT COLUMN */}
                <div className="flex-1 flex flex-col justify-between pr-1 min-w-0">
                    {/* Barcode & Student Number */}
                    <div className="flex flex-col items-start mt-3 mb-0.5">
                        {data.barcode_image ? (
                            <img
                                src={data.barcode_image}
                                alt={`Barcode ${data.library_id_number}`}
                                className="object-contain"
                                style={{ width: `${32 * scale}mm`, height: `${9.5 * scale}mm` }}
                            />
                        ) : (
                            <div
                                className="font-mono bg-gray-100 border border-dashed px-1 py-0.5 text-center font-bold tracking-widest"
                                style={{ fontSize: `${fontSizeIdNumber}pt` }}
                            >
                                *{data.library_id_number}*
                            </div>
                        )}
                        <span
                            className="font-mono font-bold text-black tracking-wider mt-0.5"
                            style={{ fontSize: `${fontSizeIdNumber}pt` }}
                        >
                            {data.library_id_number}
                        </span>
                    </div>

                    {/* Student Information (Name + Course) - Positioned directly above Signature Box */}
                    <div className="mt-auto mb-1">
                        <div
                            className="font-black uppercase tracking-tight text-black truncate"
                            style={{ fontSize: `${fontSizeStudentName}pt` }}
                            title={data.full_name}
                        >
                            {data.full_name || 'JULIUS MAXIMUS F. DE JESUS'}
                        </div>
                        <div
                            className="font-extrabold uppercase text-black truncate mt-0.5"
                            style={{ fontSize: `${fontSizeCourse}pt` }}
                        >
                            {data.course || 'AAMT'}
                        </div>
                    </div>

                    {/* Signature Box */}
                    <div>
                        <div
                            className="border border-black relative bg-white"
                            style={{ width: `${28 * scale}mm`, height: `${6 * scale}mm` }}
                        >
                            <div className="absolute bottom-0 left-0 right-0 border-b border-gray-400" />
                        </div>
                        <div
                            className="text-black mt-0.5 font-normal"
                            style={{ fontSize: `${4.2 * scale}pt` }}
                        >
                            Signature
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Photo + STUDENT Label — pushed to bottom */}
                <div className="flex flex-col items-center justify-end w-[30%] shrink-0">
                    {/* Photo */}
                    <div
                        className="border border-black bg-white overflow-hidden flex items-center justify-center w-full"
                        style={{
                            height: `${29 * scale}mm`,
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

                    {/* STUDENT Label */}
                    <div
                        className="font-black uppercase tracking-wider text-black text-center w-full pt-0.5"
                        style={{ fontSize: `${fontSizeRole}pt` }}
                    >
                        STUDENT
                    </div>
                </div>
            </div>
        </div>
    );
};
