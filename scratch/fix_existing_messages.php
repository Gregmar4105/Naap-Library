`<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\EmailMessage;
use Illuminate\Support\Facades\Storage;

Storage::makeDirectory('public/attachments');

$messages = EmailMessage::all();
$fixedCount = 0;

foreach ($messages as $msg) {
    $body = $msg->body;
    $attachments = is_array($msg->attachments) ? $msg->attachments : (json_decode($msg->attachments, true) ?: []);
    $modified = false;

    // Check for inline base64 images or Content-Disposition base64 blobs in body
    if (preg_match_all('/Content-Disposition:\s*inline;?\s*filename="?([^"\r\n]+)"?\s*Content-ID:\s*X-Attachment-Id:\s*([^\r\n]+)\s*([A-Za-z0-9\+\/\r\n=]{100,})/i', $body, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $filename = trim($match[1]);
            $cid = trim($match[2]);
            $base64Data = preg_replace('/\s+/', '', $match[3]);
            $binary = base64_decode($base64Data);

            if ($binary) {
                $ext = pathinfo($filename, PATHINFO_EXTENSION) ?: 'jpg';
                $storedName = 'attach_' . time() . '_' . uniqid() . '.' . $ext;
                $path = 'public/attachments/' . $storedName;
                Storage::put($path, $binary);

                $url = '/storage/attachments/' . $storedName;
                $mime = 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);

                $attachments[] = [
                    'name' => $filename,
                    'url'  => $url,
                    'mime' => $mime,
                    'type' => 'image',
                    'size' => strlen($binary),
                ];

                // Replace cid or inline text in body
                $body = str_replace('cid:' . $cid, $url, $body);
                // Strip out the raw base64 block
                $body = str_replace($match[0], '', $body);
                $modified = true;
            }
        }
    }

    // Also check for raw base64 blocks without full Content-Disposition header
    if (preg_match('/\/9j\/4[A-Za-z0-9\+\/\r\n=]{100,}/', $body, $b64Match)) {
        $b64Str = preg_replace('/\s+/', '', $b64Match[0]);
        $binary = base64_decode($b64Str);
        if ($binary) {
            $storedName = 'attach_' . time() . '_' . uniqid() . '.jpg';
            Storage::put('public/attachments/' . $storedName, $binary);
            $url = '/storage/attachments/' . $storedName;

            $attachments[] = [
                'name' => 'Image_' . date('Ymd_His') . '.jpg',
                'url'  => $url,
                'mime' => 'image/jpeg',
                'type' => 'image',
                'size' => strlen($binary),
            ];

            // Replace cid or raw text
            $body = preg_replace('/<img[^>]*src="cid:[^"]*"[^>]*>/i', '<img src="' . $url . '" class="max-w-md rounded-lg shadow my-2" />', $body);
            $body = str_replace($b64Match[0], '', $body);
            $modified = true;
        }
    }

    if ($modified) {
        $msg->body = trim($body);
        $msg->attachments = json_encode($attachments);
        $msg->save();
        $fixedCount++;
        echo "Fixed message ID {$msg->id}! Saved " . count($attachments) . " attachment(s).\n";
    }
}

echo "Done! Total fixed: {$fixedCount}\n";
