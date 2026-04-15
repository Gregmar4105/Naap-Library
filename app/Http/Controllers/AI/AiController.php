<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    /**
     * Test Ollama local connection and return available models.
     */
    public function testLocalConnection(Request $request): JsonResponse
    {
        $request->validate(['url' => 'required|string']);
        $url = rtrim($request->input('url'), '/');

        try {
            $response = Http::timeout(10)->get("{$url}/api/tags");

            if ($response->successful()) {
                $models = collect($response->json('models', []))
                    ->map(fn($m) => $m['name'] ?? '')
                    ->filter()
                    ->values()
                    ->toArray();

                return response()->json(['success' => true, 'models' => $models]);
            }

            return response()->json([
                'success' => false,
                'message' => "Connection failed: HTTP {$response->status()}",
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Test external AI API (OpenAI-compatible) and return available models.
     */
    public function testApiConnection(Request $request): JsonResponse
    {
        $request->validate([
            'base_url' => 'required|string',
            'api_key'  => 'required|string',
        ]);

        $baseUrl = rtrim($request->input('base_url'), '/');
        $apiKey  = $request->input('api_key');

        try {
            $response = Http::timeout(10)
                ->withToken($apiKey)
                ->get("{$baseUrl}/v1/models");

            if ($response->successful()) {
                $models = collect($response->json('data', []))
                    ->map(fn($m) => $m['id'] ?? '')
                    ->filter()
                    ->values()
                    ->toArray();

                return response()->json(['success' => true, 'models' => $models]);
            }

            return response()->json([
                'success' => false,
                'message' => "HTTP {$response->status()}: " . substr($response->body(), 0, 300),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    use \App\Concerns\HasAi;

    /**
     * Chat with the configured AI provider.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message'           => 'required|string|max:8000',
            'history'           => 'nullable|array',
            'history.*.role'    => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
        ]);

        $settings     = $this->getAiSettings();
        $systemPrompt = $settings->get('ai_system_prompt', '');

        $messages = [];
        if ($systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $systemPrompt];
        }
        foreach ($request->input('history', []) as $msg) {
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $request->input('message')];

        try {
            $response = $this->callAi($messages);
            return response()->json([
                'success' => true,
                'message' => $response,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
