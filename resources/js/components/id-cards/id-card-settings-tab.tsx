import { useForm } from '@inertiajs/react';
import { CheckCircle2, Image as ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { IDCardTemplateSettings } from './id-card-front';

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
        librarian_name: settings.librarian_name || 'ESTRELLA E. YAGO, DPA. RL',
        librarian_title: settings.librarian_title || 'College Librarian',
        logo: null as File | null,
        librarian_signature: null as File | null,
        rules: rules,
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                {recentlySuccessful && (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Settings Saved Successfully!
                    </span>
                )}
                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6">
                    <Save className="w-4 h-4 mr-2" />
                    Save Template Settings
                </Button>
            </div>
        </form>
    );
};
