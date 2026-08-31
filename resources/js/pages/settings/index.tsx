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
import PasswordInput from '@/components/password-input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    HardDrive,
    Database,
    Trash2,
    RefreshCw,
    Server,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    FolderArchive,
    Loader2,
    Mail,
    Globe,
    Key,
    ScanFace,
    Check,
    Copy,
    Lock,
    Users,
    ShieldCheck,
    Plus,
    Pencil,
    UserX,
    X,
    Crown,
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

interface UserRow {
    id: number;
    name: string;
    email: string;
    roles: string[];
    created_at: string;
}

interface RoleRow {
    id: number;
    name: string;
    users_count: number;
    is_core: boolean;
}

interface GoogleFormsSettingsProps {
    google_service_account_json?: string;
    has_service_account_json?: boolean;
    google_drive_folder_id?: string;
    service_account_email?: string;
    status?: {
        configured: boolean;
        success: boolean;
        message: string;
    };
}

export default function GeneralSettings({
    faceThreshold,
    fingerprintThreshold,
    emailSettings,
    imapSettings,
    aiSettings,
    storageAnalytics: initialAnalytics,
    googleFormsSettings,
    users,
    roles,
    allRoleNames,
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
    googleFormsSettings?: GoogleFormsSettingsProps;
    users?: UserRow[];
    roles?: RoleRow[];
    allRoleNames?: string[];
}) {
    const { url } = usePage();
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    // Determine current active section tab from URL query params
    const getTabFromUrl = () => {
        try {
            const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
            const tab = searchParams.get('tab');
            if (tab && ['biometrics', 'email', 'ai', 'storage', 'google_forms', 'users', 'roles'].includes(tab)) {
                return tab as 'biometrics' | 'email' | 'ai' | 'storage' | 'google_forms' | 'users' | 'roles';
            }
        } catch (e) {
            // fallback
        }
        return 'biometrics';
    };

    const activeSection = getTabFromUrl();

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
    const [localModels, setLocalModels] = useState<string[]>([]);
    const [selectedLocalModel, setSelectedLocalModel] = useState<string>(
        aiSettings.ai_local_model || '',
    );
    const [useCustomLocal, setUseCustomLocal] = useState<boolean>(false);

    const [apiModels, setApiModels] = useState<string[]>([]);
    const [selectedApiModel, setSelectedApiModel] = useState<string>(
        aiSettings.ai_api_model || '',
    );
    const [useCustomApi, setUseCustomApi] = useState<boolean>(false);

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

    useEffect(() => {
        if (activeSection === 'ai') {
            if (aiProvider === 'local' && localModels.length === 0) {
                fetchLocalModelsSilently();
            } else if (aiProvider === 'api' && apiModels.length === 0 && aiSettings.ai_api_base_url && aiSettings.ai_api_key) {
                fetchApiModelsSilently();
            }
        }
    }, [activeSection, aiProvider]);

    const fetchLocalModelsSilently = async () => {
        const url = (document.getElementById('ai_local_url') as HTMLInputElement)?.value || aiSettings.ai_local_url || 'http://localhost:11434';
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            const res = await fetch('/api/ai/test-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ url }),
            });
            if (res.ok) {
                const data = (await res.json()) as { models?: string[] };
                if (data.models && data.models.length > 0) {
                    setLocalModels(data.models);
                    if (!selectedLocalModel || !data.models.includes(selectedLocalModel)) {
                        setSelectedLocalModel(data.models[0]);
                    }
                    setLocalTestResult({
                        type: 'success',
                        message: `Connected! Found ${data.models.length} model(s).`,
                    });
                }
            }
        } catch (e) {
            // silent ignore on initial load
        }
    };

    const fetchApiModelsSilently = async () => {
        const base_url = (document.getElementById('ai_api_base_url') as HTMLInputElement)?.value || aiSettings.ai_api_base_url;
        const api_key = (document.getElementById('ai_api_key') as HTMLInputElement)?.value || aiSettings.ai_api_key;
        if (!base_url || !api_key) return;
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        try {
            const res = await fetch('/api/ai/test-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ base_url, api_key }),
            });
            if (res.ok) {
                const data = (await res.json()) as { models?: string[] };
                if (data.models && data.models.length > 0) {
                    setApiModels(data.models);
                    if (!selectedApiModel || !data.models.includes(selectedApiModel)) {
                        setSelectedApiModel(data.models[0]);
                    }
                    setApiTestResult({
                        type: 'success',
                        message: `Connected! Found ${data.models.length} model(s).`,
                    });
                }
            }
        } catch (e) {
            // silent ignore on initial load
        }
    };

    /* ── Google Forms State ─────────────────────────────────────────────── */
    const [hasJsonSaved, setHasJsonSaved] = useState<boolean>(
        googleFormsSettings?.has_service_account_json || false
    );
    const [isJsonUnlocked, setIsJsonUnlocked] = useState<boolean>(false);
    const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
    const [passwordConfirmInput, setPasswordConfirmInput] = useState<string>('');
    const [passwordConfirmError, setPasswordConfirmError] = useState<string>('');
    const [verifyingPassword, setVerifyingPassword] = useState<boolean>(false);

    const [googleJsonInput, setGoogleJsonInput] = useState(
        googleFormsSettings?.google_service_account_json || ''
    );
    const [googleFolderId, setGoogleFolderId] = useState(
        googleFormsSettings?.google_drive_folder_id || ''
    );
    const [testingGoogleForms, setTestingGoogleForms] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);

    /* ── Users CRUD state ───────────────────────────────────────────────── */
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: '' });
    const [userFormProcessing, setUserFormProcessing] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

    const openCreateUser = () => {
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', role: allRoleNames?.[0] ?? '' });
        setShowUserModal(true);
    };

    const openEditUser = (u: UserRow) => {
        setEditingUser(u);
        setUserForm({ name: u.name, email: u.email, password: '', role: u.roles[0] ?? '' });
        setShowUserModal(true);
    };

    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUserFormProcessing(true);
        const isEdit = !!editingUser;
        const url = isEdit ? `/settings/users/${editingUser!.id}` : '/settings/users';
        const method = isEdit ? 'patch' : 'post';
        router[method](url, userForm as any, {
            preserveScroll: true,
            onSuccess: () => { setShowUserModal(false); setUserFormProcessing(false); },
            onError: () => setUserFormProcessing(false),
        });
    };

    const handleDeleteUser = () => {
        if (!deletingUser) return;
        router.delete(`/settings/users/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingUser(null),
        });
    };

    /* ── Roles CRUD state ───────────────────────────────────────────────── */
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
    const [roleForm, setRoleForm] = useState({ name: '' });
    const [roleFormProcessing, setRoleFormProcessing] = useState(false);
    const [deletingRole, setDeletingRole] = useState<RoleRow | null>(null);

    const openCreateRole = () => {
        setEditingRole(null);
        setRoleForm({ name: '' });
        setShowRoleModal(true);
    };

    const openEditRole = (r: RoleRow) => {
        setEditingRole(r);
        setRoleForm({ name: r.name });
        setShowRoleModal(true);
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setRoleFormProcessing(true);
        const isEdit = !!editingRole;
        const url = isEdit ? `/settings/roles/${editingRole!.id}` : '/settings/roles';
        const method = isEdit ? 'patch' : 'post';
        router[method](url, roleForm, {
            preserveScroll: true,
            onSuccess: () => { setShowRoleModal(false); setRoleFormProcessing(false); },
            onError: () => setRoleFormProcessing(false),
        });
    };

    const handleDeleteRole = () => {
        if (!deletingRole) return;
        router.delete(`/settings/roles/${deletingRole.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingRole(null),
        });
    };

    const handleVerifyPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!passwordConfirmInput) {
            setPasswordConfirmError('Please enter your password.');
            return;
        }
        setVerifyingPassword(true);
        setPasswordConfirmError('');
        try {
            const res = await fetch('/settings/verify-password', {
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
                    password: passwordConfirmInput,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setGoogleJsonInput(data.google_service_account_json || '');
                setIsJsonUnlocked(true);
                setShowPasswordModal(false);
                setPasswordConfirmInput('');
                setPasswordConfirmError('');
            } else {
                setPasswordConfirmError(data.message || 'The password you entered is incorrect.');
            }
        } catch (err) {
            setPasswordConfirmError('Failed to verify password. Please try again.');
        } finally {
            setVerifyingPassword(false);
        }
    };

    const handleCopyEmail = () => {
        if (googleFormsSettings?.service_account_email) {
            navigator.clipboard.writeText(googleFormsSettings.service_account_email);
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 3000);
        }
    };

    /* ── Handlers ────────────────────────────────────────────────────────── */
    const handleTestEmail = () => {
        const data = {
            mail_host: (document.getElementById('mail_host') as HTMLInputElement)?.value,
            mail_port: (document.getElementById('mail_port') as HTMLInputElement)?.value,
            mail_username: (document.getElementById('mail_username') as HTMLInputElement)?.value,
            mail_password: (document.getElementById('mail_password') as HTMLInputElement)?.value,
            mail_encryption: (document.getElementById('mail_encryption_input') as HTMLInputElement)?.value,
            mail_from_address: (document.getElementById('mail_from_address') as HTMLInputElement)?.value,
            mail_from_name: (document.getElementById('mail_from_name') as HTMLInputElement)?.value,
        };

        if (!data.mail_host || !data.mail_port || !data.mail_from_address) {
            alert('Please fill in at least the Host, Port, and From Address to test.');
            return;
        }

        router.post(testEmail.url(), data, { preserveScroll: true });
    };

    const handleTestImap = () => {
        const data = {
            imap_host: (document.getElementById('imap_host') as HTMLInputElement)?.value,
            imap_port: (document.getElementById('imap_port') as HTMLInputElement)?.value,
            imap_username: (document.getElementById('imap_username') as HTMLInputElement)?.value,
            imap_password: (document.getElementById('imap_password') as HTMLInputElement)?.value,
            imap_encryption: (document.getElementById('imap_encryption_input') as HTMLInputElement)?.value,
        };

        if (!data.imap_host || !data.imap_port || !data.imap_username) {
            alert('Please fill in Host, Port, and Username to test IMAP.');
            return;
        }

        router.post('/settings/test-imap', data, { preserveScroll: true });
    };

    const handleTestGoogleForms = () => {
        setTestingGoogleForms(true);
        router.post('/settings/test-google-forms', {
            google_service_account_json: googleJsonInput
        }, {
            preserveScroll: true,
            onFinish: () => setTestingGoogleForms(false)
        });
    };

    const handleTestLocalConnection = async () => {
        setTestingLocal(true);
        setLocalTestResult(null);
        const url = (document.getElementById('ai_local_url') as HTMLInputElement)?.value ?? '';
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

        try {
            const res = await fetch('/api/ai/test-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ url }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(body.message ?? `Failed (${res.status})`);
            }
            const data = (await res.json()) as { models?: string[] };
            const models = data.models || [];
            setLocalModels(models);
            if (models.length > 0) {
                if (!selectedLocalModel || !models.includes(selectedLocalModel)) {
                    setSelectedLocalModel(models[0]);
                }
            }
            setLocalTestResult({
                type: 'success',
                message: `Connected! Found ${models.length} model(s).`,
            });
        } catch (err) {
            setLocalTestResult({
                type: 'error',
                message: err instanceof Error ? err.message : 'Connection failed.',
            });
        } finally {
            setTestingLocal(false);
        }
    };

    const handleTestApiConnection = async () => {
        setTestingApi(true);
        setApiTestResult(null);
        const base_url = (document.getElementById('ai_api_base_url') as HTMLInputElement)?.value ?? '';
        const api_key = (document.getElementById('ai_api_key') as HTMLInputElement)?.value ?? '';
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

        try {
            const res = await fetch('/api/ai/test-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ base_url, api_key }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(body.message ?? `Failed (${res.status})`);
            }
            const data = (await res.json()) as { models?: string[] };
            const models = data.models || [];
            setApiModels(models);
            if (models.length > 0) {
                if (!selectedApiModel || !models.includes(selectedApiModel)) {
                    setSelectedApiModel(models[0]);
                }
            }
            setApiTestResult({
                type: 'success',
                message: `Connected! Found ${models.length} model(s).`,
            });
        } catch (err) {
            setApiTestResult({
                type: 'error',
                message: err instanceof Error ? err.message : 'Connection failed.',
            });
        } finally {
            setTestingApi(false);
        }
    };

    return (
        <>
            <Head title="System Settings" />

            <div className="space-y-6">
                {testResult && (
                    <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all animate-in fade-in duration-300 ${testResult.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                        <div className="flex items-center gap-3 font-semibold text-sm">
                            {testResult.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
                            <span>{testResult.message}</span>
                        </div>
                        <button onClick={() => setTestResult(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1">Dismiss</button>
                    </div>
                )}

                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                    <Form {...update.form()} className="space-y-8">
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* ── SECTION 1: Biometric Sensitivity ────────────────── */}
                                {activeSection === 'biometrics' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                <ScanFace className="h-6 w-6 text-[#024495]" /> Biometric Sensitivity
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Adjust recognition thresholds for face login and student check-ins. Lower values represent stricter matching precision.
                                            </p>
                                        </div>

                                        <div className="space-y-6 pt-4 border-t border-gray-100">
                                            <div className="grid max-w-md gap-2">
                                                <Label htmlFor="face_threshold" className="font-bold">
                                                    Face Recognition Sensitivity
                                                </Label>
                                                <Input
                                                    id="face_threshold"
                                                    type="number"
                                                    step="0.01"
                                                    min="0.1"
                                                    max="0.9"
                                                    className="mt-1 block w-full rounded-xl"
                                                    defaultValue={faceThreshold}
                                                    name="face_threshold"
                                                    required
                                                />
                                                <p className="text-xs text-gray-500 italic mt-1">
                                                    Standard default: <strong>0.45</strong>. Stricter (&lt;0.40) prevents false positive matches but requires clear lighting.
                                                </p>
                                                <InputError className="mt-2" message={errors.face_threshold} />
                                            </div>

                                            <div className="grid max-w-md gap-2">
                                                <Label htmlFor="fingerprint_threshold" className="text-gray-400">
                                                    Fingerprint Sensitivity (Scanner Module)
                                                </Label>
                                                <Input
                                                    id="fingerprint_threshold"
                                                    type="number"
                                                    step="0.01"
                                                    className="mt-1 block w-full opacity-50 rounded-xl"
                                                    defaultValue={fingerprintThreshold}
                                                    name="fingerprint_threshold"
                                                    disabled
                                                />
                                                <InputError className="mt-2" message={errors.fingerprint_threshold} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── SECTION 2: Email Configuration ──────────────────── */}
                                {activeSection === 'email' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                <Mail className="h-6 w-6 text-[#024495]" /> Email & IMAP Configuration
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Manage SMTP credentials for sending library notifications and IMAP server settings for receiving incoming messages.
                                            </p>
                                        </div>

                                        {/* SMTP Configuration */}
                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">SMTP Server Settings</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="mail_host">SMTP Host</Label>
                                                    <Input id="mail_host" name="mail_host" defaultValue={emailSettings.mail_host} placeholder="smtp.larksuite.com" className="rounded-xl" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="mail_port">SMTP Port</Label>
                                                    <Input id="mail_port" name="mail_port" defaultValue={emailSettings.mail_port} placeholder="465" className="rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="mail_username">Username / Email</Label>
                                                    <Input id="mail_username" name="mail_username" defaultValue={emailSettings.mail_username} placeholder="email@domain.com" className="rounded-xl" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="mail_password">Password / App Key</Label>
                                                    <Input id="mail_password" name="mail_password" type="password" defaultValue={emailSettings.mail_password ? '••••••••' : ''} placeholder="Password" className="rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="mail_encryption">Encryption</Label>
                                                    <Select defaultValue={emailSettings.mail_encryption || 'ssl'} onValueChange={(val) => { const el = document.getElementById('mail_encryption_input') as HTMLInputElement; if (el) el.value = val; }}>
                                                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select encryption" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ssl">SSL / SMTPS (465)</SelectItem>
                                                            <SelectItem value="tls">STARTTLS (587)</SelectItem>
                                                            <SelectItem value="none">None (25)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <input type="hidden" id="mail_encryption_input" name="mail_encryption" defaultValue={emailSettings.mail_encryption || 'ssl'} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="mail_from_address">From Address</Label>
                                                    <Input id="mail_from_address" name="mail_from_address" defaultValue={emailSettings.mail_from_address} placeholder="noreply@domain.com" className="rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <Button type="button" variant="outline" size="sm" onClick={handleTestEmail} className="rounded-xl font-bold border-blue-200 text-[#024495] hover:bg-blue-50">
                                                    <Server className="h-4 w-4 mr-2" /> Send Test SMTP Email
                                                </Button>
                                            </div>
                                        </div>

                                        {/* IMAP Configuration */}
                                        <div className="space-y-4 pt-6 border-t border-gray-100">
                                            <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">IMAP Incoming Server Settings</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="imap_host">IMAP Host</Label>
                                                    <Input id="imap_host" name="imap_host" defaultValue={imapSettings?.imap_host || 'imap.larksuite.com'} placeholder="imap.larksuite.com" className="rounded-xl" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="imap_port">IMAP Port</Label>
                                                    <Input id="imap_port" name="imap_port" defaultValue={imapSettings?.imap_port || '993'} placeholder="993" className="rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="imap_username">IMAP Username</Label>
                                                    <Input id="imap_username" name="imap_username" defaultValue={imapSettings?.imap_username || emailSettings.mail_username} placeholder="email@domain.com" className="rounded-xl" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="imap_password">IMAP Password</Label>
                                                    <Input id="imap_password" name="imap_password" type="password" defaultValue={imapSettings?.imap_password ? '••••••••' : ''} placeholder="Password" className="rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <Button type="button" variant="outline" size="sm" onClick={handleTestImap} className="rounded-xl font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50">
                                                    <RefreshCw className="h-4 w-4 mr-2" /> Test IMAP Connection
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── SECTION 3: AI Assistant ──────────────────────────── */}
                                {activeSection === 'ai' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                <Sparkles className="h-6 w-6 text-[#024495]" /> AI Assistant Engine
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Configure local Ollama instance or external Cloud AI providers for system chat and report summaries.
                                            </p>
                                        </div>

                                        <div className="space-y-6 pt-4 border-t border-gray-100">
                                            <div className="grid max-w-sm gap-2">
                                                <Label htmlFor="ai_provider">AI Mode Provider</Label>
                                                <Select value={aiProvider} onValueChange={(val: 'local' | 'api') => setAiProvider(val)}>
                                                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select AI provider" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="local">Local Instance (Ollama)</SelectItem>
                                                        <SelectItem value="api">External API (OpenAI / Gemini Compatible)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <input type="hidden" name="ai_provider" value={aiProvider} />
                                            </div>

                                            {aiProvider === 'local' ? (
                                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="ai_local_url">Local Ollama Server URL</Label>
                                                        <Input id="ai_local_url" name="ai_local_url" defaultValue={aiSettings.ai_local_url || 'http://localhost:11434'} className="rounded-xl bg-white" />
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <Button type="button" size="sm" variant="outline" onClick={handleTestLocalConnection} disabled={testingLocal} className="rounded-xl font-bold">
                                                            {testingLocal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                                            Test Local Server
                                                        </Button>
                                                    </div>
                                                    {localTestResult && (
                                                        <p className={`text-xs font-bold ${localTestResult.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {localTestResult.message}
                                                        </p>
                                                    )}

                                                    {/* Local Model Selection */}
                                                    <div className="pt-4 border-t border-gray-200/60 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="ai_local_model" className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                                                                <Sparkles className="h-4 w-4 text-[#024495]" /> AI Model Selection
                                                            </Label>
                                                            <button
                                                                type="button"
                                                                onClick={() => setUseCustomLocal(!useCustomLocal)}
                                                                className="text-xs text-[#024495] hover:underline font-semibold"
                                                            >
                                                                {useCustomLocal ? 'Select from list' : 'Type custom model'}
                                                            </button>
                                                        </div>

                                                        {!useCustomLocal ? (
                                                            <Select
                                                                value={selectedLocalModel}
                                                                onValueChange={(val) => setSelectedLocalModel(val)}
                                                            >
                                                                <SelectTrigger className="rounded-xl bg-white border-gray-200">
                                                                    <SelectValue placeholder="Select an Ollama model" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Array.from(new Set([...(selectedLocalModel ? [selectedLocalModel] : []), ...localModels])).map((model) => (
                                                                        <SelectItem key={model} value={model}>
                                                                            {model}
                                                                        </SelectItem>
                                                                    ))}
                                                                    {localModels.length === 0 && !selectedLocalModel && (
                                                                        <SelectItem value="none" disabled>
                                                                            No models found (Click "Test Local Server")
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                id="custom_ai_local_model"
                                                                value={selectedLocalModel}
                                                                onChange={(e) => setSelectedLocalModel(e.target.value)}
                                                                placeholder="e.g. llama3.2:latest"
                                                                className="rounded-xl bg-white"
                                                            />
                                                        )}
                                                        <input type="hidden" name="ai_local_model" value={selectedLocalModel} />
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            This model will be saved to your database and used for library AI inquiries and summaries.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="ai_api_base_url">API Base URL</Label>
                                                        <Input id="ai_api_base_url" name="ai_api_base_url" defaultValue={aiSettings.ai_api_base_url} placeholder="https://api.openai.com/v1" className="rounded-xl bg-white" />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="ai_api_key">API Secret Key</Label>
                                                        <Input id="ai_api_key" name="ai_api_key" type="password" defaultValue={aiSettings.ai_api_key} placeholder="sk-..." className="rounded-xl bg-white" />
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <Button type="button" size="sm" variant="outline" onClick={handleTestApiConnection} disabled={testingApi} className="rounded-xl font-bold">
                                                            {testingApi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Server className="h-4 w-4 mr-2" />}
                                                            Test Cloud Provider
                                                        </Button>
                                                    </div>
                                                    {apiTestResult && (
                                                        <p className={`text-xs font-bold ${apiTestResult.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {apiTestResult.message}
                                                        </p>
                                                    )}

                                                    {/* API Model Selection */}
                                                    <div className="pt-4 border-t border-gray-200/60 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="ai_api_model" className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                                                                <Sparkles className="h-4 w-4 text-[#024495]" /> AI Model Selection
                                                            </Label>
                                                            <button
                                                                type="button"
                                                                onClick={() => setUseCustomApi(!useCustomApi)}
                                                                className="text-xs text-[#024495] hover:underline font-semibold"
                                                            >
                                                                {useCustomApi ? 'Select from list' : 'Type custom model'}
                                                            </button>
                                                        </div>

                                                        {!useCustomApi ? (
                                                            <Select
                                                                value={selectedApiModel}
                                                                onValueChange={(val) => setSelectedApiModel(val)}
                                                            >
                                                                <SelectTrigger className="rounded-xl bg-white border-gray-200">
                                                                    <SelectValue placeholder="Select an API model" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Array.from(
                                                                        new Set([
                                                                            ...(selectedApiModel ? [selectedApiModel] : []),
                                                                            ...apiModels,
                                                                            'gpt-4o',
                                                                            'gpt-4o-mini',
                                                                            'gemini-1.5-pro',
                                                                            'gemini-1.5-flash',
                                                                            'claude-3-5-sonnet-20240620'
                                                                        ])
                                                                    ).map((model) => (
                                                                        <SelectItem key={model} value={model}>
                                                                            {model}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                id="custom_ai_api_model"
                                                                value={selectedApiModel}
                                                                onChange={(e) => setSelectedApiModel(e.target.value)}
                                                                placeholder="e.g. gpt-4o"
                                                                className="rounded-xl bg-white"
                                                            />
                                                        )}
                                                        <input type="hidden" name="ai_api_model" value={selectedApiModel} />
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            This cloud model will be saved to your database and used for system chat.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── SECTION 4: Storage & Database Analysis ───────────── */}
                                {activeSection === 'storage' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                    <HardDrive className="h-6 w-6 text-[#024495]" /> Storage & Database Analysis
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Inspect disk capacity, database table allocations, and execute old image log cleanups.
                                                </p>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={fetchStorageAnalytics} disabled={isRefreshingStorage} className="rounded-xl font-bold">
                                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingStorage ? 'animate-spin' : ''}`} /> Refresh Stats
                                            </Button>
                                        </div>

                                        {analytics ? (
                                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                                {/* Storage Summary */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Disk Capacity Used</p>
                                                        <h4 className="text-2xl font-black text-blue-950 mt-1">{analytics.disk.formatted_used} / {analytics.disk.formatted_total}</h4>
                                                        <div className="h-2 w-full bg-blue-200 rounded-full mt-2 overflow-hidden">
                                                            <div className="h-full bg-[#024495]" style={{ width: `${analytics.disk.used_percent}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Free Disk Space</p>
                                                        <h4 className="text-2xl font-black text-emerald-950 mt-1">{analytics.disk.formatted_free}</h4>
                                                        <p className="text-[11px] text-emerald-700 mt-2 font-medium">Available for media & logs</p>
                                                    </div>
                                                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                                                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Database Size</p>
                                                        <h4 className="text-2xl font-black text-purple-950 mt-1">{analytics.database.formatted_total_size}</h4>
                                                        <p className="text-[11px] text-purple-700 mt-2 font-medium">SQLite Engine</p>
                                                    </div>
                                                </div>

                                                {/* Photo Log Cleanup */}
                                                <div className="bg-amber-50/30 border border-amber-200 p-5 rounded-2xl space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-extrabold text-gray-900 flex items-center gap-2">
                                                                <FolderArchive className="h-4 w-4 text-amber-600" /> Log Photo Cleanup & Retention
                                                            </h4>
                                                            <p className="text-xs text-gray-600 mt-0.5">
                                                                Total Photos: <strong>{analytics.log_photos.total_count}</strong> ({analytics.log_photos.formatted_total_bytes})
                                                            </p>
                                                        </div>
                                                        <Button type="button" variant="destructive" size="sm" onClick={() => setShowCleanupModal(true)} className="rounded-xl font-bold">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Purge Old Log Photos
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Top Tables */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                        <Database className="h-4 w-4" /> Database Tables Allocation
                                                    </h4>
                                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden text-xs">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-gray-100 font-extrabold text-gray-700">
                                                                <tr>
                                                                    <th className="p-3">Table Name</th>
                                                                    <th className="p-3">Record Rows</th>
                                                                    <th className="p-3 text-right">Data Size</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100 font-medium">
                                                                {analytics.database.tables.map((t) => (
                                                                    <tr key={t.name} className="hover:bg-white transition-colors">
                                                                        <td className="p-3 font-mono font-bold text-gray-800">{t.name}</td>
                                                                        <td className="p-3 text-gray-600">{t.rows.toLocaleString()}</td>
                                                                        <td className="p-3 text-right font-bold text-gray-900">{t.formatted_size}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center text-gray-400 font-bold text-sm">
                                                Loading storage analytics...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── SECTION 5: Google Forms API Integration ──────────── */}
                                {activeSection === 'google_forms' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                <Globe className="h-6 w-6 text-[#024495]" /> Google Forms API Integration
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Configure Google Service Account credentials to enable real-time form creation, editing, deletion, and response syncing via Google Forms REST API.
                                            </p>
                                        </div>

                                        <div className="space-y-6 pt-4 border-t border-gray-100">
                                            {/* API Connection Status Banner */}
                                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${googleFormsSettings?.status?.success ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                                                <div className="flex items-center gap-3">
                                                    {googleFormsSettings?.status?.success ? (
                                                        <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                                                    ) : (
                                                        <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-extrabold text-sm">
                                                            {googleFormsSettings?.status?.success ? 'Google Forms API Active & Verified' : 'Google API Credentials Required'}
                                                        </p>
                                                        <p className="text-xs font-medium opacity-90">
                                                            {googleFormsSettings?.status?.message || 'Paste Service Account JSON key below to activate.'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleTestGoogleForms}
                                                    disabled={testingGoogleForms}
                                                    className="rounded-xl font-bold bg-white border-gray-200"
                                                >
                                                    {testingGoogleForms ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                                    Test API Connection
                                                </Button>
                                            </div>

                                            {/* Service Account Email Copy Banner */}
                                            {googleFormsSettings?.service_account_email && (
                                                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                                    <div>
                                                        <p className="font-extrabold text-blue-900 flex items-center gap-1.5">
                                                            <Key className="h-4 w-4 text-[#024495]" /> Service Account Email Address:
                                                        </p>
                                                        <p className="font-mono text-gray-700 mt-1 select-all font-bold">
                                                            {googleFormsSettings.service_account_email}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleCopyEmail}
                                                        className="rounded-xl font-bold bg-white text-[#024495] border-blue-200 shrink-0"
                                                    >
                                                        {copiedEmail ? <Check className="h-4 w-4 mr-1.5 text-green-600" /> : <Copy className="h-4 w-4 mr-1.5" />}
                                                        {copiedEmail ? 'Copied Email!' : 'Copy Email'}
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Google Drive Folder ID Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="google_drive_folder_id" className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                                                    <FolderArchive className="h-4 w-4 text-[#024495]" /> Google Drive Folder ID (Recommended)
                                                </Label>
                                                <Input
                                                    id="google_drive_folder_id"
                                                    name="google_drive_folder_id"
                                                    value={googleFolderId}
                                                    onChange={(e) => setGoogleFolderId(e.target.value)}
                                                    placeholder="e.g. 1ABC123xyz_EXAMPLE (from your Google Drive folder URL)"
                                                    className="rounded-xl font-mono text-xs bg-gray-50 focus:bg-white"
                                                />
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Share a folder in your Google Drive with the Service Account email above as <strong>Editor</strong>, then paste its Folder ID here. Created Google Forms will be stored inside your Google Drive!
                                                </p>
                                            </div>

                                            {/* JSON Key Input */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="google_service_account_json" className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                                                        <Key className="h-4 w-4 text-[#024495]" /> Service Account JSON Key
                                                    </Label>
                                                    {isJsonUnlocked && (
                                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                            <Check className="h-3.5 w-3.5" /> Unlocked
                                                        </span>
                                                    )}
                                                </div>

                                                {hasJsonSaved && !isJsonUnlocked ? (
                                                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                                                        <div className="bg-white p-3 rounded-full shadow-sm text-[#024495] border border-gray-100">
                                                            <Lock className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-gray-800 text-sm">
                                                                Sensitive Credentials Hidden for Security
                                                            </p>
                                                            <p className="text-xs text-gray-500 max-w-md mt-1 font-medium">
                                                                The Google Cloud Service Account JSON Key is stored securely. Please enter your account password to reveal and edit it.
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                setPasswordConfirmError('');
                                                                setPasswordConfirmInput('');
                                                                setShowPasswordModal(true);
                                                            }}
                                                            className="bg-[#024495] hover:bg-[#013575] text-white font-bold text-xs rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-md shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            <Lock className="h-3.5 w-3.5" /> Unlock & View JSON Key
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        id="google_service_account_json"
                                                        name="google_service_account_json"
                                                        rows={5}
                                                        value={googleJsonInput}
                                                        onChange={(e) => setGoogleJsonInput(e.target.value)}
                                                        placeholder='{"type": "service_account", "project_id": "...", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\n...", "client_email": "..."}'
                                                        className="w-full font-mono text-xs p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#024495] bg-gray-50 focus:bg-white transition-all"
                                                    />
                                                )}

                                                <p className="text-xs text-gray-500 font-medium">
                                                    Paste the contents of your Google Cloud Service Account JSON file. Credentials will be securely stored.
                                                </p>
                                            </div>

                                            {/* Setup Instructions */}
                                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 text-xs text-gray-700">
                                                <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                                                    Quick Setup Guide to View & Publish Forms in Your Personal Google Drive:
                                                </h4>
                                                <ol className="list-decimal list-inside space-y-2 font-medium">
                                                    <li>Open <strong>Google Drive</strong> and create a folder (e.g., <em>Library Surveys</em>).</li>
                                                    <li>Click <strong>Share</strong> on the folder, paste the Service Account Email above, select <strong>Editor</strong>, and click <strong>Share</strong>.</li>
                                                    <li>Copy the Folder ID from your browser address bar (<code>https://drive.google.com/drive/folders/<strong>&lt;FOLDER_ID&gt;</strong></code>) and paste it into <strong>Google Drive Folder ID</strong> above.</li>
                                                    <li>Create <strong>1 blank Google Form</strong> inside your <em>Library Surveys</em> folder. The system will use it as a base template to publish all new forms!</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── SECTION 6: Users Management ────────────────────────── */}
                                {activeSection === 'users' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                    <Users className="h-6 w-6 text-[#024495]" /> User Management
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Create, edit, and manage system user accounts with role assignments.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={openCreateUser}
                                                className="bg-[#024495] hover:bg-[#013575] text-white font-bold rounded-xl shadow-md shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Add User
                                            </Button>
                                        </div>

                                        <div className="border-t border-gray-100 pt-4">
                                            {!users || users.length === 0 ? (
                                                <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                    <div className="h-14 w-14 rounded-2xl bg-[#024495]/10 flex items-center justify-center">
                                                        <Users className="h-7 w-7 text-[#024495]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-gray-800">No users yet</p>
                                                        <p className="text-xs text-gray-400 mt-1">Click "Add User" to create the first account.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-gray-50 border-b border-gray-100">
                                                            <tr>
                                                                <th className="px-5 py-3.5 font-extrabold text-gray-700 text-xs uppercase tracking-wide">Name</th>
                                                                <th className="px-5 py-3.5 font-extrabold text-gray-700 text-xs uppercase tracking-wide hidden sm:table-cell">Email</th>
                                                                <th className="px-5 py-3.5 font-extrabold text-gray-700 text-xs uppercase tracking-wide">Role</th>
                                                                <th className="px-5 py-3.5 font-extrabold text-gray-700 text-xs uppercase tracking-wide text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {users.map((u) => (
                                                                <tr key={u.id} className="hover:bg-gray-50/70 transition-colors group">
                                                                    <td className="px-5 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#024495] to-[#0369a1] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                                                                                {u.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                                                                <p className="text-xs text-gray-400 sm:hidden">{u.email}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-4 text-gray-600 text-xs hidden sm:table-cell">{u.email}</td>
                                                                    <td className="px-5 py-4">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {u.roles.length === 0 ? (
                                                                                <span className="text-xs text-gray-400 italic">No role</span>
                                                                            ) : (
                                                                                u.roles.map((role) => (
                                                                                    <span
                                                                                        key={role}
                                                                                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                                                                            role === 'Admin'
                                                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                                                : role === 'Library Staff'
                                                                                                ? 'bg-blue-50 text-[#024495] border border-blue-200'
                                                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                        }`}
                                                                                    >
                                                                                        {role === 'Admin' && <Crown className="h-3 w-3" />}
                                                                                        {role === 'Library Staff' && <ShieldCheck className="h-3 w-3" />}
                                                                                        {role}
                                                                                    </span>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-4">
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openEditUser(u)}
                                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-[#024495] text-gray-400 transition-colors"
                                                                            >
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setDeletingUser(u)}
                                                                                className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-gray-400 transition-colors"
                                                                            >
                                                                                <UserX className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── SECTION 7: Roles Management ────────────────────────── */}
                                {activeSection === 'roles' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                                    <ShieldCheck className="h-6 w-6 text-[#024495]" /> Role Management
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Manage system roles. Core roles (Admin, Library Staff, Student) are protected and cannot be deleted.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={openCreateRole}
                                                className="bg-[#024495] hover:bg-[#013575] text-white font-bold rounded-xl shadow-md shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Add Role
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                                            {!roles || roles.length === 0 ? (
                                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                    <ShieldCheck className="h-10 w-10 text-gray-300" />
                                                    <p className="font-extrabold text-gray-500">No roles found</p>
                                                </div>
                                            ) : (
                                                roles.map((role) => (
                                                    <div
                                                        key={role.id}
                                                        className={`relative rounded-2xl border p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all ${
                                                            role.name === 'Admin'
                                                                ? 'bg-gradient-to-br from-rose-50 to-white border-rose-200'
                                                                : role.name === 'Library Staff'
                                                                ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
                                                                : role.name === 'Student'
                                                                ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                                                                : 'bg-white border-gray-200'
                                                        }`}
                                                    >
                                                        {role.is_core && (
                                                            <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide border border-gray-200">
                                                                Protected
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-sm ${
                                                                role.name === 'Admin' ? 'bg-rose-100' :
                                                                role.name === 'Library Staff' ? 'bg-blue-100' :
                                                                role.name === 'Student' ? 'bg-emerald-100' : 'bg-gray-100'
                                                            }`}>
                                                                {role.name === 'Admin' ? (
                                                                    <Crown className={`h-5 w-5 text-rose-600`} />
                                                                ) : role.name === 'Library Staff' ? (
                                                                    <ShieldCheck className="h-5 w-5 text-[#024495]" />
                                                                ) : role.name === 'Student' ? (
                                                                    <Users className="h-5 w-5 text-emerald-600" />
                                                                ) : (
                                                                    <ShieldCheck className="h-5 w-5 text-gray-500" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-gray-900 text-sm">{role.name}</p>
                                                                <p className="text-xs text-gray-500 font-medium">
                                                                    {role.users_count} {role.users_count === 1 ? 'user' : 'users'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {!role.is_core && (
                                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openEditRole(role)}
                                                                    className="flex-1 rounded-xl text-xs font-bold hover:border-[#024495] hover:text-[#024495]"
                                                                >
                                                                    <Pencil className="h-3 w-3 mr-1.5" /> Rename
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setDeletingRole(role)}
                                                                    className="flex-1 rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-1.5" /> Delete
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!['users', 'roles'].includes(activeSection) && (
                                <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
                                                <Check className="h-4 w-4" /> Settings Saved!
                                            </p>
                                        </Transition>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#024495] hover:bg-[#013575] text-white font-extrabold px-8 py-3 rounded-xl shadow-lg shadow-[#024495]/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        Save Settings
                                    </Button>
                                </div>
                                )}
                            </>
                        )}
                    </Form>
                </div>
            </div>

            {/* Photo Cleanup Modal */}
            {showCleanupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onClick={() => setShowCleanupModal(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900">Confirm Photo Cleanup</h3>
                                <p className="text-xs text-gray-400">Purge old access log capture photos</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs text-gray-600">
                            <p>Select cutoff date. All camera log photos captured <strong>on or before</strong> this date will be permanently deleted to reclaim disk space.</p>
                            <div className="space-y-1">
                                <Label htmlFor="cleanup_date" className="font-bold text-gray-700">Cutoff Date</Label>
                                <Input id="cleanup_date" type="date" value={cleanupCutoffDate} onChange={(e) => setCleanupCutoffDate(e.target.value)} className="rounded-xl" />
                                <p className="text-[11px] text-gray-400">Leave blank to default to end of previous month.</p>
                            </div>
                        </div>

                        {cleanupResult && (
                            <div className={`p-3 rounded-xl text-xs font-bold ${cleanupResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                {cleanupResult.message}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowCleanupModal(false)} className="rounded-xl">Cancel</Button>
                            <Button type="button" variant="destructive" size="sm" onClick={handleExecuteCleanup} disabled={isCleaningPhotos} className="rounded-xl font-bold">
                                {isCleaningPhotos ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Confirm Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Verification Dialog Modal */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-extrabold text-[#024495] flex items-center gap-2">
                            <Lock className="h-5 w-5 text-[#024495]" /> Authentication Required
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-600 mt-1">
                            Please enter your account password to reveal the Google Cloud Service Account JSON Key.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleVerifyPassword} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="verify_password_input" className="text-xs font-bold text-gray-700">
                                Your Account Password
                            </Label>
                            <PasswordInput
                                id="verify_password_input"
                                value={passwordConfirmInput}
                                onChange={(e) => setPasswordConfirmInput(e.target.value)}
                                placeholder="Enter current password"
                                autoFocus
                            />
                            {passwordConfirmError && (
                                <InputError message={passwordConfirmError} />
                            )}
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPasswordModal(false)}
                                className="rounded-xl font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={verifyingPassword || !passwordConfirmInput}
                                className="bg-[#024495] hover:bg-[#013575] text-white font-bold rounded-xl"
                            >
                                {verifyingPassword ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Password'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── User Create / Edit Modal ──────────────────────────────────────── */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onClick={() => setShowUserModal(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#024495]/10 rounded-xl flex items-center justify-center">
                                    <Users className="h-5 w-5 text-[#024495]" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                                    <p className="text-xs text-gray-400">{editingUser ? `Editing ${editingUser.name}` : 'Create a new system account'}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="user_form_name" className="text-xs font-bold text-gray-700">Full Name</Label>
                                <Input
                                    id="user_form_name"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="Juan Dela Cruz"
                                    required
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="user_form_email" className="text-xs font-bold text-gray-700">Email Address</Label>
                                <Input
                                    id="user_form_email"
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    placeholder="juan@school.edu"
                                    required
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="user_form_password" className="text-xs font-bold text-gray-700">
                                    Password {editingUser && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
                                </Label>
                                <PasswordInput
                                    id="user_form_password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder={editingUser ? '••••••••' : 'Min 8 characters'}
                                    required={!editingUser}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="user_form_role" className="text-xs font-bold text-gray-700">Role</Label>
                                <Select
                                    value={userForm.role}
                                    onValueChange={(val) => setUserForm({ ...userForm, role: val })}
                                >
                                    <SelectTrigger id="user_form_role" className="rounded-xl">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(allRoleNames ?? ['Admin', 'Library Staff', 'Student']).map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setShowUserModal(false)} className="rounded-xl font-bold">Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={userFormProcessing}
                                    className="bg-[#024495] hover:bg-[#013575] text-white font-bold rounded-xl shadow-md shadow-[#024495]/20"
                                >
                                    {userFormProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── User Delete Confirm ───────────────────────────────────────────── */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onClick={() => setDeletingUser(null)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                <UserX className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900">Delete User?</h3>
                                <p className="text-xs text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong className="text-gray-900">{deletingUser.name}</strong>? Their account and session data will be permanently removed.
                        </p>
                        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingUser(null)} className="rounded-xl">Cancel</Button>
                            <Button type="button" variant="destructive" size="sm" onClick={handleDeleteUser} className="rounded-xl font-bold">
                                <UserX className="h-4 w-4 mr-2" /> Delete User
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Role Create / Edit Modal ──────────────────────────────────────── */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onClick={() => setShowRoleModal(false)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#024495]/10 rounded-xl flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-[#024495]" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-900">{editingRole ? 'Rename Role' : 'Add New Role'}</h3>
                                    <p className="text-xs text-gray-400">{editingRole ? `Editing "${editingRole.name}"` : 'Create a custom role'}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="role_form_name" className="text-xs font-bold text-gray-700">Role Name</Label>
                                <Input
                                    id="role_form_name"
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm({ name: e.target.value })}
                                    placeholder="e.g. Librarian Assistant"
                                    required
                                    className="rounded-xl"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setShowRoleModal(false)} className="rounded-xl font-bold">Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={roleFormProcessing}
                                    className="bg-[#024495] hover:bg-[#013575] text-white font-bold rounded-xl shadow-md shadow-[#024495]/20"
                                >
                                    {roleFormProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {editingRole ? 'Save Changes' : 'Create Role'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Role Delete Confirm ───────────────────────────────────────────── */}
            {deletingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onClick={() => setDeletingRole(null)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900">Delete Role?</h3>
                                <p className="text-xs text-gray-400">Users assigned this role will lose it</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete the <strong className="text-gray-900">{deletingRole.name}</strong> role? All users currently assigned to this role will become roleless.
                        </p>
                        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingRole(null)} className="rounded-xl">Cancel</Button>
                            <Button type="button" variant="destructive" size="sm" onClick={handleDeleteRole} className="rounded-xl font-bold">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Role
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
