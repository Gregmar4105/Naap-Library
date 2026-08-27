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
if ($fp) {
    $sendCmd->invoke($imap, $fp, "A001 LOGIN naaplibrary@larable.dev 3BgoCA1F0mU26cfR");
    $sendCmd->invoke($imap, $fp, "A002 SELECT INBOX");
    
    // Fetch last message body
    $lines = $sendCmd->invoke($imap, $fp, "A003 FETCH * (UID BODY[])");
    $sendCmd->invoke($imap, $fp, "A004 LOGOUT");
    fclose($fp);

    $raw = implode('', $lines);
    echo "Raw length: " . strlen($raw) . "\n";
    echo "Raw sample (first 1000 bytes):\n" . substr($raw, 0, 1000) . "\n";
} else {
    echo "Failed to connect to IMAP\n";
}
