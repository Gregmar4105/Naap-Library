<?php

namespace App\Concerns;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait HasAi
{
    /**
     * Get all AI settings from the database.
     */
    protected function getAiSettings()
    {
        return Setting::where('key', 'LIKE', 'ai_%')->get()->pluck('value', 'key');
    }

    /**
     * Call the configured AI provider and return a JSON response.
     */
    protected function callAi(array $messages, $provider = null)
    {
        $settings = $this->getAiSettings();
        $provider = $provider ?: $settings->get('ai_provider', 'local');

        return $provider === 'local'
            ? $this->callOllama($settings, $messages)
            : $this->callExternalApi($settings, $messages);
    }

    /**
     * Call Ollama (Local).
     */
    private function callOllama($settings, array $messages)
    {
        $url   = rtrim($settings->get('ai_local_url', 'http://localhost:11434'), '/');
        $model = $settings->get('ai_local_model', '');

        if (!$model) {
            throw new \Exception('No Ollama model configured. Go to Settings → AI Assistant.');
        }

        $response = Http::timeout(180)->post("{$url}/api/chat", [
            'model'    => $model,
            'messages' => $messages,
            'stream'   => false,
        ]);

        if ($response->successful()) {
            return $response->json('message.content', '');
        }

        throw new \Exception('Ollama error: ' . $response->body());
    }

    /**
     * Call External API (OpenAI-compatible).
     */
    private function callExternalApi($settings, array $messages)
    {
        $baseUrl = rtrim($settings->get('ai_api_base_url', ''), '/');
        $apiKey  = $settings->get('ai_api_key', '');
        $model   = $settings->get('ai_api_model', '');

        if (!$baseUrl || !$apiKey || !$model) {
            throw new \Exception('AI API is not fully configured. Go to Settings → AI Assistant.');
        }

        $response = Http::timeout(60)
            ->withToken($apiKey)
            ->post("{$baseUrl}/v1/chat/completions", [
                'model'    => $model,
                'messages' => $messages,
            ]);

        if ($response->successful()) {
            return $response->json('choices.0.message.content', '');
        }

        throw new \Exception('AI API error: ' . $response->body());
    }

    /**
     * Stream an AI response using Server-Sent Events (SSE).
     */
    protected function streamAiResponse(array $messages, string $systemPrompt = '')
    {
        $settings = $this->getAiSettings();
        $provider = $settings->get('ai_provider', 'local');

        if ($systemPrompt) {
            array_unshift($messages, ['role' => 'system', 'content' => $systemPrompt]);
        }

        return response()->stream(function () use ($provider, $settings, $messages) {
            if ($provider === 'local') {
                $this->streamOllama($settings, $messages);
            } else {
                $this->streamExternalApi($settings, $messages);
            }

            echo "data: [DONE]\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Content-Type' => 'text/event-stream',
        ]);
    }

    private function streamOllama($settings, array $messages)
    {
        $url   = rtrim($settings->get('ai_local_url', 'http://localhost:11434'), '/');
        $model = $settings->get('ai_local_model', '');

        $client = new \GuzzleHttp\Client();
        $response = $client->post("{$url}/api/chat", [
            'json' => [
                'model'    => $model,
                'messages' => $messages,
                'stream'   => true,
            ],
            'stream' => true,
        ]);

        $body = $response->getBody();
        while (!$body->eof()) {
            $line = $this->readLine($body);
            if ($line) {
                $data = json_decode($line, true);
                $content = $data['message']['content'] ?? '';
                if ($content) {
                    echo "data: " . json_encode(['text' => $content]) . "\n\n";
                    ob_flush();
                    flush();
                }
            }
        }
    }

    private function streamExternalApi($settings, array $messages)
    {
        $baseUrl = rtrim($settings->get('ai_api_base_url', ''), '/');
        $apiKey  = $settings->get('ai_api_key', '');
        $model   = $settings->get('ai_api_model', '');

        $client = new \GuzzleHttp\Client();
        $response = $client->post("{$baseUrl}/v1/chat/completions", [
            'headers' => [
                'Authorization' => "Bearer {$apiKey}",
            ],
            'json' => [
                'model'    => $model,
                'messages' => $messages,
                'stream'   => true,
            ],
            'stream' => true,
        ]);

        $body = $response->getBody();
        while (!$body->eof()) {
            $line = $this->readLine($body);
            if ($line) {
                if (strpos($line, 'data: ') === 0) {
                    $jsonStr = substr($line, 6);
                    if (trim($jsonStr) === '[DONE]') break;
                    
                    $data = json_decode($jsonStr, true);
                    $content = $data['choices'][0]['delta']['content'] ?? '';
                    if ($content) {
                        echo "data: " . json_encode(['text' => $content]) . "\n\n";
                        ob_flush();
                        flush();
                    }
                }
            }
        }
    }

    private function readLine($stream)
    {
        $line = '';
        while (!$stream->eof()) {
            $byte = $stream->read(1);
            if ($byte === "\n") {
                return $line;
            }
            $line .= $byte;
        }
        return $line;
    }
}
