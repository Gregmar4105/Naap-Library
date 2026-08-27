<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Chat;
use App\Models\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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
            'chat_id'           => 'nullable|exists:chats,id',
            'history'           => 'nullable|array',
            'history.*.role'    => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
        ]);

        $user = $request->user();
        $chatId = $request->input('chat_id');
        $isNewChat = !$chatId;

        if ($isNewChat) {
            $chat = Chat::create([
                'user_id' => $user->id,
                'title'   => Str::limit($request->input('message'), 50),
            ]);
            $chatId = $chat->id;
        } else {
            $chat = Chat::where('id', $chatId)->where('user_id', $user->id)->firstOrFail();
        }

        // Save user message
        ChatMessage::create([
            'chat_id' => $chatId,
            'role'    => 'user',
            'content' => $request->input('message'),
        ]);

        $settings     = $this->getAiSettings();
        $systemPrompt = $settings->get('ai_system_prompt', 'You are a helpful library assistant.');
        
        // Append database access capabilities to the system prompt
        $systemPrompt .= "\n\nYou have access to tools that can query the library database. " .
                         "You can search for students, check library statistics, view recent entrance/exit logs, and check locker availability. " .
                         "\n\nCRITICAL: When asked about specific students, logs, or library status, you MUST use your tools to provide accurate data. " .
                         "Do NOT hallucinate or guess numbers if you haven't called a tool to retrieve them.";

        $messages = [];
        if ($systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $systemPrompt];
        }
        foreach ($request->input('history', []) as $msg) {
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $request->input('message')];

        try {
            $aiResponse = $this->callAi($messages);

            // Save AI response
            ChatMessage::create([
                'chat_id' => $chatId,
                'role'    => 'assistant',
                'content' => $aiResponse,
            ]);

            return response()->json([
                'success' => true,
                'message' => $aiResponse,
                'chat_id' => $chatId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get chat history for the current user.
     */
    public function getHistory(Request $request): JsonResponse
    {
        $history = Chat::where('user_id', $request->user()->id)
            ->withCount('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'history' => $history,
        ]);
    }

    /**
     * Get messages for a specific chat.
     */
    public function getMessages(Request $request, $id): JsonResponse
    {
        $chat = Chat::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with('messages')
            ->firstOrFail();

        return response()->json([
            'success'  => true,
            'chat'     => $chat,
            'messages' => $chat->messages,
        ]);
    }

    /**
     * Delete a chat and its messages.
     */
    public function deleteChat(Request $request, $id): JsonResponse
    {
        try {
            $chat = Chat::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $chat->delete();

            return response()->json([
                'success' => true,
                'message' => 'Chat deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete chat: ' . $e->getMessage(),
            ], 500);
        }
    }
}
