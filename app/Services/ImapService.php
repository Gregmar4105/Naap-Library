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
            $bodyText = $this->parseBodyResponse($bodyResp);

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

            // Save incoming email message
            EmailMessage::create([
                'message_id' => $uniqueId,
                'library_id' => $libraryId,
                'direction'  => 'incoming',
                'from_email' => $fromEmail,
                'to_email'   => $toEmail ?: $this->username,
                'subject'    => $subject,
                'body'       => $bodyText,
                'sent_to'    => $toEmail ?: $this->username,
                'is_read'    => false,
            ]);

            // Create notification alert
            $displayName = $student ? trim($student->FN . ' ' . $student->LN) : ($fromName ?: $fromEmail);
            SystemNotification::create([
                'type'    => 'email',
                'title'   => "New Email from {$displayName}",
                'message' => $subject,
                'link'    => '/emails',
            ]);

            $newCount++;
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
     * Parse body response into clean HTML/Text string.
     */
    protected function parseBodyResponse(array $lines): string
    {
        $raw = implode('', $lines);

        // Strip IMAP FETCH protocol wrapper lines
        $raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(BODY\[TEXT\]\s+\{\d+\}\r?\n/i', '', $raw);
        $raw = preg_replace('/^\*\s+\d+\s+FETCH\s+\(BODY\[\]\s+\{\d+\}\r?\n/i', '', $raw);
        $raw = preg_replace('/\r?\n\)\r?\nA\d+\s+OK.*$/is', '', $raw);

        // 1. Detect boundary string if present
        $boundary = null;
        if (preg_match('/boundary="?([^"\r\n;]+)"?/i', $raw, $m)) {
            $boundary = trim($m[1]);
        } elseif (preg_match('/^--([a-zA-Z0-9_=\-\.\+]+)/m', $raw, $m)) {
            $boundary = trim($m[1]);
        }

        $plainPart = '';
        $htmlPart = '';

        if ($boundary) {
            // Split by boundary
            $parts = explode('--' . $boundary, $raw);
            foreach ($parts as $part) {
                $part = ltrim($part);
                if (trim($part) === '' || trim($part) === '--') continue;

                // Separate headers and content inside this MIME part
                $subParts = preg_split('/\r?\n\r?\n/', $part, 2);
                if (count($subParts) < 2) continue;

                $headers = $subParts[0];
                $content = $subParts[1];

                // Strip trailing boundary markers
                $content = preg_replace('/--$/', '', trim($content));

                // Check Content-Transfer-Encoding for this part
                if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $headers)) {
                    $content = quoted_printable_decode($content);
                } elseif (preg_match('/Content-Transfer-Encoding:\s*base64/i', $headers)) {
                    $content = base64_decode(trim($content)) ?: $content;
                }

                // Check Content-Type
                if (preg_match('/Content-Type:\s*text\/html/i', $headers)) {
                    $htmlPart = $content;
                } elseif (preg_match('/Content-Type:\s*text\/plain/i', $headers)) {
                    $plainPart = $content;
                }
            }
        }

        $final = '';
        if (!empty($htmlPart)) {
            $final = $htmlPart;
        } elseif (!empty($plainPart)) {
            $final = nl2br(e(trim($plainPart)));
        } else {
            if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $raw)) {
                $raw = quoted_printable_decode($raw);
            }
            $parts = preg_split('/\r?\n\r?\n/', $raw, 2);
            if (count($parts) === 2 && (str_contains($parts[0], 'Content-Type:') || str_contains($parts[0], 'Content-Transfer-Encoding:'))) {
                $raw = $parts[1];
            }
            $final = !str_contains($raw, '<html') && !str_contains($raw, '<div') && !str_contains($raw, '<p') 
                ? nl2br(e(trim($raw))) 
                : $raw;
        }

        // Clean up any remaining boundary lines or MIME header artifacts
        $final = preg_replace('/--[a-zA-Z0-9_=\-\.\+]+(--)?/i', '', $final);
        $final = preg_replace('/Content-Type:[^\r\n]*/i', '', $final);
        $final = preg_replace('/Content-Transfer-Encoding:[^\r\n]*/i', '', $final);
        $final = preg_replace('/charset="?[^"\r\n]*"?/i', '', $final);

        $clean = $this->stripQuotedReplies($final);
        return trim($clean) ?: (trim($final) ?: 'Empty message body.');
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
}
