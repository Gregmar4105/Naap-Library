<?php

namespace App\Services;

use App\Models\EmailMessage;
use App\Models\Setting;
use App\Models\StudentInfo;
use App\Models\SystemNotification;
use Illuminate\Support\Facades\Log;

class ImapService
{
    protected string $host;
    protected int $port;
    protected string $username;
    protected string $password;
    protected string $encryption;
    protected bool $enabled;

    public function __construct(?array $config = null)
    {
        if ($config) {
            $this->host = $config['imap_host'] ?? '';
            $this->port = (int) ($config['imap_port'] ?? 993);
            $this->username = $config['imap_username'] ?? '';
            $this->password = $config['imap_password'] ?? '';
            $this->encryption = strtolower((string) ($config['imap_encryption'] ?? 'ssl'));
            $this->enabled = isset($config['imap_enabled']) ? (bool) $config['imap_enabled'] : true;
        } else {
            $settings = Setting::where('key', 'LIKE', 'imap_%')->get()->pluck('value', 'key');
            $this->host = $settings->get('imap_host', 'imap.larksuite.com');
            $this->port = (int) $settings->get('imap_port', 993);
            $this->username = $settings->get('imap_username', 'naaplibrary@larable.dev');
            $this->password = $settings->get('imap_password', '3BgoCA1F0mU26cfR');
            $this->encryption = strtolower((string) $settings->get('imap_encryption', 'ssl'));
            $this->enabled = (bool) $settings->get('imap_enabled', '1');
        }
    }

