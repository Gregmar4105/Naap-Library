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
import {
    HardDrive,
    Database,
    Trash2,
    RefreshCw,
    Server,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    Sparkles,
    FolderArchive,
    Calendar,
    Loader2
} from 'lucide-react';

interface StorageAnalyticsProps {
    disk: {
        total_bytes: number;
        free_bytes: number;
        used_bytes: number;
        used_percent: number;
        formatted_total: string;
        formatted_free: string;
        formatted_used: string;
    };
    storage: {
        app_storage_bytes: number;
        formatted_app_storage: string;
        log_captures_bytes: number;
        formatted_log_captures: string;
        avatars_bytes: number;
        formatted_avatars: string;
    };
    database: {
        name: string;
        total_size_bytes: number;
        formatted_total_size: string;
        tables: Array<{
            name: string;
            rows: number;
            size_bytes: number;
            formatted_size: string;
        }>;
    };
    log_photos: {
        student_logs_count: number;
        access_attempts_count: number;
        total_count: number;
        total_bytes: number;
        formatted_total_bytes: string;
        oldest_photo_date: string | null;
    };
}

export default function GeneralSettings({
    faceThreshold,
    fingerprintThreshold,
    emailSettings,
    imapSettings,
    aiSettings,
    storageAnalytics: initialAnalytics,
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
    imapSettings?: {
        imap_host: string;
        imap_port: string;
        imap_username: string;
        imap_password: string;
        imap_encryption: string;
        imap_enabled: string;
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
    storageAnalytics?: StorageAnalyticsProps;
}) {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    /* ── Storage Analytics state ─────────────────────────────────────────── */
    const [analytics, setAnalytics] = useState<StorageAnalyticsProps | undefined>(initialAnalytics);
    const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);
    const [isCleaningPhotos, setIsCleaningPhotos] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupCutoffDate, setCleanupCutoffDate] = useState('');
    const [cleanupResult, setCleanupResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const fetchStorageAnalytics = async () => {
        setIsRefreshingStorage(true);
        try {
            const res = await fetch('/api/settings/storage-analytics');
            const data = await res.json();
            if (data.success) {
                setAnalytics(data.analytics);
            }
        } catch (err) {
            console.error('Failed to fetch storage analytics', err);
        } finally {
            setIsRefreshingStorage(false);
        }
    };

    const handleExecuteCleanup = async () => {
        setIsCleaningPhotos(true);
        setCleanupResult(null);
        try {
            const res = await fetch('/api/settings/cleanup-photos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    cutoff_date: cleanupCutoffDate || undefined,
                }),
            });
            const data = await res.json();
            setCleanupResult({
                success: data.success,
                message: data.message || 'Cleanup operation finished.',
            });
            if (data.success) {
                await fetchStorageAnalytics();
                setShowCleanupModal(false);
            }
        } catch (err: any) {
            setCleanupResult({
                success: false,
                message: 'Error executing cleanup: ' + (err.message || 'Server error'),
            });
        } finally {
            setIsCleaningPhotos(false);
        }
    };

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

    const handleTestImap = () => {
        const data = {
            imap_host: (
                document.getElementById('imap_host') as HTMLInputElement
            )?.value,
            imap_port: (
                document.getElementById('imap_port') as HTMLInputElement
            )?.value,
            imap_username: (
                document.getElementById('imap_username') as HTMLInputElement
            )?.value,
            imap_password: (
                document.getElementById('imap_password') as HTMLInputElement
            )?.value,
            imap_encryption: (
                document.getElementById(
                    'imap_encryption_input',
                ) as HTMLInputElement
            )?.value,
        };

        if (!data.imap_host || !data.imap_port || !data.imap_username) {
            alert('Please fill in Host, Port, and Username to test IMAP.');
            return;
        }

        router.post('/settings/test-imap', data, {
            preserveScroll: true,
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
                                            <span className="text-[10px] text-muted-foreground leading-relaxed -mt-1 block">
                                                For Gmail (smtp.gmail.com), you must generate and use a 16-character <strong>App Password</strong> from your Google Account settings rather than your regular account password.
                                            </span>
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

                            {/* ── IMAP Configuration (Receiving) ───────────── */}
                            <div className="border-t border-gray-100 pt-6">
                                <Heading
                                    variant="small"
                                    title="IMAP Configuration (Receiving Real-Time Emails)"
                                    description="Configure IMAP settings to receive real-time emails from your Lark Mail account."
                                />
                                <div className="mt-4 space-y-6">
                                    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="imap_host">
                                                IMAP Host
                                            </Label>
                                            <Input
                                                id="imap_host"
                                                name="imap_host"
                                                defaultValue={
                                                    imapSettings?.imap_host || 'imap.larksuite.com'
                                                }
                                                placeholder="imap.larksuite.com"
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="imap_port">
                                                IMAP Port
                                            </Label>
                                            <Input
                                                id="imap_port"
                                                name="imap_port"
                                                defaultValue={
                                                    imapSettings?.imap_port || '993'
                                                }
                                                placeholder="993"
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="imap_username">
                                                IMAP Username / Email
                                            </Label>
                                            <Input
                                                id="imap_username"
                                                name="imap_username"
                                                defaultValue={
                                                    imapSettings?.imap_username || 'naaplibrary@larable.dev'
                                                }
                                                placeholder="naaplibrary@larable.dev"
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="imap_password">
                                                IMAP Authorization Code / Password
                                            </Label>
                                            <Input
                                                id="imap_password"
                                                type="password"
                                                name="imap_password"
                                                defaultValue={
                                                    imapSettings?.imap_password || '3BgoCA1F0mU26cfR'
                                                }
                                                placeholder="••••••••"
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="imap_encryption">
                                                Encryption
                                            </Label>
                                            <Select
                                                defaultValue={
                                                    imapSettings?.imap_encryption || 'ssl'
                                                }
                                                name="imap_encryption"
                                                onValueChange={(value) => {
                                                    const input =
                                                        document.getElementById(
                                                            'imap_encryption_input',
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
                                                        SSL (Recommended - Port 993)
                                                    </SelectItem>
                                                    <SelectItem value="tls">
                                                        TLS
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                id="imap_encryption_input"
                                                name="imap_encryption"
                                                defaultValue={
                                                    imapSettings?.imap_encryption || 'ssl'
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="imap_enabled">
                                                Real-Time Fetch Status
                                            </Label>
                                            <Select
                                                defaultValue={
                                                    imapSettings?.imap_enabled || '1'
                                                }
                                                name="imap_enabled"
                                                onValueChange={(value) => {
                                                    const input =
                                                        document.getElementById(
                                                            'imap_enabled_input',
                                                        ) as HTMLInputElement;

                                                    if (input) {
                                                        input.value = value;
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">
                                                        Enabled (Active Auto-Sync)
                                                    </SelectItem>
                                                    <SelectItem value="0">
                                                        Disabled
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                id="imap_enabled_input"
                                                name="imap_enabled"
                                                defaultValue={
                                                    imapSettings?.imap_enabled || '1'
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleTestImap}
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Testing…'
                                                    : 'Test IMAP Connection'}
                                            </Button>
                                            <p className="text-[11px] text-muted-foreground">
                                                Verifies IMAP server credentials and inbox access.
                                            </p>
                                        </div>
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

                            {/* ── Storage & Database Analytics Dashboard ─────────────────── */}
                            <div className="space-y-6 rounded-3xl border border-gray-200/80 bg-white p-6 md:p-8 shadow-xs">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#024495]/10 text-[#024495] shadow-xs">
                                            <HardDrive className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-[#024495]">
                                                Storage & Database Analytics
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                Monitor host disk space, database table footprints, and manage date-based photo cleanup.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchStorageAnalytics}
                                        disabled={isRefreshingStorage}
                                        className="h-10 gap-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#024495] hover:bg-[#024495]/5 border-gray-200"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshingStorage ? 'animate-spin' : ''}`} />
                                        Refresh Analytics
                                    </Button>
                                </div>

                                {analytics && (
                                    <>
                                        {/* 4 Metric Summary Cards */}
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            {/* Card 1: Disk Space */}
                                            <div className="rounded-2xl border border-gray-200/70 bg-slate-50/60 p-5 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                        Server Disk Space
                                                    </span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                                        analytics.disk.used_percent > 85
                                                            ? 'bg-red-100 text-red-700'
                                                            : analytics.disk.used_percent > 70
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {analytics.disk.used_percent}% Used
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-black text-gray-900 tracking-tight">
                                                        {analytics.disk.formatted_free}
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                        Available free of {analytics.disk.formatted_total} host capacity
                                                    </p>
                                                </div>
                                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/80 p-0.5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            analytics.disk.used_percent > 85
                                                                ? 'bg-red-500'
                                                                : analytics.disk.used_percent > 70
                                                                ? 'bg-amber-500'
                                                                : 'bg-[#024495]'
                                                        }`}
                                                        style={{ width: `${Math.min(100, analytics.disk.used_percent)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Card 2: Database Size */}
                                            <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-5 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#024495]">
                                                        Database Footprint
                                                    </span>
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-[#024495] truncate max-w-[120px]" title={analytics.database.name}>
                                                        {analytics.database.name}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-black text-[#024495] tracking-tight">
                                                        {analytics.database.formatted_total_size}
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                        Compiled size across {analytics.database.tables.length}+ tables
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-gray-600 font-semibold pt-1 border-t border-blue-100/60">
                                                    <span>Storage Engine</span>
                                                    <span className="font-mono text-gray-900">MySQL / MariaDB</span>
                                                </div>
                                            </div>

                                            {/* Card 3: Log Photos Space */}
                                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                                                        Host Log Photos
                                                    </span>
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-800">
                                                        {analytics.log_photos.total_count} Files
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-black text-indigo-950 tracking-tight">
                                                        {analytics.log_photos.formatted_total_bytes}
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                        Student logs & access attempt images
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-gray-600 font-semibold pt-1 border-t border-indigo-100/60">
                                                    <span>Oldest Photo</span>
                                                    <span className="font-mono text-gray-900">{analytics.log_photos.oldest_photo_date || 'None'}</span>
                                                </div>
                                            </div>

                                            {/* Card 4: Automated Policy */}
                                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                                                        Retention Policy
                                                    </span>
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                                        End of Month
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-extrabold text-emerald-950">
                                                        Automated Purge
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                                                        Host files auto-cleared monthly; log DB records preserved.
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold pt-1 border-t border-emerald-100/60">
                                                    <span>Schedule</span>
                                                    <span className="font-bold text-emerald-900">Monthly 23:59</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Panels Row */}
                                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                            {/* Left Panel: Database Tables Breakdown Table */}
                                            <div className="lg:col-span-7 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-4 w-4 text-[#024495]" />
                                                        <h4 className="text-sm font-extrabold text-gray-900">
                                                            Database Tables Breakdown
                                                        </h4>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-500">
                                                        Total: {analytics.database.formatted_total_size}
                                                    </span>
                                                </div>

                                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-3">Table Name</th>
                                                                <th className="px-4 py-3 text-right">Rows</th>
                                                                <th className="px-4 py-3 text-right">Data Size</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                                                            {analytics.database.tables.map((tbl) => (
                                                                <tr key={tbl.name} className="hover:bg-slate-50/80 transition-colors">
                                                                    <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-[#024495]">
                                                                        {tbl.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-mono text-[11px] text-gray-600">
                                                                        {tbl.rows.toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                                                                        {tbl.formatted_size}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Right Panel: Host Photo Cleanup Controls */}
                                            <div className="lg:col-span-5 rounded-2xl border border-blue-100 bg-linear-to-b from-blue-50/40 via-white to-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-[#024495]">
                                                        <Trash2 className="h-5 w-5" />
                                                        <h4 className="text-sm font-extrabold text-gray-900">
                                                            Manual Host Photo Cleanup
                                                        </h4>
                                                    </div>

                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        Trigger a manual date-based cleanup of student log and access attempt photos stored on the host server. Files prior to the selected date will be permanently deleted from host disk while log records remain in the database.
                                                    </p>

                                                    <div className="rounded-xl bg-white p-4 border border-blue-100 space-y-3">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-gray-700">Host Photos Footprint:</span>
                                                            <span className="font-extrabold text-[#024495]">{analytics.log_photos.formatted_total_bytes} ({analytics.log_photos.total_count} files)</span>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                                Cutoff Date (Default: End of Last Month)
                                                            </label>
                                                            <Input
                                                                type="date"
                                                                value={cleanupCutoffDate}
                                                                onChange={(e) => setCleanupCutoffDate(e.target.value)}
                                                                className="h-9 text-xs rounded-xl bg-gray-50/50 border-gray-200"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => setShowCleanupModal(true)}
                                                        className="w-full h-11 bg-[#024495] hover:bg-[#013475] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#024495]/15 gap-2 transition-all active:scale-[0.99]"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Clean Up Host Log Photos Now
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {cleanupResult && (
                                    <div className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-3 ${
                                        cleanupResult.success
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                        {cleanupResult.success ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                        )}
                                        <div>{cleanupResult.message}</div>
                                    </div>
                                )}
                            </div>

                            {/* ── Cleanup Confirmation Modal ── */}
                            {showCleanupModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 text-red-600">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                                    <Trash2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-gray-900">
                                                        Clean Up Host Log Photos
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        Date-Based Physical File Deletion
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowCleanupModal(false)}
                                                className="text-gray-400 hover:text-gray-600 font-bold"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            This action will permanently delete student log & access attempt photo files from the host server disk up to the specified cutoff date. The log history in the database will be preserved with image references set to NULL.
                                        </p>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Cutoff Date (Optional)
                                            </label>
                                            <Input
                                                type="date"
                                                value={cleanupCutoffDate}
                                                onChange={(e) => setCleanupCutoffDate(e.target.value)}
                                                className="text-xs"
                                            />
                                            <p className="text-[10px] text-gray-400 italic">
                                                Leave blank to delete photos prior to the end of last month.
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowCleanupModal(false)}
                                                disabled={isCleaningPhotos}
                                                className="rounded-xl text-xs"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleExecuteCleanup}
                                                disabled={isCleaningPhotos}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl gap-2"
                                            >
                                                {isCleaningPhotos ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Cleaning Up...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-4 w-4" />
                                                        Confirm & Execute Deletion
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

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
