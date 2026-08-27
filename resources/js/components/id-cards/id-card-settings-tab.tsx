import { useForm } from '@inertiajs/react';
import { CheckCircle2, Eye, Image as ImageIcon, Plus, Save, Sparkles, Trash2, Type } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IDCardBack } from './id-card-back';
import type { IDCardData, IDCardTemplateSettings } from './id-card-front';
import { IDCardFront } from './id-card-front';

interface IDCardSettingsTabProps {
    settings: IDCardTemplateSettings;
}

export const IDCardSettingsTab: React.FC<IDCardSettingsTabProps> = ({ settings }) => {
    const [rules, setRules] = useState<string[]>(
        settings.rules && settings.rules.length > 0
            ? settings.rules
            : [
                  'NO UNIFORM, NO LIBRARY ID, NO ENTRY',
                  'HELD RESPONSIBLE FOR ALL MATERIALS BORROWED',
                  'NON-TRANSFERABLE',
              ]
    );

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        country: settings.country || 'Republic of the Philippines',
        school_name: settings.school_name || 'NATIONAL AVIATION ACADEMY OF THE PHILIPPINES',
        sub_header: settings.sub_header || "The National Professional Institution for Aviation\n(Formerly Philippine State College of Aeronautics)",
        address: settings.address || 'Piccio Garden, Villamor, Pasay City',
        card_width_mm: settings.card_width_mm || 85.60,
        card_height_mm: settings.card_height_mm || 53.98,
        librarian_name: settings.librarian_name || 'ESTRELLA E. YAGO, DPA. RL',
        librarian_title: settings.librarian_title || 'College Librarian',
        logo: null as File | null,
        librarian_signature: null as File | null,
        rules: rules,

        // Customizable Font Sizes (pt)
        font_size_country: settings.font_size_country ?? 4.8,
        font_size_school_name: settings.font_size_school_name ?? 6.6,
        font_size_sub_header: settings.font_size_sub_header ?? 4.2,
        font_size_address: settings.font_size_address ?? 4.2,
        font_size_student_name: settings.font_size_student_name ?? 7.8,
        font_size_id_number: settings.font_size_id_number ?? 6.2,
        font_size_course: settings.font_size_course ?? 6.8,
        font_size_role: settings.font_size_role ?? 6.8,
        font_size_librarian_name: settings.font_size_librarian_name ?? 6.5,
        font_size_librarian_title: settings.font_size_librarian_title ?? 5.5,
        font_size_rules: settings.font_size_rules ?? 5.0,
    });

    const handleAddRule = () => {
        const updated = [...rules, ''];
        setRules(updated);
        setData('rules', updated);
    };

    const handleRuleChange = (index: number, val: string) => {
        const updated = [...rules];
        updated[index] = val;
        setRules(updated);
        setData('rules', updated);
    };

    const handleRemoveRule = (index: number) => {
        const updated = rules.filter((_, i) => i !== index);
        setRules(updated);
        setData('rules', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/id-cards/template-settings', {
            preserveScroll: true,
        });
    };

    // Live simulation preview sample student data
    const sampleStudent: IDCardData = {
        student_library_id: 'SAMPLE-001',
        library_id_number: '26-0001',
        full_name: 'JUAN SANTOS CRUZ',
        course: 'BSAIT 3-3',
        barcode_value: '26-0001',
        barcode_image: null,
        photo: null,
    };

    // Construct real-time live simulation settings from form data
    const liveSimulationSettings: IDCardTemplateSettings = {
        country: data.country,
        school_name: data.school_name,
        sub_header: data.sub_header,
        address: data.address,
        card_width_mm: data.card_width_mm,
        card_height_mm: data.card_height_mm,
        logo: data.logo ? URL.createObjectURL(data.logo) : settings.logo,
        librarian_name: data.librarian_name,
        librarian_title: data.librarian_title,
        librarian_signature: data.librarian_signature
            ? URL.createObjectURL(data.librarian_signature)
            : settings.librarian_signature,
        rules: data.rules,
        font_size_country: data.font_size_country,
        font_size_school_name: data.font_size_school_name,
        font_size_sub_header: data.font_size_sub_header,
        font_size_address: data.font_size_address,
        font_size_student_name: data.font_size_student_name,
        font_size_id_number: data.font_size_id_number,
        font_size_course: data.font_size_course,
        font_size_role: data.font_size_role,
        font_size_librarian_name: data.font_size_librarian_name,
        font_size_librarian_title: data.font_size_librarian_title,
        font_size_rules: data.font_size_rules,
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front ID Header Card */}
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/50">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                            Front ID Template Header
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="country">Country Header Line</Label>
                            <Input
                                id="country"
                                value={data.country}
                                onChange={(e) => setData('country', e.target.value)}
                                placeholder="e.g. Republic of the Philippines"
                            />
                            {errors.country && <span className="text-xs text-red-500">{errors.country}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="school_name">Institution / School Name</Label>
                            <Input
                                id="school_name"
                                value={data.school_name}
                                onChange={(e) => setData('school_name', e.target.value)}
                                placeholder="e.g. NATIONAL AVIATION ACADEMY OF THE PHILIPPINES"
                            />
                            {errors.school_name && <span className="text-xs text-red-500">{errors.school_name}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sub_header">Sub-Header / Secondary Title</Label>
                            <Textarea
                                id="sub_header"
                                rows={2}
                                value={data.sub_header}
                                onChange={(e) => setData('sub_header', e.target.value)}
                                placeholder="e.g. The National Professional Institution for Aviation..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address">School Address</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="e.g. Piccio Garden, Villamor, Pasay City"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div className="space-y-1.5">
                                <Label htmlFor="card_width_mm">Default Physical Width (mm)</Label>
                                <Input
                                    id="card_width_mm"
                                    type="number"
                                    step="0.1"
                                    value={data.card_width_mm}
                                    onChange={(e) => setData('card_width_mm', Number(e.target.value) || 85.6)}
                                    placeholder="85.60"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="card_height_mm">Default Physical Height (mm)</Label>
                                <Input
                                    id="card_height_mm"
                                    type="number"
                                    step="0.1"
                                    value={data.card_height_mm}
                                    onChange={(e) => setData('card_height_mm', Number(e.target.value) || 53.98)}
                                    placeholder="53.98"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="logo">School Logo (Optional)</Label>
                            <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setData('logo', e.target.files ? e.target.files[0] : null)}
                            />
                            {settings.logo && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img src={settings.logo} alt="Current Logo" className="h-10 object-contain border p-1 rounded" />
                                    <span className="text-xs text-gray-500">Current Logo Loaded</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Back ID Template & Rules Card */}
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/50">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                            Back ID Template & Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="librarian_name">Librarian Name</Label>
                            <Input
                                id="librarian_name"
                                value={data.librarian_name}
                                onChange={(e) => setData('librarian_name', e.target.value)}
                                placeholder="e.g. ESTRELLA E. YAGO, DPA. RL"
                            />
                            {errors.librarian_name && <span className="text-xs text-red-500">{errors.librarian_name}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="librarian_title">Librarian Designation / Title</Label>
                            <Input
                                id="librarian_title"
                                value={data.librarian_title}
                                onChange={(e) => setData('librarian_title', e.target.value)}
                                placeholder="e.g. College Librarian"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="librarian_signature">Librarian Signature Image (Optional)</Label>
                            <Input
                                id="librarian_signature"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setData('librarian_signature', e.target.files ? e.target.files[0] : null)}
                            />
                            {settings.librarian_signature && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img src={settings.librarian_signature} alt="Librarian Signature" className="h-8 object-contain border p-1 rounded bg-white" />
                                    <span className="text-xs text-gray-500">Signature Loaded</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 border-t pt-3">
                            <div className="flex items-center justify-between">
                                <Label>Library Rules List (Printed on Back)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddRule} className="text-xs">
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Line
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {rules.map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            value={rule}
                                            onChange={(e) => handleRuleChange(idx, e.target.value)}
                                            placeholder={`Rule line ${idx + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveRule(idx)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Individual Typography & Font Sizes (pt) Section */}
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm md:col-span-2">
                    <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/50">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Type className="w-5 h-5 text-indigo-600" />
                            Individual Typography & Font Sizes (pt)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Front Card Text Sizes (pt)</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_country" className="text-xs font-medium">Country Header</Label>
                                    <Input
                                        id="font_size_country"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_country}
                                        onChange={(e) => setData('font_size_country', Number(e.target.value) || 4.8)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_school_name" className="text-xs font-medium">School Name</Label>
                                    <Input
                                        id="font_size_school_name"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_school_name}
                                        onChange={(e) => setData('font_size_school_name', Number(e.target.value) || 6.6)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_sub_header" className="text-xs font-medium">Sub-Header</Label>
                                    <Input
                                        id="font_size_sub_header"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_sub_header}
                                        onChange={(e) => setData('font_size_sub_header', Number(e.target.value) || 4.2)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_address" className="text-xs font-medium">School Address</Label>
                                    <Input
                                        id="font_size_address"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_address}
                                        onChange={(e) => setData('font_size_address', Number(e.target.value) || 4.2)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_student_name" className="text-xs font-medium">Student Full Name</Label>
                                    <Input
                                        id="font_size_student_name"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_student_name}
                                        onChange={(e) => setData('font_size_student_name', Number(e.target.value) || 7.8)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_id_number" className="text-xs font-medium">Library ID Number</Label>
                                    <Input
                                        id="font_size_id_number"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_id_number}
                                        onChange={(e) => setData('font_size_id_number', Number(e.target.value) || 6.2)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_course" className="text-xs font-medium">Course / Program</Label>
                                    <Input
                                        id="font_size_course"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_course}
                                        onChange={(e) => setData('font_size_course', Number(e.target.value) || 6.8)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_role" className="text-xs font-medium">Role (STUDENT)</Label>
                                    <Input
                                        id="font_size_role"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_role}
                                        onChange={(e) => setData('font_size_role', Number(e.target.value) || 6.8)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Back Card Text Sizes (pt)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_rules" className="text-xs font-medium">Library Rules</Label>
                                    <Input
                                        id="font_size_rules"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_rules}
                                        onChange={(e) => setData('font_size_rules', Number(e.target.value) || 5.0)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_librarian_name" className="text-xs font-medium">Librarian Name</Label>
                                    <Input
                                        id="font_size_librarian_name"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_librarian_name}
                                        onChange={(e) => setData('font_size_librarian_name', Number(e.target.value) || 6.5)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="font_size_librarian_title" className="text-xs font-medium">Librarian Designation</Label>
                                    <Input
                                        id="font_size_librarian_title"
                                        type="number"
                                        step="0.1"
                                        value={data.font_size_librarian_title}
                                        onChange={(e) => setData('font_size_librarian_title', Number(e.target.value) || 5.5)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Live ID Card Simulation Section */}
                <Card className="border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20 shadow-md md:col-span-2">
                    <CardHeader className="border-b border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/80 dark:bg-indigo-950/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Live ID Card Simulation (Front & Back Preview)
                            </CardTitle>
                            <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> Live Real-Time Updates
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 pb-8 flex flex-col items-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center">
                            Adjust headers, font sizes, physical dimensions, or logos above — this simulation updates instantly in real time.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-8 w-full">
                            {/* Front Simulation Card */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Front Side Simulation
                                </span>
                                <div className="p-3 bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all hover:scale-[1.02]">
                                    <IDCardFront
                                        data={sampleStudent}
                                        settings={liveSimulationSettings}
                                        scale={1.35}
                                        widthMm={data.card_width_mm}
                                        heightMm={data.card_height_mm}
                                    />
                                </div>
                            </div>

                            {/* Back Simulation Card */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Back Side Simulation
                                </span>
                                <div className="p-3 bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all hover:scale-[1.02]">
                                    <IDCardBack
                                        data={sampleStudent}
                                        settings={liveSimulationSettings}
                                        scale={1.35}
                                        widthMm={data.card_width_mm}
                                        heightMm={data.card_height_mm}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                {recentlySuccessful && (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Settings Saved Successfully!
                    </span>
                )}
                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 cursor-pointer">
                    <Save className="w-4 h-4 mr-2" />
                    Save Template Settings
                </Button>
            </div>
        </form>
    );
};
