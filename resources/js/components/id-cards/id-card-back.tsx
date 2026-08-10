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

    return (
        <div
            onClick={onClick}
            className={`relative bg-white text-black font-sans border border-black shadow-none overflow-hidden select-none box-border flex flex-col justify-between ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''}`}
            style={{
                width: `${widthMm * scale}mm`,
                height: `${heightMm * scale}mm`,
                fontSize: `${6.5 * scale}pt`,
                lineHeight: 1.1,
                padding: `${2 * scale}mm ${2.5 * scale}mm`,
            }}
        >
            {/* Academic Validation Grid Table */}
            <div className="w-full mb-1">
                <table className="w-full border-collapse border border-gray-900 text-center font-sans">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-900 font-bold uppercase">
                            <th
                                className="border-r border-gray-900 py-0.5 px-1 w-[28%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                SY
                            </th>
                            <th
                                className="border-r border-gray-900 py-0.5 px-1 w-[24%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                1st SEM
                            </th>
                            <th
                                className="border-r border-gray-900 py-0.5 px-1 w-[24%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                2nd SEM
                            </th>
                            <th
                                className="py-0.5 px-1 w-[24%]"
                                style={{ fontSize: `${5.2 * scale}pt` }}
                            >
                                SUMMER
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {academicYears.map((sy) => (
                            <tr key={sy} className="border-b border-gray-900 last:border-b-0">
                                <td
                                    className="border-r border-gray-900 py-0.5 font-bold text-gray-900"
                                    style={{ fontSize: `${4.8 * scale}pt` }}
                                >
                                    {sy}
                                </td>
                                <td className="border-r border-gray-900 py-0.5"></td>
                                <td className="border-r border-gray-900 py-0.5"></td>
                                <td className="py-0.5"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Rules & Librarian Signature Block */}
            <div className="flex items-end justify-between mt-auto pt-0.5 min-h-0">
                {/* Left Rules List */}
                <div className="flex-1 pr-2">
                    <ul className="list-none p-0 m-0 space-y-0.5">
                        {rules.map((rule, ruleIdx) => (
                            <li
                                key={ruleIdx}
                                className="font-extrabold uppercase tracking-tight text-gray-900"
                                style={{ fontSize: `${4.5 * scale}pt`, lineHeight: 1.15 }}
                            >
                                {rule}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Librarian Signature & Name Block */}
                <div className="flex flex-col items-center text-center w-[45%]">
                    <div
                        className="w-full border-b border-gray-900 pb-0.5 relative flex items-end justify-center min-h-[14px]"
                        style={{ minHeight: `${4.5 * scale}mm` }}
                    >
                        {settings.librarian_signature ? (
                            <img
                                src={settings.librarian_signature}
                                alt="Librarian Signature"
                                className="h-[16px] max-w-full object-contain absolute bottom-0.5"
                            />
                        ) : null}
                    </div>
                    <div
                        className="font-extrabold uppercase tracking-tight text-gray-900 mt-0.5 whitespace-nowrap"
                        style={{ fontSize: `${5.5 * scale}pt` }}
                    >
                        {settings.librarian_name || 'ESTRELLA E. YAGO, DPA. RL'}
                    </div>
                    <div
                        className="italic font-medium text-gray-700"
                        style={{ fontSize: `${4.8 * scale}pt` }}
                    >
                        {settings.librarian_title || 'College Librarian'}
                    </div>
                </div>
            </div>
        </div>
    );
};
