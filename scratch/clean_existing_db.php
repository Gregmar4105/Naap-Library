<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (\App\Models\EmailMessage::all() as $msg) {
    if (str_contains($msg->body, '--00000') || str_contains($msg->body, 'Content-Transfer-Encoding')) {
        $raw = $msg->body;
        $boundary = null;
        if (preg_match('/boundary="?([^"\r\n;]+)"?/i', $raw, $m)) {
            $boundary = trim($m[1]);
        } elseif (preg_match('/^--([a-zA-Z0-9_\=\-\.]+)/m', $raw, $m)) {
            $boundary = trim($m[1]);
        }

        if ($boundary) {
            $parts = explode('--' . $boundary, $raw);
            $htmlPart = '';
            $plainPart = '';
            foreach ($parts as $part) {
                $part = ltrim($part);
                if ($part === '' || $part === '--') continue;

                $subParts = preg_split('/\r?\n\r?\n/', $part, 2);
                if (count($subParts) < 2) continue;

                $headers = $subParts[0];
                $content = $subParts[1];
                $content = preg_replace('/--$/', '', trim($content));

                if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $headers)) {
                    $content = quoted_printable_decode($content);
                } elseif (preg_match('/Content-Transfer-Encoding:\s*base64/i', $headers)) {
                    $content = base64_decode(trim($content)) ?: $content;
                }

                if (preg_match('/Content-Type:\s*text\/html/i', $headers)) {
                    $htmlPart = $content;
                } elseif (preg_match('/Content-Type:\s*text\/plain/i', $headers)) {
                    $plainPart = $content;
                }
            }
            $clean = !empty($htmlPart) ? $htmlPart : (!empty($plainPart) ? nl2br(e(trim($plainPart))) : $raw);
            $clean = preg_replace('/--[a-zA-Z0-9_=\-\.\+]+(--)?/i', '', $clean);
            $clean = preg_replace('/Content-Type:[^\r\n]*/i', '', $clean);
            $clean = preg_replace('/Content-Transfer-Encoding:[^\r\n]*/i', '', $clean);
            $msg->update(['body' => trim($clean)]);
        }
    }
}

echo "Database records updated successfully.\n";
