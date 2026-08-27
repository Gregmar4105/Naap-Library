<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\EmailMessage;
use App\Services\ImapService;

$imap = new ImapService();
$reflected = new ReflectionClass($imap);

$connect = $reflected->getMethod('connect');
$connect->setAccessible(true);
$sendCmd = $reflected->getMethod('sendCmd');
$sendCmd->setAccessible(true);
$parseHeaderResponse = $reflected->getMethod('parseHeaderResponse');
$parseHeaderResponse->setAccessible(true);
$parseBodyAndAttachments = $reflected->getMethod('parseBodyAndAttachments');
$parseBodyAndAttachments->setAccessible(true);

$fp = $connect->invoke($imap);
if (!$fp) {
    echo "Could not connect to IMAP server.\n";
    exit(1);
}

$sendCmd->invoke($imap, $fp, "A001 LOGIN naaplibrary@larable.dev 3BgoCA1F0mU26cfR");
$sendCmd->invoke($imap, $fp, "A002 SELECT INBOX");

$headersResp = $sendCmd->invoke($imap, $fp, "A003 FETCH 1:* (UID FLAGS BODY.PEEK[HEADER.FIELDS (DATE FROM TO SUBJECT MESSAGE-ID)])");
$messages = $parseHeaderResponse->invoke($imap, $headersResp);

echo "Found " . count($messages) . " messages in INBOX.\n";

foreach ($messages as $msg) {
    $uid = $msg['uid'];
    $bodyResp = $sendCmd->invoke($imap, $fp, "A004 UID FETCH {$uid} (BODY.PEEK[])");
    $parsed = $parseBodyAndAttachments->invoke($imap, $bodyResp);

    $msgId = $msg['message_id'] ?? null;
    $uniqueId = $msgId ? $msgId : "uid-{$uid}-" . md5(($msg['from'] ?? '') . ($msg['subject'] ?? ''));

    $dbMsg = EmailMessage::where('message_id', $uniqueId)->first();
    if (!$dbMsg) {
        $dbMsg = EmailMessage::where('subject', $msg['subject'] ?? '')->where('direction', 'incoming')->latest()->first();
    }

    if ($dbMsg) {
        $dbMsg->body = $parsed['body'];
        $dbMsg->attachments = count($parsed['attachments']) > 0 ? $parsed['attachments'] : null;
        $dbMsg->save();

        echo "Updated DB Message ID {$dbMsg->id} (Subject: {$dbMsg->subject}) with " . count($parsed['attachments']) . " attachments.\n";
    }
}

$sendCmd->invoke($imap, $fp, "A005 LOGOUT");
fclose($fp);

echo "Database message cleanup complete!\n";
