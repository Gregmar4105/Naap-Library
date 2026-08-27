<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Models\Setting;

class GoogleFormsService
{
    protected ?string $accessToken = null;

    /**
     * Check if Google API credentials are configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->getCredentials());
    }

    /**
     * Retrieve credentials from env or storage.
     */
    protected function getCredentials(): ?array
    {
        // 1. Check DB settings table
        try {
            $dbJson = \App\Models\Setting::where('key', 'google_service_account_json')->value('value');
            if (!empty($dbJson)) {
                $json = json_decode($dbJson, true);
                if (is_array($json) && isset($json['client_email'], $json['private_key'])) {
                    return $json;
                }
            }
        } catch (Exception $e) {
            // Fallthrough to env/file
        }

        // 2. Check ENV variable
        $rawJson = env('GOOGLE_SERVICE_ACCOUNT_JSON');
        if (!empty($rawJson)) {
            $json = json_decode($rawJson, true);
            if (is_array($json) && isset($json['client_email'], $json['private_key'])) {
                return $json;
            }
        }

        // 3. Check storage file
        $path = env('GOOGLE_SERVICE_ACCOUNT_PATH', storage_path('app/google-service-account.json'));
        if (file_exists($path)) {
            $json = json_decode(file_get_contents($path), true);
            if (is_array($json) && isset($json['client_email'], $json['private_key'])) {
                return $json;
            }
        }

        return null;
    }

    /**
     * Get OAuth2 Access Token for Google Forms & Drive APIs.
     */
    public function getAccessToken(): string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        // Direct token fallback if provided
        $directToken = env('GOOGLE_FORMS_ACCESS_TOKEN');
        if (!empty($directToken)) {
            $this->accessToken = $directToken;
            return $this->accessToken;
        }

        $credentials = $this->getCredentials();
        if (!$credentials) {
            throw new Exception("Google Forms API Credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON or place google-service-account.json in storage/app/.");
        }

        $clientEmail = $credentials['client_email'];
        $privateKey  = $credentials['private_key'];

        $header = [
            'alg' => 'RS256',
            'typ' => 'JWT',
        ];

        $now = time();
        $payload = [
            'iss'   => $clientEmail,
            'scope' => 'https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/forms.responses.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'exp'   => $now + 3600,
            'iat'   => $now,
        ];

