import React from 'react';
import type { IDCardData, IDCardTemplateSettings } from './id-card-front';

interface IDCardBackProps {
    data?: IDCardData;
    settings: IDCardTemplateSettings;
    scale?: number;
    widthMm?: number;
    heightMm?: number;
    startYear?: number;
    onClick?: () => void;
}

export const IDCardBack: React.FC<IDCardBackProps> = ({
    settings,
    scale = 1,
    widthMm = 85.6,
    heightMm = 53.98,
    startYear = new Date().getFullYear(),
    onClick,
}) => {
    const academicYears = Array.from({ length: 5 }, (_, i) => {
        const syStart = startYear + i;

        return `${syStart}-${syStart + 1}`;
    });

    const defaultRules = [
        'NO UNIFORM, NO LIBRARY ID, NO ENTRY',
        'HELD RESPONSIBLE FOR ALL MATERIALS BORROWED',
        'NON-TRANSFERABLE',
    ];

    const rules = settings.rules && settings.rules.length > 0 ? settings.rules : defaultRules;

    // Dynamic Font Sizes (fallback to reference defaults)
    const fontSizeRules = (settings.font_size_rules ?? 5.0) * scale;
    const fontSizeLibrarianName = (settings.font_size_librarian_name ?? 6.5) * scale;
    const fontSizeLibrarianTitle = (settings.font_size_librarian_title ?? 5.5) * scale;

    return (
        <div
            onClick={onClick}
            className={`relative bg-white text-black font-sans border border-black shadow-none overflow-hidden select-none box-border flex flex-col ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''}`}
            style={{
                width: `${widthMm * scale}mm`,
                height: `${heightMm * scale}mm`,
                fontSize: `${6.5 * scale}pt`,
                lineHeight: 1.1,
                padding: `${2.5 * scale}mm ${5 * scale}mm ${2 * scale}mm ${4 * scale}mm`,
            }}
        >
            {/* TABLE + RULES block */}
            <div className="flex flex-col">
            {/* 1. SEMESTER TABLE */}
            <div className="mb-px">
                <table className="w-full border-collapse border border-black text-center font-sans">
                    <thead>
                        <tr className="bg-white border-b border-black font-extrabold uppercase">
                            <th
                                className="border-r border-black py-0.5 px-1 w-[22%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                SY
                            </th>
                            <th
                                className="border-r border-black py-0.5 px-1 w-[26%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                1st SEM
                            </th>
                            <th
                                className="border-r border-black py-0.5 px-1 w-[26%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                2nd SEM
                            </th>
                            <th
                                className="py-0.5 px-1 w-[26%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                SUMMER
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {academicYears.map((sy) => (
                            <tr key={sy} className="border-b border-black last:border-b-0">
                                <td
                                    className="border-r border-black font-black text-black"
                                    style={{ fontSize: `${6.2 * scale}pt`, height: `${4.2 * scale}mm` }}
                                >
                                    {sy}
                                </td>
                                <td className="border-r border-black" style={{ height: `${4.2 * scale}mm` }}></td>
                                <td className="border-r border-black" style={{ height: `${4.2 * scale}mm` }}></td>
                                <td style={{ height: `${4.2 * scale}mm` }}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 2. LIBRARY RULES & LIBRARIAN SIGNATURE BLOCK */}
            <div className="flex flex-col">
                {/* Rules List — full width left */}
                <ul className="list-none p-0 m-0 space-y-0.5 mb-0.5">
                    {rules.map((rule, ruleIdx) => (
                        <li
                            key={ruleIdx}
                            className="font-extrabold uppercase tracking-tight text-black leading-tight"
                            style={{ fontSize: `${fontSizeRules}pt` }}
                        >
                            {rule}
                        </li>
                    ))}
                </ul>

                {/* Librarian Signature Box & Designation — centered below rules */}
                <div className="flex flex-col items-center text-center w-[60%] mx-auto mt-0.5">
                    <div
                        className="w-full border border-black relative bg-white flex items-center justify-center"
                        style={{ height: `${6.5 * scale}mm` }}
                    >
                        {settings.librarian_signature ? (
                            <img
                                src={settings.librarian_signature}
                                alt="Librarian Signature"
                                className="h-[18px] max-w-full object-contain"
                            />
                        ) : null}
                    </div>
                    <div
                        className="font-black uppercase tracking-tight text-black mt-0.5 whitespace-nowrap"
                        style={{ fontSize: `${fontSizeLibrarianName}pt` }}
                    >
                        {settings.librarian_name || 'ESTRELLA E. YAGO, DPA, RL'}
                    </div>
                    <div
                        className="italic font-medium text-black leading-none"
                        style={{ fontSize: `${fontSizeLibrarianTitle}pt` }}
                    >
                        {settings.librarian_title || 'College Librarian'}
                    </div>
                </div>
            </div>{/* end rules */}
            </div>{/* end mt-auto wrapper */}
        </div>
    );
};
