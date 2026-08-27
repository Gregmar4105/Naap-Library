<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\EmailMessage;

$msgs = EmailMessage::where('from_email', 'djkhalid3m@gmail.com')->orWhere('to_email', 'djkhalid3m@gmail.com')->get();
foreach ($msgs as $m) {
    echo "ID: {$m->id}\n";
    echo "Subject: {$m->subject}\n";
    echo "Attachments raw: " . json_encode($m->attachments) . "\n";
    echo "Body snippet: " . substr($m->body, 0, 500) . "\n";
    echo "-----------------------------\n";
}
