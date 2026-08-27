<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SensitivityThreshold;
use App\Models\Setting;
use App\Models\User;
use App\Services\ImapService;
use App\Services\GoogleFormsService;
use App\Services\StorageCleanupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class GeneralController extends Controller
{
    protected StorageCleanupService $storageCleanupService;
    protected GoogleFormsService $googleFormsService;

    public function __construct(
        StorageCleanupService $storageCleanupService,
        GoogleFormsService $googleFormsService
    ) {
        $this->storageCleanupService = $storageCleanupService;
        $this->googleFormsService     = $googleFormsService;
    }

    /**
     * Show the general settings page.
     */
    public function edit(Request $request): Response
    {
        $faceThreshold = SensitivityThreshold::where('key', 'face_recognition')->first();
        $fingerprintThreshold = SensitivityThreshold::where('key', 'fingerprint')->first();

        $emailSettings = Setting::where('key', 'LIKE', 'mail_%')->get()->pluck('value', 'key');
        $imapSettings = Setting::where('key', 'LIKE', 'imap_%')->get()->pluck('value', 'key');
        $aiSettings = Setting::where('key', 'LIKE', 'ai_%')->get()->pluck('value', 'key');
        $googleJson = Setting::where('key', 'google_service_account_json')->value('value') ?? '';

        $storageAnalytics = $this->storageCleanupService->getStorageAnalytics();
        $googleStatus     = $this->googleFormsService->testConnection();

        return Inertia::render('settings/index', [
            'faceThreshold' => $faceThreshold ? (float)$faceThreshold->value : 0.45,
            'fingerprintThreshold' => $fingerprintThreshold ? (float)$fingerprintThreshold->value : 0.60,
            'storageAnalytics' => $storageAnalytics,
            'emailSettings' => [
                'mail_host' => $emailSettings->get('mail_host', 'smtp.larksuite.com'),
                'mail_port' => $emailSettings->get('mail_port', '465'),
                'mail_username' => $emailSettings->get('mail_username', 'naaplibrary@larable.dev'),
                'mail_password' => $emailSettings->get('mail_password', '3BgoCA1F0mU26cfR'),
                'mail_encryption' => $emailSettings->get('mail_encryption', 'ssl'),
                'mail_from_address' => $emailSettings->get('mail_from_address', 'naaplibrary@larable.dev'),
                'mail_from_name' => $emailSettings->get('mail_from_name', 'NAAP Library'),
            ],
            'imapSettings' => [
                'imap_host' => $imapSettings->get('imap_host', 'imap.larksuite.com'),
                'imap_port' => $imapSettings->get('imap_port', '993'),
                'imap_username' => $imapSettings->get('imap_username', 'naaplibrary@larable.dev'),
                'imap_password' => $imapSettings->get('imap_password', '3BgoCA1F0mU26cfR'),
                'imap_encryption' => $imapSettings->get('imap_encryption', 'ssl'),
                'imap_enabled' => $imapSettings->get('imap_enabled', '1'),
            ],
            'aiSettings' => [
                'ai_provider'      => $aiSettings->get('ai_provider', 'local'),
                'ai_local_url'     => $aiSettings->get('ai_local_url', 'http://localhost:11434'),
                'ai_local_model'   => $aiSettings->get('ai_local_model', ''),
                'ai_api_base_url'  => $aiSettings->get('ai_api_base_url', ''),
                'ai_api_key'       => $aiSettings->get('ai_api_key', ''),
                'ai_api_model'     => $aiSettings->get('ai_api_model', ''),
                'ai_system_prompt' => $aiSettings->get('ai_system_prompt', ''),
            ],
            'googleFormsSettings' => [
                'google_service_account_json' => '',
                'has_service_account_json'   => !empty($googleJson),
                'google_drive_folder_id'      => Setting::where('key', 'google_drive_folder_id')->value('value') ?? '',
                'service_account_email'       => $this->googleFormsService->getServiceAccountEmail(),
                'status'                      => $googleStatus,
            ],
            'users' => User::with('roles')
                ->orderBy('name')
                ->get()
                ->map(fn (User $u) => [
                    'id'         => $u->id,
                    'name'       => $u->name,
                    'email'      => $u->email,
                    'roles'      => $u->roles->pluck('name'),
                    'created_at' => $u->created_at?->toDateString(),
                ]),
            'roles' => Role::withCount('users')
                ->orderBy('name')
                ->get()
                ->map(fn (Role $role) => [
                    'id'          => $role->id,
                    'name'        => $role->name,
                    'users_count' => $role->users_count,
                    'is_core'     => in_array($role->name, ['Admin', 'Library Staff', 'Student']),
                ]),
            'allRoleNames' => Role::orderBy('name')->pluck('name'),
        ]);

    }

    /**
     * Update the general settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'face_threshold' => ['nullable', 'numeric', 'min:0.1', 'max:0.9'],
            'fingerprint_threshold' => ['nullable', 'numeric', 'min:0.1', 'max:0.9'],
        ]);

        if ($request->has('face_threshold')) {
            SensitivityThreshold::updateOrCreate(
                ['key' => 'face_recognition'],
                ['value' => $request->input('face_threshold')]
            );
        }

        if ($request->has('fingerprint_threshold')) {
            SensitivityThreshold::updateOrCreate(
                ['key' => 'fingerprint'],
                ['value' => $request->input('fingerprint_threshold')]
            );
        }

        $emailFields = [
            'mail_host', 'mail_port', 'mail_username', 'mail_password',
            'mail_encryption', 'mail_from_address', 'mail_from_name'
        ];

        foreach ($emailFields as $field) {
            if ($request->has($field)) {
                $value = $request->input($field);
                if ($field === 'mail_password' && $value === '••••••••') {
                    continue;
                }
                Setting::updateOrCreate(
                    ['key' => $field],
                    ['value' => $value]
                );
            }
        }

        $imapFields = [
            'imap_host', 'imap_port', 'imap_username', 'imap_password',
            'imap_encryption', 'imap_enabled'
        ];

        foreach ($imapFields as $field) {
            if ($request->has($field)) {
                $value = $request->input($field);
                if ($field === 'imap_password' && ($value === '••••••••' || empty($value))) {
                    continue;
                }
                Setting::updateOrCreate(
                    ['key' => $field],
                    ['value' => $value]
                );
            }
        }

        $aiFields = [
            'ai_provider', 'ai_local_url', 'ai_local_model',
            'ai_api_base_url', 'ai_api_key', 'ai_api_model', 'ai_system_prompt',
        ];

        foreach ($aiFields as $field) {
            if ($request->has($field)) {
                Setting::updateOrCreate(
                    ['key' => $field],
                    ['value' => $request->input($field)]
                );
            }
        }

        if ($request->has('google_service_account_json')) {
            $jsonVal = $request->input('google_service_account_json');
            if ($jsonVal !== null && trim($jsonVal) !== '' && $jsonVal !== '••••••••') {
                Setting::updateOrCreate(
                    ['key' => 'google_service_account_json'],
                    ['value' => trim($jsonVal)]
                );
            }
        }

        if ($request->has('google_drive_folder_id')) {
            Setting::updateOrCreate(
                ['key' => 'google_drive_folder_id'],
                ['value' => trim($request->input('google_drive_folder_id'))]
            );
        }

        return to_route('settings.general');
    }

    /**
     * Verify user password to reveal sensitive settings.
     */
    public function verifyPassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (!Hash::check($request->password, $request->user()->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The password you entered is incorrect.',
            ], 422);
        }

        $googleJson = Setting::where('key', 'google_service_account_json')->value('value') ?? '';

        return response()->json([
            'success' => true,
            'google_service_account_json' => $googleJson,
        ]);
    }

    /**
     * Send a test email.
     */
    public function testEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'mail_host'         => 'required|string',
            'mail_port'         => 'required',
            'mail_from_address' => 'required|email',
        ]);

        try {
            $encryption = strtolower((string) $request->input('mail_encryption', ''));
            $port = (int) $request->input('mail_port');
            $scheme = match($encryption) {
                'ssl', 'smtps' => 'smtps',
                'tls' => ($port === 465 ? 'smtps' : null),
                default => null,
            };

            $password = $request->input('mail_password');
            if ($password === '••••••••' || empty($password)) {
                $password = Setting::where('key', 'mail_password')->value('value') ?? '';
            }

            config([
                'mail.mailers.smtp.host'     => $request->input('mail_host'),
                'mail.mailers.smtp.port'     => (int) $request->input('mail_port'),
                'mail.mailers.smtp.scheme'   => $scheme,
                'mail.mailers.smtp.username' => $request->input('mail_username'),
                'mail.mailers.smtp.password' => $password,
                'mail.from.address'          => $request->input('mail_from_address'),
                'mail.from.name'             => $request->input('mail_from_name', 'Library System'),
                'mail.default'               => 'smtp',
            ]);

            app('mail.manager')->purge('smtp');

            Mail::raw(
                'This is a test email from the Library Management System. If you receive this, your SMTP configuration is working correctly!',
                function ($message) use ($request) {
                    $message->to($request->input('mail_from_address'))
                            ->subject('Test Email – Library Management System');
                }
            );

            return back()->with('success', 'Test email sent successfully to ' . $request->input('mail_from_address') . '. Please check your inbox.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to send test email: ' . $e->getMessage());
        }
    }

    /**
     * Test IMAP connection.
     */
    public function testImap(Request $request): RedirectResponse
    {
        $request->validate([
            'imap_host'     => 'required|string',
            'imap_port'     => 'required',
            'imap_username' => 'required|string',
        ]);

        $password = $request->input('imap_password');
        if ($password === '••••••••' || empty($password)) {
            $password = Setting::where('key', 'imap_password')->value('value') ?? '';
        }

        $service = new ImapService([
            'imap_host'       => $request->input('imap_host'),
            'imap_port'       => $request->input('imap_port'),
            'imap_username'   => $request->input('imap_username'),
            'imap_password'   => $password,
            'imap_encryption' => $request->input('imap_encryption'),
        ]);

        $result = $service->testConnection();

        if ($result['success']) {
            return back()->with('success', $result['message']);
        } else {
            return back()->with('error', $result['message']);
        }
    }

    /**
     * Test Google Forms API connection.
     */
    public function testGoogleFormsApi(Request $request): RedirectResponse
    {
        if ($request->has('google_service_account_json')) {
            Setting::updateOrCreate(
                ['key' => 'google_service_account_json'],
                ['value' => $request->input('google_service_account_json')]
            );
        }

        $result = $this->googleFormsService->testConnection();

        if ($result['success']) {
            return back()->with('success', $result['message']);
        } else {
            return back()->with('error', 'Google Forms API Test Failed: ' . $result['message']);
        }
    }

    /**
     * Get storage and database analytics via JSON API.
     */
    public function getStorageAnalyticsApi(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'analytics' => $this->storageCleanupService->getStorageAnalytics(),
        ]);
    }

    /**
     * Trigger manual date-based photo cleanup from Settings dashboard.
     */
    public function triggerPhotoCleanupApi(Request $request): JsonResponse
    {
        $cutoffInput = $request->input('cutoff_date');
        $cutoffDate = null;

        if ($cutoffInput) {
            try {
                $cutoffDate = \Carbon\Carbon::parse($cutoffInput)->endOfDay();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid cutoff date provided.',
                ], 422);
            }
        } else {
            $cutoffDate = \Carbon\Carbon::now('Asia/Manila')->subMonth()->endOfMonth();
        }

        $user = $request->user();
        $executedBy = $user ? ($user->name ?? $user->email) : 'ADMIN';

        $result = $this->storageCleanupService->cleanupPhotos($cutoffDate, 'MANUAL', $executedBy);

        return response()->json($result, $result['success'] ? 200 : 500);
    }
}