    /**
     * Test connection to IMAP server.
     */
    public function testConnection(): array
    {
        if (empty($this->host) || empty($this->username)) {
            return ['success' => false, 'message' => 'IMAP host and username must be configured.'];
        }

        try {
            $fp = $this->connect();
            if (!$fp) {
                return ['success' => false, 'message' => 'Could not open socket connection to IMAP server.'];
            }

            $loginResp = $this->sendCmd($fp, "A001 LOGIN {$this->username} {$this->password}");
            $this->sendCmd($fp, "A002 LOGOUT");
            fclose($fp);

            $loginOutput = implode(' ', $loginResp);
            if (str_contains($loginOutput, 'A001 OK')) {
                return ['success' => true, 'message' => 'IMAP connection and login successful!'];
            } else {
                return ['success' => false, 'message' => 'IMAP login failed: ' . $loginOutput];
            }
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'IMAP connection error: ' . $e->getMessage()];
        }
    }

    /**
     * Fetch new incoming emails from IMAP inbox and save to database.
     */
    public function fetchNewEmails(): int
    {
        if (!$this->enabled || empty($this->host) || empty($this->username)) {
            return 0;
        }

        $fp = $this->connect();
        if (!$fp) {
            return 0;
        }

        $loginResp = $this->sendCmd($fp, "A001 LOGIN {$this->username} {$this->password}");
        if (!str_contains(implode(' ', $loginResp), 'A001 OK')) {
            fclose($fp);
            return 0;
        }

        $selectResp = $this->sendCmd($fp, "A002 SELECT INBOX");
        if (!str_contains(implode(' ', $selectResp), 'A002 OK')) {
            $this->sendCmd($fp, "A003 LOGOUT");
            fclose($fp);
            return 0;
        }

        // Fetch headers of messages
        $headersResp = $this->sendCmd($fp, "A003 FETCH 1:* (UID FLAGS BODY.PEEK[HEADER.FIELDS (DATE FROM TO SUBJECT MESSAGE-ID)])");
        
        $messages = $this->parseHeaderResponse($headersResp);
        $newCount = 0;

        foreach ($messages as $msg) {
            $msgId = $msg['message_id'] ?? null;
            $uid = $msg['uid'] ?? null;

            // Identifier key to prevent duplicates
            $uniqueId = $msgId ? $msgId : "uid-{$uid}-" . md5(($msg['from'] ?? '') . ($msg['subject'] ?? ''));

            if (EmailMessage::where('message_id', $uniqueId)->exists()) {
                continue;
            }

            // Fetch email body using UID
            $uid = $msg['uid'];
            $bodyResp = $this->sendCmd($fp, "A004 UID FETCH {$uid} (BODY.PEEK[])");
            $parsed = $this->parseBodyAndAttachments($bodyResp);
            $bodyText = $parsed['body'];
            $attachmentsList = $parsed['attachments'];

            // Clean up sender email
            $rawFrom = $msg['from'] ?? '';
            $fromEmail = $this->extractEmailAddress($rawFrom);
            $fromName = $this->extractEmailName($rawFrom) ?: $fromEmail;
            $rawTo = $msg['to'] ?? '';
            $toEmail = $this->extractEmailAddress($rawTo);
            $subject = $msg['subject'] ?? 'No Subject';

            // Check if sender is system/self (skip self-sent duplicates if already in DB as outgoing)
            if (strtolower($fromEmail) === strtolower($this->username) && EmailMessage::where('subject', $subject)->where('direction', 'outgoing')->where('created_at', '>=', now()->subMinutes(10))->exists()) {
                // Skip importing self-sent copy
                continue;
            }

            // Match with student record
            $student = StudentInfo::where('EMAIL', $fromEmail)->first();
            $libraryId = $student ? $student->LIBRARY_ID : null;

            // Fallback: match by subject/body for library ID format (e.g. NAAP-...)
            if (!$libraryId) {
                if (preg_match('/[A-Z0-9]{4,15}/i', $subject, $m)) {
                    $possibleStudent = StudentInfo::where('LIBRARY_ID', $m[0])->first();
                    if ($possibleStudent) {
                        $libraryId = $possibleStudent->LIBRARY_ID;
                    }
                }
            }

            // Ensure library_id foreign key exists in student_info, otherwise set null
            if ($libraryId && !StudentInfo::where('LIBRARY_ID', $libraryId)->exists()) {
                $libraryId = null;
            }

            try {
                // Save incoming email message
                EmailMessage::create([
                    'message_id'  => $uniqueId,
                    'library_id'  => $libraryId,
                    'direction'   => 'incoming',
                    'from_email'  => $this->sanitizeUtf8($fromEmail),
                    'to_email'    => $this->sanitizeUtf8($toEmail ?: $this->username),
                    'subject'     => $this->sanitizeUtf8($subject),
                    'body'        => $this->sanitizeUtf8($bodyText),
                    'attachments' => count($attachmentsList) > 0 ? $attachmentsList : null,
                    'sent_to'     => $this->sanitizeUtf8($toEmail ?: $this->username),
                    'is_read'     => false,
                ]);

                // Create notification alert
                $displayName = $student ? trim($student->FN . ' ' . $student->LN) : ($fromName ?: $fromEmail);
                SystemNotification::create([
                    'type'    => 'email',
                    'title'   => $this->sanitizeUtf8("New Email from {$displayName}"),
                    'message' => $this->sanitizeUtf8($subject),
                    'link'    => '/emails',
                ]);

                $newCount++;
            } catch (\Exception $e) {
                Log::error("Failed to import email UID {$uid}: " . $e->getMessage());
            }
        }

        $this->sendCmd($fp, "A005 LOGOUT");
        fclose($fp);

        return $newCount;
    }

    /**
     * Open SSL stream socket to IMAP server.
     */
    protected function connect()
    {
        $prefix = ($this->encryption === 'ssl') ? 'ssl://' : (($this->encryption === 'tls') ? 'tls://' : '');
        $remote = $prefix . $this->host;

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ],
        ]);

        $fp = @stream_socket_client($remote . ':' . $this->port, $errno, $errstr, 12, STREAM_CLIENT_CONNECT, $context);
        if ($fp) {
            fgets($fp); // Read server greeting line
        }

        return $fp;
    }

    /**
     * Send command and return output lines.
     */
    protected function sendCmd($fp, string $cmd): array
    {
        fwrite($fp, $cmd . "\r\n");
        $lines = [];
        $tag = explode(' ', $cmd)[0];

        while ($line = fgets($fp)) {
            $lines[] = $line;
            if (preg_match('/^' . preg_quote($tag, '/') . '\s+(OK|NO|BAD)/i', $line)) {
                break;
            }
        }

        return $lines;
    }

    /**
     * Parse header response lines into message array.
     */
    protected function parseHeaderResponse(array $lines): array
    {
        $messages = [];
        $currentMsg = null;

        foreach ($lines as $line) {
            if (preg_match('/^\*\s+(\d+)\s+FETCH\s+\(UID\s+(\d+)/i', $line, $m)) {
                if ($currentMsg) {
                    $messages[] = $currentMsg;
                }
                $currentMsg = [
                    'num' => (int) $m[1],
                    'uid' => (int) $m[2],
                    'subject' => '',
                    'from' => '',
                    'to' => '',
                    'date' => '',
                    'message_id' => '',
                ];
            } elseif ($currentMsg) {
                if (preg_match('/^Subject:\s*(.*)$/i', $line, $m)) {
                    $currentMsg['subject'] = trim($this->decodeMimeHeader($m[1]));
                } elseif (preg_match('/^From:\s*(.*)$/i', $line, $m)) {
                    $currentMsg['from'] = trim($this->decodeMimeHeader($m[1]));
                } elseif (preg_match('/^To:\s*(.*)$/i', $line, $m)) {
                    $currentMsg['to'] = trim($this->decodeMimeHeader($m[1]));
                } elseif (preg_match('/^Date:\s*(.*)$/i', $line, $m)) {
                    $currentMsg['date'] = trim($m[1]);
                } elseif (preg_match('/^Message-ID:\s*<(.*)>/i', $line, $m)) {
                    $currentMsg['message_id'] = trim($m[1]);
                } elseif (preg_match('/^Message-ID:\s*(.*)$/i', $line, $m)) {
                    $currentMsg['message_id'] = trim($m[1], " <>");
                }
            }
        }

        if ($currentMsg) {
            $messages[] = $currentMsg;
        }

        return $messages;
    }

    /**
     * Parse body response into clean HTML/Text string and extracted attachments.
     */
    /**
     * Parse body response into clean HTML/Text string and extracted attachments.
     */
    protected function parseBodyAndAttachments(array $lines): array
    {
        $raw = implode('', $lines);

        // Strip IMAP FETCH protocol wrapper lines
        $raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(BODY\[TEXT\]\s+\{\d+\}\r?\n/i', '', $raw);
        $raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(BODY\[\]\s+\{\d+\}\r?\n/i', '', $raw);
        $raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(UID\s+\d+.*?\r?\n/i', '', $raw);
        $raw = preg_replace('/\r?\n\)?\s*A\d+\s+OK.*$/is', '', $raw);

        \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory('attachments');

        $attachments = [];
        $htmlParts = [];
        $plainParts = [];

        $this->parseMimePartRecursive($raw, $attachments, $htmlParts, $plainParts);

        $html = implode('<br>', array_filter(array_map('trim', $htmlParts)));
        $plain = implode("\n", array_filter(array_map('trim', $plainParts)));

        $final = '';
        if (!empty($html)) {
            $final = $html;
        } elseif (!empty($plain)) {
            $final = nl2br(e($plain));
        } else {
            // Strip any raw RFC 822 email header blocks if present
            $final = preg_replace('/^[a-zA-Z0-9\-]+:\s*.*$(\r?\n)?/m', '', $raw);
        }

        // Replace CID embedded images with saved attachment URLs if applicable
        foreach ($attachments as $att) {
            if (!empty($att['content_id'])) {
                $final = str_replace('cid:' . $att['content_id'], $att['url'], $final);
            }
        }

        // Strip leftover headers and protocol noise
        $final = preg_replace('/(Arc-Authentication-Results|Received|DKIM-Signature|X-Lms-[a-zA-Z0-9\-]+|Content-Disposition|Content-ID|Content-Type|Content-Transfer-Encoding):\s*[^\r\n]*/i', '', $final);
        $final = preg_replace('/--[a-zA-Z0-9_=\-\.\+]+(--)?/i', '', $final);
        $final = preg_replace('/\/9j\/4[A-Za-z0-9\+\/\r\n=]{100,}/', '', $final);
        $final = preg_replace('/UID\s+\d+.*$/i', '', $final);
        $final = preg_replace('/A\d+\s+OK.*$/i', '', $final);

        $clean = $this->stripQuotedReplies($final);

        // Remove content_id key from returned attachment objects to keep schema simple
        $cleanAttachments = array_map(function ($att) {
            unset($att['content_id']);
            return $att;
        }, $attachments);

        return [
            'body' => trim($clean) ?: (trim($final) ?: 'Empty message body.'),
            'attachments' => $cleanAttachments,
        ];
    }

    /**
     * Recursively parse MIME message parts.
     */
    protected function parseMimePartRecursive(string $partRaw, array &$attachments, array &$htmlParts, array &$plainParts): void
    {
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

        // Check for boundary in multipart content
        if (preg_match('/boundary="?([^"\r\n;]+)"?/i', $contentType, $bm)) {
            $boundary = trim($bm[1]);
            $subParts = explode('--' . $boundary, $bodyRaw);
            foreach ($subParts as $subPart) {
                $subPart = trim($subPart);
                if ($subPart === '' || $subPart === '--') continue;
                $this->parseMimePartRecursive($subPart, $attachments, $htmlParts, $plainParts);
            }
            return;
        }

        // Decode content according to transfer encoding
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

                \Illuminate\Support\Facades\Storage::disk('public')->put('attachments/' . $storedName, $decoded);

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

    /**
     * Strip quoted reply history (e.g. "On ... wrote:", <blockquote>, gmail_quote).
     */
    public function stripQuotedReplies(string $body): string
    {
        if (str_contains($body, '<')) {
            $body = preg_replace('/<blockquote[^>]*>.*?<\/blockquote>/is', '', $body);
            $body = preg_replace('/<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>.*?<\/div>/is', '', $body);
            $body = preg_replace('/<div[^>]*class="[^"]*gmail_attr[^"]*"[^>]*>.*?<\/div>/is', '', $body);
        }

        $body = preg_replace('/On\s+[A-Za-z]{3},\s+[A-Za-z]{3}\s+\d+.*?wrote:.*/is', '', $body);
        $body = preg_replace('/On\s+.*?\s+wrote:\s*.*/is', '', $body);
        $body = preg_replace('/-----Original Message-----.*/is', '', $body);
        $body = preg_replace('/^>.*$/m', '', $body);

        $body = preg_replace('/<div>\s*(<br\s*\/?>)?\s*<\/div>/i', '', $body);
        $body = preg_replace('/(<br\s*\/?>\s*)+$/i', '', trim($body));

        return trim($body);
    }

    /**
     * Extract email address from RFC 822 format (e.g. "John" <john@example.com> -> john@example.com).
     */
    protected function extractEmailAddress(string $raw): string
    {
        if (preg_match('/<([^>]+)>/', $raw, $m)) {
            return trim($m[1]);
        }
        return trim($raw);
    }

    /**
     * Extract sender display name.
     */
    protected function extractEmailName(string $raw): string
    {
        if (preg_match('/^"?([^"<]+)"?\s*</', $raw, $m)) {
            return trim($m[1]);
        }
        return '';
    }

    /**
     * Decode MIME header words (=?UTF-8?B?...?= or =?UTF-8?Q?...?=)
     */
    protected function decodeMimeHeader(string $text): string
    {
        if (function_exists('mb_decode_mimeheader')) {
            return mb_decode_mimeheader($text);
        }
        return iconv_mime_decode($text, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
    }

    /**
     * Sanitize string to clean UTF-8 for database persistence.
     */
    protected function sanitizeUtf8(?string $str): string
    {
        if ($str === null || $str === '') {
            return '';
        }
        if (function_exists('mb_scrub')) {
            $str = mb_scrub($str, 'UTF-8');
        } elseif (function_exists('mb_convert_encoding')) {
            $str = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
        }
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $str) ?: '';
    }
}
