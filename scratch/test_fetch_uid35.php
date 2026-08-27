<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\ImapService;
use App\Models\EmailMessage;

$msgs = EmailMessage::where('from_email', 'djkhalid3m@gmail.com')->orWhere('to_email', 'djkhalid3m@gmail.com')->latest()->get();
foreach ($msgs as $m) {
    echo "ID: {$m->id} | Direction: {$m->direction} | Subject: {$m->subject}\n";
    echo "Attachments: " . json_encode($m->attachments) . "\n";
    echo "Body:\n" . $m->body . "\n";
    echo "=========================================\n";
}