        $base64UrlHeader  = $this->base64UrlEncode(json_encode($header));
        $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));

        $signatureInput = $base64UrlHeader . "." . $base64UrlPayload;
        $signature = '';

        if (!openssl_sign($signatureInput, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new Exception("Failed to sign Google OAuth JWT token.");
        }

        $base64UrlSignature = $this->base64UrlEncode($signature);
        $jwt = $signatureInput . "." . $base64UrlSignature;

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]);

        if (!$response->successful()) {
            Log::error('Google OAuth Token Request Failed', ['response' => $response->body()]);
            throw new Exception("Failed to obtain Google OAuth access token: " . ($response->json('error_description') ?? $response->body()));
        }

        $this->accessToken = $response->json('access_token');
        return $this->accessToken;
    }

    /**
     * Test Google API connection.
     */
    public function testConnection(): array
    {
        try {
            if (!$this->isConfigured() && !env('GOOGLE_FORMS_ACCESS_TOKEN')) {
                return [
                    'configured' => false,
                    'success'    => false,
                    'message'    => 'Google Service Account credentials not found.',
                ];
            }

            $token = $this->getAccessToken();
            if ($token) {
                return [
                    'configured' => true,
                    'success'    => true,
                    'message'    => 'Successfully authenticated with Google API.',
                ];
            }
        } catch (Exception $e) {
            return [
                'configured' => $this->isConfigured(),
                'success'    => false,
                'message'    => $e->getMessage(),
            ];
        }

        return [
            'configured' => false,
            'success'    => false,
            'message'    => 'Unknown configuration status.',
        ];
    }

    /**
     * Get Service Account Client Email from JSON credentials.
     */
    public function getServiceAccountEmail(): string
    {
        $json = $this->getCredentials();
        return $json['client_email'] ?? 'service-account@google.com';
    }

    /**
     * Create a Google Form and add question items.
     */
    public function createForm(string $title, ?string $description = null, array $questions = []): array
    {
        $token = $this->getAccessToken();
        $folderId = Setting::where('key', 'google_drive_folder_id')->value('value') ?: env('GOOGLE_DRIVE_FOLDER_ID');
        $formId = null;

        // 1. Search for Google Form inside the shared folder
        if (!empty($folderId)) {
            $searchRes = Http::withToken($token)
                ->get("https://www.googleapis.com/drive/v3/files?q='{$folderId}'+in+parents+and+mimeType='application/vnd.google-apps.form'&supportsAllDrives=true");
            if ($searchRes->successful() && !empty($searchRes->json('files'))) {
                $formId = $searchRes->json('files')[0]['id'];
            }
        }

        if (!$formId) {
            // Try direct Forms API creation
            $createResponse = Http::withToken($token)
                ->post('https://forms.googleapis.com/v1/forms', [
                    'info' => [
                        'title' => $title ?: 'Library Survey',
                    ],
                ]);

            if ($createResponse->successful()) {
                $formId = $createResponse->json('formId');

                // Move created form into folder if folderId is specified
                if (!empty($folderId)) {
                    Http::withToken($token)->patch("https://www.googleapis.com/drive/v3/files/{$formId}?addParents={$folderId}&supportsAllDrives=true");
                }
            } else {
                $saEmail = $this->getServiceAccountEmail();
                Log::error('Google Forms Create Failed', ['response' => $createResponse->body()]);
                throw new Exception("Google Forms Setup Required: Google Service Accounts have 0 MB storage. Please create 1 blank Google Form inside your shared Google Drive folder ('Library Surveys') so the system can use it to publish forms.");
            }
        }

        // Grant writer permission so human admin can view & edit in Google Forms
        try {
            Http::withToken($token)->post("https://www.googleapis.com/drive/v3/files/{$formId}/permissions", [
                'role' => 'writer',
                'type' => 'anyone',
            ]);
        } catch (Exception $pe) {
            Log::warning('Failed to set file permission on Google Form: ' . $pe->getMessage());
        }

        $responderUri = "https://docs.google.com/forms/d/e/{$formId}/viewform";
        $editUri = "https://docs.google.com/forms/d/{$formId}/edit";

        // 2. Batch update title, description & question items
        $requests = [];

        $infoUpdate = ['title' => $title ?: 'Library Survey'];
        $updateMask = 'title';

        if (!empty($description)) {
            $infoUpdate['description'] = $description;
            $updateMask .= ',description';
        }

        $requests[] = [
            'updateFormInfo' => [
                'info'       => $infoUpdate,
                'updateMask' => $updateMask,
            ],
        ];

        foreach ($questions as $index => $q) {
            $item = $this->buildQuestionItem($q);
            $requests[] = [
                'createItem' => [
                    'item'     => $item,
                    'location' => [
                        'index' => $index,
                    ],
                ],
            ];
        }

        if (!empty($requests)) {
            $batchResponse = Http::withToken($token)
                ->post("https://forms.googleapis.com/v1/forms/{$formId}:batchUpdate", [
                    'requests' => $requests,
                ]);

            if (!$batchResponse->successful()) {
                Log::error('Google Forms BatchUpdate Failed', ['response' => $batchResponse->body()]);
            }
        }

        // 3. Fetch latest form to retrieve generated Google question item IDs & URIs
        try {
            $finalForm = $this->getForm($formId);
            $responderUri = $finalForm['responderUri'] ?? $responderUri;
        } catch (Exception $fe) {
            Log::warning('Could not fetch final form details: ' . $fe->getMessage());
        }

        return [
            'google_form_id' => $formId,
            'responder_uri'  => $responderUri,
            'edit_uri'       => $editUri,
        ];
    }

    /**
     * Get Google Form details by formId.
     */
    public function getForm(string $formId): array
    {
        $token = $this->getAccessToken();
        $response = Http::withToken($token)->get("https://forms.googleapis.com/v1/forms/{$formId}");

        if (!$response->successful()) {
            throw new Exception("Failed to fetch Google Form [{$formId}]: " . $response->body());
        }

        return $response->json();
    }

    /**
     * Update an existing Google Form (title, description, questions).
     */
    public function updateForm(string $formId, string $title, ?string $description = null, array $questions = []): array
    {
        $token = $this->getAccessToken();

        // 1. Get current form items to clear/recreate
        $currentForm = $this->getForm($formId);
        $currentItems = $currentForm['items'] ?? [];

        $requests = [];

        // Update Form Title & Description
        $requests[] = [
            'updateFormInfo' => [
                'info' => [
                    'title'       => $title,
                    'description' => $description ?? '',
                ],
                'updateMask' => 'title,description',
            ],
        ];

        // Delete existing items in reverse order
        for ($i = count($currentItems) - 1; $i >= 0; $i--) {
            $requests[] = [
                'deleteItem' => [
                    'location' => [
                        'index' => $i,
                    ],
                ],
            ];
        }

        // Add new items
        foreach ($questions as $index => $q) {
            $item = $this->buildQuestionItem($q);
            $requests[] = [
                'createItem' => [
                    'item' => $item,
                    'location' => [
                        'index' => $index,
                    ],
                ],
            ];
        }

        $batchResponse = Http::withToken($token)
            ->post("https://forms.googleapis.com/v1/forms/{$formId}:batchUpdate", [
                'requests' => $requests,
            ]);

        if (!$batchResponse->successful()) {
            Log::error('Google Forms Update BatchUpdate Failed', ['response' => $batchResponse->body()]);
            throw new Exception("Failed to update Google Form: " . $batchResponse->body());
        }

        $finalForm = $this->getForm($formId);

        return [
            'google_form_id' => $formId,
            'responder_uri'  => $finalForm['responderUri'] ?? "https://docs.google.com/forms/d/{$formId}/viewform",
            'edit_uri'       => "https://docs.google.com/forms/d/{$formId}/edit",
            'items'          => $finalForm['items'] ?? [],
        ];
    }

    /**
     * Delete Google Form using Google Drive API.
     */
    public function deleteForm(string $formId): bool
    {
        try {
            $token = $this->getAccessToken();
            $response = Http::withToken($token)->delete("https://www.googleapis.com/drive/v3/files/{$formId}");

            if (!$response->successful()) {
                Log::warning("Google Drive Delete Form Warning [{$formId}]: " . $response->body());
                return false;
            }

            return true;
        } catch (Exception $e) {
            Log::error("Google Drive Delete Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get responses submitted to the Google Form.
     */
    public function getResponses(string $formId): array
    {
        $token = $this->getAccessToken();
        $response = Http::withToken($token)->get("https://forms.googleapis.com/v1/forms/{$formId}/responses");

        if (!$response->successful()) {
            throw new Exception("Failed to fetch Google Form Responses: " . $response->body());
        }

        return $response->json('responses') ?? [];
    }

    /**
     * Helper to construct a Google Form Question Item object based on type.
     */
    protected function buildQuestionItem(array $q): array
    {
        $title    = $q['label'] ?? 'Question';
        $required = !empty($q['required']);
        $type     = $q['type'] ?? 'short_text';
        $options  = is_array($q['options'] ?? null) ? $q['options'] : [];

        $questionObject = [
            'required' => $required,
        ];

        switch ($type) {
            case 'paragraph':
                $questionObject['textQuestion'] = ['paragraph' => true];
                break;

            case 'multiple_choice':
                $questionObject['choiceQuestion'] = [
                    'type'    => 'RADIO',
                    'options' => array_map(fn($opt) => ['value' => (string) $opt], $options ?: ['Option 1']),
                ];
                break;

            case 'checkboxes':
                $questionObject['choiceQuestion'] = [
                    'type'    => 'CHECKBOX',
                    'options' => array_map(fn($opt) => ['value' => (string) $opt], $options ?: ['Option 1']),
                ];
                break;

            case 'dropdown':
                $questionObject['choiceQuestion'] = [
                    'type'    => 'DROP_DOWN',
                    'options' => array_map(fn($opt) => ['value' => (string) $opt], $options ?: ['Option 1']),
                ];
                break;

            case 'rating':
                $questionObject['scaleQuestion'] = [
                    'low'  => 1,
                    'high' => 5,
                ];
                break;

            case 'date':
                $questionObject['dateQuestion'] = [
                    'includeYear' => true,
                    'includeTime' => false,
                ];
                break;

            case 'short_text':
            default:
                $questionObject['textQuestion'] = ['paragraph' => false];
                break;
        }

        return [
            'title' => $title,
            'questionItem' => [
                'question' => $questionObject,
            ],
        ];
    }

    /**
     * Helper base64Url encoding.
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
