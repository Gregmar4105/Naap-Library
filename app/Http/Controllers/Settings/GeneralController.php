<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SensitivityThreshold;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

use App\Services\StorageCleanupService;
use Illuminate\Http\JsonResponse;

class GeneralController extends Controller
{
    protected StorageCleanupService $storageCleanupService;

    public function __construct(StorageCleanupService $storageCleanupService)
    {
        $this->storageCleanupService = $storageCleanupService;
    }

    /**
     * Show the general settings page.
     */
    public function edit(Request $request): Response
    {
        $faceThreshold = SensitivityThreshold::where('key', 'face_recognition')->first();
        $fingerprintThreshold = SensitivityThreshold::where('key', 'fingerprint')->first();

        $emailSettings = Setting::where('key', 'LIKE', 'mail_%')->get()->pluck('value', 'key');
        $aiSettings = Setting::where('key', 'LIKE', 'ai_%')->get()->pluck('value', 'key');
        $storageAnalytics = $this->storageCleanupService->getStorageAnalytics();

        return Inertia::render('settings/index', [
            'faceThreshold' => $faceThreshold ? (float)$faceThreshold->value : 0.45,
            'fingerprintThreshold' => $fingerprintThreshold ? (float)$fingerprintThreshold->value : 0.60,
            'storageAnalytics' => $storageAnalytics,
            'emailSettings' => [
                'mail_host' => $emailSettings->get('mail_host', ''),
                'mail_port' => $emailSettings->get('mail_port', ''),
                'mail_username' => $emailSettings->get('mail_username', ''),
                'mail_password' => $emailSettings->get('mail_password', ''),
                'mail_encryption' => $emailSettings->get('mail_encryption', 'tls'),
                'mail_from_address' => $emailSettings->get('mail_from_address', ''),
                'mail_from_name' => $emailSettings->get('mail_from_name', ''),
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

        return to_route('settings.general');
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
            if ($password === '••••••••') {
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

            // Purge the cached SMTP transport so it rebuilds with the new config
            app('mail.manager')->purge('smtp');

            Mail::raw(
                'This is a test email from the Library Management System. If you receive this, your email configuration is working correctly!',
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
            // Default to end of previous month
            $cutoffDate = \Carbon\Carbon::now('Asia/Manila')->subMonth()->endOfMonth();
        }

        $user = $request->user();
        $executedBy = $user ? ($user->name ?? $user->email) : 'ADMIN';

        $result = $this->storageCleanupService->cleanupPhotos($cutoffDate, 'MANUAL', $executedBy);

        return response()->json($result, $result['success'] ? 200 : 500);
    }
}
