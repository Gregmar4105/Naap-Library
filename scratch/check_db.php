<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\App\Models\EmailMessage::truncate();
\App\Models\SystemNotification::truncate();

$count = (new \App\Services\ImapService())->fetchNewEmails();
echo "Fetched $count emails.\n\n";

echo "Email messages count: " . \App\Models\EmailMessage::count() . "\n";
foreach (\App\Models\EmailMessage::all() as $m) {
    echo "ID: {$m->id} | MsgID: {$m->message_id} | Dir: {$m->direction} | From: {$m->from_email} | Subj: {$m->subject}\n";
}
