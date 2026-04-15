import { Transition } from '@headlessui/react';
import { Form, Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { update, testEmail } from '@/routes/settings';

export default function GeneralSettings({
    faceThreshold,
    fingerprintThreshold,
    emailSettings,
    aiSettings,
}: {
    faceThreshold: number;
    fingerprintThreshold: number;
    emailSettings: {
        mail_host: string;
        mail_port: string;
        mail_username: string;
        mail_password: string;
        mail_encryption: string;
        mail_from_address: string;
        mail_from_name: string;
    };
    aiSettings: {
        ai_provider: string;
        ai_local_url: string;
        ai_local_model: string;
        ai_api_base_url: string;
        ai_api_key: string;
        ai_api_model: string;
        ai_system_prompt: string;
    };
}) {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    /* ── Email test result ───────────────────────────────────────────────── */
    const [testResult, setTestResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setTestResult({ type: 'success', message: flash.success });
            const t = setTimeout(() => setTestResult(null), 6000);

            return () => clearTimeout(t);
        }

        if (flash?.error) {
            setTestResult({ type: 'error', message: flash.error });
            const t = setTimeout(() => setTestResult(null), 8000);

            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    /* ── AI state ────────────────────────────────────────────────────────── */
    const [aiProvider, setAiProvider] = useState<'local' | 'api'>(
        (aiSettings.ai_provider as 'local' | 'api') || 'local',
    );
    const [localModels, setLocalModels] = useState<string[]>(
        aiSettings.ai_local_model ? [aiSettings.ai_local_model] : [],
    );
    const [selectedLocalModel, setSelectedLocalModel] = useState(
        aiSettings.ai_local_model || '',
    );
    const [apiModels, setApiModels] = useState<string[]>(
        aiSettings.ai_api_model ? [aiSettings.ai_api_model] : [],
    );
    const [selectedApiModel, setSelectedApiModel] = useState(
        aiSettings.ai_api_model || '',
    );
    const [testingLocal, setTestingLocal] = useState(false);
    const [testingApi, setTestingApi] = useState(false);
    const [localTestResult, setLocalTestResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [apiTestResult, setApiTestResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    /* ── Handlers ────────────────────────────────────────────────────────── */
    const handleTestEmail = () => {
        const data = {
            mail_host: (
                document.getElementById('mail_host') as HTMLInputElement
            )?.value,
            mail_port: (
                document.getElementById('mail_port') as HTMLInputElement
            )?.value,
            mail_username: (
                document.getElementById('mail_username') as HTMLInputElement
            )?.value,
            mail_password: (
                document.getElementById('mail_password') as HTMLInputElement
            )?.value,
            mail_encryption: (
                document.getElementById(
                    'mail_encryption_input',
                ) as HTMLInputElement
            )?.value,
            mail_from_address: (
                document.getElementById('mail_from_address') as HTMLInputElement
            )?.value,
            mail_from_name: (
                document.getElementById('mail_from_name') as HTMLInputElement
            )?.value,
        };

        if (!data.mail_host || !data.mail_port || !data.mail_from_address) {
            alert(
                'Please fill in at least the Host, Port, and From Address to test.',
            );

            return;
        }

        router.post(testEmail.url(), data, {
            preserveScroll: true,
            onSuccess: () => {
                // flash messages are read via usePage
            },
        });
    };

    const handleTestLocalConnection = async () => {
        setTestingLocal(true);
        setLocalTestResult(null);

        const url =
            (document.getElementById('ai_local_url') as HTMLInputElement)
                ?.value ?? '';
        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content ?? '';

        try {
            const res = await fetch('/api/ai/test-local', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as {
                    message?: string;
                };

                throw new Error(body.message ?? `Failed (${res.status})`);
            }

            const data = (await res.json()) as { models?: string[] };
            const models: string[] = data.models ?? [];

            setLocalModels(models);
            setSelectedLocalModel((prev) => prev || (models[0] ?? ''));
            setLocalTestResult({
                type: 'success',
                message: `Connected! Found ${models.length} model(s).`,
            });
        } catch (err) {
            setLocalTestResult({
                type: 'error',
                message:
                    err instanceof Error ? err.message : 'Connection failed.',
            });
        } finally {
            setTestingLocal(false);
        }
    };

    const handleTestApiConnection = async () => {
        setTestingApi(true);
        setApiTestResult(null);

        const base_url =
            (document.getElementById('ai_api_base_url') as HTMLInputElement)
                ?.value ?? '';
        const api_key =
            (document.getElementById('ai_api_key') as HTMLInputElement)
                ?.value ?? '';
        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content ?? '';

        try {
            const res = await fetch('/api/ai/test-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ base_url, api_key }),
            });

            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as {
                    message?: string;
                };

                throw new Error(body.message ?? `Failed (${res.status})`);
            }

            const data = (await res.json()) as { models?: string[] };
            const models: string[] = data.models ?? [];

            setApiModels(models);
            setSelectedApiModel((prev) => prev || (models[0] ?? ''));
            setApiTestResult({
                type: 'success',
                message: `Connected! Found ${models.length} model(s).`,
            });
        } catch (err) {
            setApiTestResult({
                type: 'error',
                message:
                    err instanceof Error ? err.message : 'Connection failed.',
            });
        } finally {
            setTestingApi(false);
        }
    };

    /* ── Render ──────────────────────────────────────────────────────────── */
    return (
        <>
            <Head title="General Settings" />

            <h1 className="sr-only">General Settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="System Settings"
                    description="Global configurations for library modules."
                />

                <Form {...update.form()} className="space-y-8">
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            {/* ── Biometric Sensitivity ──────────────────── */}
                            <div className="border-t border-gray-100 pt-6">
                                <Heading
                                    variant="small"
                                    title="Biometric Sensitivity"
                                    description="Adjust the threshold for scanning modules. Lower is stricter."
                                />
                                <div className="mt-4 space-y-6">
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="face_threshold">
                                            Face Recognition Sensitivity
                                        </Label>
                                        <Input
                                            id="face_threshold"
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            max="0.9"
                                            className="mt-1 block w-full"
                                            defaultValue={faceThreshold}
                                            name="face_threshold"
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground italic">
                                            Recommended: 0.45. Stricter
                                            (&lt;0.40) reduces false matches but
                                            may reject correctly.
                                        </p>
                                        <InputError
                                            className="mt-2"
                                            message={errors.face_threshold}
                                        />
                                    </div>

                                    <div className="grid max-w-sm gap-2">
                                        <Label
                                            htmlFor="fingerprint_threshold"
                                            className="text-muted-foreground opacity-60"
                                        >
                                            Fingerprint Sensitivity (Future)
                                        </Label>
                                        <Input
                                            id="fingerprint_threshold"
                                            type="number"
                                            step="0.01"
                                            className="mt-1 block w-full opacity-50"
                                            defaultValue={fingerprintThreshold}
                                            name="fingerprint_threshold"
                                            disabled
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={
                                                errors.fingerprint_threshold
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Email Configuration ────────────────────── */}
                            <div className="border-t border-gray-100 pt-6">
                                <Heading
                                    variant="small"
                                    title="Email Configuration"
                                    description="Configure SMTP settings for system notifications."
                                />
                                <div className="mt-4 space-y-6">
                                    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="mail_host">
                                                SMTP Host
                                            </Label>
                                            <Input
                                                id="mail_host"
                                                name="mail_host"
                                                defaultValue={
                                                    emailSettings.mail_host
                                                }
                                                placeholder="smtp.mailtrap.io"
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={errors.mail_host}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="mail_port">
                                                SMTP Port
                                            </Label>
                                            <Input
                                                id="mail_port"
                                                name="mail_port"
                                                defaultValue={
                                                    emailSettings.mail_port
                                                }
                                                placeholder="587"
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={errors.mail_port}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="mail_username">
                                                SMTP Username
                                            </Label>
                                            <Input
                                                id="mail_username"
                                                name="mail_username"
                                                defaultValue={
                                                    emailSettings.mail_username
                                                }
                                                placeholder="Your SMTP username"
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={errors.mail_username}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="mail_password">
                                                SMTP Password
                                            </Label>
                                            <Input
                                                id="mail_password"
                                                type="password"
                                                name="mail_password"
                                                defaultValue={
                                                    emailSettings.mail_password
                                                }
                                                placeholder="••••••••"
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={errors.mail_password}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="mail_encryption">
                                                Encryption
                                            </Label>
                                            <Select
                                                defaultValue={
                                                    emailSettings.mail_encryption
                                                }
                                                name="mail_encryption"
                                                onValueChange={(value) => {
                                                    const input =
                                                        document.getElementById(
                                                            'mail_encryption_input',
                                                        ) as HTMLInputElement;

                                                    if (input) {
                                                        input.value = value;
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select encryption" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        None
                                                    </SelectItem>
                                                    <SelectItem value="ssl">
                                                        SSL
                                                    </SelectItem>
                                                    <SelectItem value="tls">
                                                        TLS
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                id="mail_encryption_input"
                                                name="mail_encryption"
                                                defaultValue={
                                                    emailSettings.mail_encryption
                                                }
                                            />
                                            <InputError
                                                message={errors.mail_encryption}
                                            />
                                        </div>
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="mail_from_address">
                                                From Address
                                            </Label>
                                            <Input
                                                id="mail_from_address"
                                                name="mail_from_address"
                                                defaultValue={
                                                    emailSettings.mail_from_address
                                                }
                                                placeholder="no-reply@library.com"
                                                className="mt-1 block w-full"
                                            />
                                            <InputError
                                                message={
                                                    errors.mail_from_address
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="mail_from_name">
                                            From Name
                                        </Label>
                                        <Input
                                            id="mail_from_name"
                                            name="mail_from_name"
                                            defaultValue={
                                                emailSettings.mail_from_name
                                            }
                                            placeholder="Library Management System"
                                            className="mt-1 block w-full"
                                        />
                                        <InputError
                                            message={errors.mail_from_name}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleTestEmail}
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Sending…'
                                                    : 'Test Connection'}
                                            </Button>
                                            <p className="text-[11px] text-muted-foreground">
                                                Sends a test email to the
                                                configured 'From Address' above.
                                            </p>
                                        </div>
                                        {testResult && (
                                            <div
                                                className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                                                    testResult.type ===
                                                    'success'
                                                        ? 'border-green-200 bg-green-50 text-green-800'
                                                        : 'border-red-200 bg-red-50 text-red-800'
                                                }`}
                                            >
                                                {testResult.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── AI Assistant ───────────────────────────── */}
                            <div className="border-t border-gray-100 pt-6">
                                <Heading
                                    variant="small"
                                    title="AI Assistant"
                                    description="Configure the AI that powers the built-in assistant panel."
                                />

                                {/* Hidden inputs so form submission includes AI settings */}
                                <input
                                    type="hidden"
                                    name="ai_provider"
                                    value={aiProvider}
                                    readOnly
                                />
                                <input
                                    type="hidden"
                                    name="ai_local_model"
                                    value={selectedLocalModel}
                                    readOnly
                                />
                                <input
                                    type="hidden"
                                    name="ai_api_model"
                                    value={selectedApiModel}
                                    readOnly
                                />

                                {/* Provider toggle */}
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            aiProvider === 'local'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => setAiProvider('local')}
                                    >
                                        Local AI (Ollama)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            aiProvider === 'api'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => setAiProvider('api')}
                                    >
                                        Internet AI (API)
                                    </Button>
                                </div>

                                {/* ── Local AI (Ollama) ── */}
                                {aiProvider === 'local' && (
                                    <div className="mt-4 space-y-4">
                                        <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label htmlFor="ai_local_url">
                                                    Ollama URL
                                                </Label>
                                                <Input
                                                    id="ai_local_url"
                                                    name="ai_local_url"
                                                    defaultValue={
                                                        aiSettings.ai_local_url ||
                                                        'http://localhost:11434'
                                                    }
                                                    placeholder="http://localhost:11434"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        void handleTestLocalConnection();
                                                    }}
                                                    disabled={testingLocal}
                                                    className="w-full"
                                                >
                                                    {testingLocal
                                                        ? 'Testing…'
                                                        : 'Test Connection'}
                                                </Button>
                                            </div>
                                        </div>

                                        {localTestResult && (
                                            <div
                                                className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                                                    localTestResult.type ===
                                                    'success'
                                                        ? 'border-green-200 bg-green-50 text-green-800'
                                                        : 'border-red-200 bg-red-50 text-red-800'
                                                }`}
                                            >
                                                {localTestResult.message}
                                            </div>
                                        )}

                                        {localModels.length > 0 && (
                                            <div className="grid max-w-sm gap-2">
                                                <Label>Available Model</Label>
                                                <Select
                                                    value={selectedLocalModel}
                                                    onValueChange={
                                                        setSelectedLocalModel
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {localModels.map(
                                                            (m) => (
                                                                <SelectItem
                                                                    key={m}
                                                                    value={m}
                                                                >
                                                                    {m}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Internet AI (API) ── */}
                                {aiProvider === 'api' && (
                                    <div className="mt-4 space-y-4">
                                        <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="ai_api_base_url">
                                                    API Base URL
                                                </Label>
                                                <Input
                                                    id="ai_api_base_url"
                                                    name="ai_api_base_url"
                                                    defaultValue={
                                                        aiSettings.ai_api_base_url
                                                    }
                                                    placeholder="https://api.openai.com"
                                                />
                                                <p className="text-[11px] text-muted-foreground italic">
                                                    Any OpenAI-compatible
                                                    endpoint (OpenAI, Together
                                                    AI, Groq, etc.)
                                                </p>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="ai_api_key">
                                                    API Key
                                                </Label>
                                                <Input
                                                    id="ai_api_key"
                                                    name="ai_api_key"
                                                    type="password"
                                                    defaultValue={
                                                        aiSettings.ai_api_key
                                                    }
                                                    placeholder="sk-..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => {
                                                    void handleTestApiConnection();
                                                }}
                                                disabled={testingApi}
                                            >
                                                {testingApi
                                                    ? 'Testing…'
                                                    : 'Test Connection'}
                                            </Button>
                                            <p className="text-[11px] text-muted-foreground">
                                                Fetches available models from
                                                the API endpoint.
                                            </p>
                                        </div>

                                        {apiTestResult && (
                                            <div
                                                className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                                                    apiTestResult.type ===
                                                    'success'
                                                        ? 'border-green-200 bg-green-50 text-green-800'
                                                        : 'border-red-200 bg-red-50 text-red-800'
                                                }`}
                                            >
                                                {apiTestResult.message}
                                            </div>
                                        )}

                                        {apiModels.length > 0 && (
                                            <div className="grid max-w-sm gap-2">
                                                <Label>Model</Label>
                                                <Select
                                                    value={selectedApiModel}
                                                    onValueChange={
                                                        setSelectedApiModel
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {apiModels.map((m) => (
                                                            <SelectItem
                                                                key={m}
                                                                value={m}
                                                            >
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── System Prompt ── */}
                                <div className="mt-6 grid max-w-2xl gap-2">
                                    <Label htmlFor="ai_system_prompt">
                                        System Prompt
                                    </Label>
                                    <textarea
                                        id="ai_system_prompt"
                                        name="ai_system_prompt"
                                        rows={5}
                                        defaultValue={
                                            aiSettings.ai_system_prompt
                                        }
                                        placeholder="You are a helpful library management assistant. Help users with student records, library operations, and administrative tasks."
                                        className="flex min-h-[100px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <p className="text-[11px] text-muted-foreground italic">
                                        Instructions given to the AI before
                                        every conversation. Leave blank for no
                                        system instructions.
                                    </p>
                                </div>
                            </div>

                            {/* ── Save ───────────────────────────────────── */}
                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>
                                    Save Changes
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">
                                        Saved successfully.
                                    </p>
                                </Transition>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
