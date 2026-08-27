<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$imap = new \App\Services\ImapService();
$reflected = new ReflectionClass($imap);
$connect = $reflected->getMethod('connect');
$connect->setAccessible(true);
$sendCmd = $reflected->getMethod('sendCmd');
$sendCmd->setAccessible(true);

$fp = $connect->invoke($imap);
$sendCmd->invoke($imap, $fp, "A001 LOGIN naaplibrary@larable.dev 3BgoCA1F0mU26cfR");
$sendCmd->invoke($imap, $fp, "A002 SELECT INBOX");
$lines = $sendCmd->invoke($imap, $fp, "A003 FETCH * (UID BODY[])");
$sendCmd->invoke($imap, $fp, "A004 LOGOUT");
fclose($fp);

$raw = implode('', $lines);
// Strip IMAP FETCH protocol headers
$raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(UID\s+\d+\s+BODY\[\]\s+\{\d+\}\r?\n/i', '', $raw);
$raw = preg_replace('/\r?\n\)?\s*A\d+\s+OK.*$/is', '', $raw);

function parseMimePart(string $partRaw, array &$attachments, array &$htmlParts, array &$plainParts) {
    $parts = preg_split('/\r?\n\r?\n/', $partRaw, 2);
    if (count($parts) < 2) {
        return;
    }
    $headersRaw = $parts[0];
    $bodyRaw = $parts[1];

    $headers = [];
    $headerLines = preg_split('/\r?\n(?=[^\s])/', $headersRaw);
    foreach ($headerLines as $line) {
        if (preg_match('/^([a-zA-Z0-9\-]+):\s*(.*)$/s', trim($line), $m)) {
            $headers[strtolower($m[1])] = trim($m[2]);
        }
    }

    $contentType = $headers['content-type'] ?? 'text/plain';
    $contentDisposition = $headers['content-disposition'] ?? '';
    $transferEncoding = strtolower($headers['content-transfer-encoding'] ?? '');
    $contentId = isset($headers['content-id']) ? trim($headers['content-id'], '<> ') : null;

    if (preg_match('/boundary="?([^"\r\n;]+)"?/i', $contentType, $bm)) {
        $boundary = trim($bm[1]);
        $subParts = explode('--' . $boundary, $bodyRaw);
        foreach ($subParts as $subPart) {
            $subPart = trim($subPart);
            if ($subPart === '' || $subPart === '--') continue;
            parseMimePart($subPart, $attachments, $htmlParts, $plainParts);
        }
        return;
    }

    if ($transferEncoding === 'base64') {
        $decoded = base64_decode(preg_replace('/\s+/', '', $bodyRaw));
    } elseif ($transferEncoding === 'quoted-printable') {
        $decoded = quoted_printable_decode($bodyRaw);
    } else {
        $decoded = $bodyRaw;
    }

    $filename = null;
    if (preg_match('/filename="?([^"\r\n;]+)"?/i', $contentDisposition . ' ' . $contentType, $fm)) {
        $filename = trim($fm[1]);
    } elseif (preg_match('/name="?([^"\r\n;]+)"?/i', $contentType, $fm)) {
        $filename = trim($fm[1]);
    }

    $isAttachment = str_contains(strtolower($contentDisposition), 'attachment') || !empty($filename);
    $isInlineImage = str_contains(strtolower($contentDisposition), 'inline') && str_contains(strtolower($contentType), 'image/');

    if ($isAttachment || $isInlineImage || (!str_contains(strtolower($contentType), 'text/html') && !str_contains(strtolower($contentType), 'text/plain') && !empty($filename))) {
        if ($decoded) {
            $ext = $filename ? pathinfo($filename, PATHINFO_EXTENSION) : 'bin';
            if (empty($ext) || $ext === 'bin') {
                if (preg_match('/image\/([a-zA-Z0-9]+)/i', $contentType, $im)) {
                    $ext = $im[1] === 'jpeg' ? 'jpg' : $im[1];
                }
            }

            $filename = $filename ?: ('file_' . date('Ymd_His') . '.' . $ext);
            $storedName = 'attach_' . time() . '_' . \Illuminate\Support\Str::random(6) . '.' . $ext;

            $url = '/storage/attachments/' . $storedName;
            $mime = trim(explode(';', $contentType)[0]);

            $type = 'file';
            if (str_starts_with($mime, 'image/')) $type = 'image';
            elseif (str_starts_with($mime, 'video/')) $type = 'video';
            elseif (str_starts_with($mime, 'audio/')) $type = 'audio';

            $attachments[] = [
                'name' => $filename,
                'url'  => $url,
                'mime' => $mime,
                'type' => $type,
                'size' => strlen($decoded),
                'content_id' => $contentId,
            ];
        }
    } else {
        if (str_contains(strtolower($contentType), 'text/html')) {
            $htmlParts[] = $decoded;
        } else {
            $plainParts[] = $decoded;
        }
    }
}

$attachments = [];
$htmlParts = [];
$plainParts = [];

parseMimePart($raw, $attachments, $htmlParts, $plainParts);

echo "Parsed Attachments count: " . count($attachments) . "\n";
print_r($attachments);
echo "\nHTML parts count: " . count($htmlParts) . "\n";
if (!empty($htmlParts)) echo "HTML sample:\n" . substr($htmlParts[0], 0, 300) . "\n";
echo "\nPlain parts count: " . count($plainParts) . "\n";
if (!empty($plainParts)) echo "Plain sample:\n" . substr($plainParts[0], 0, 300) . "\n";
