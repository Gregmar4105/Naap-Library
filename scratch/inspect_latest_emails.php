<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$messages = \App\Models\EmailMessage::latest()->take(5)->get();
foreach ($messages as $m) {
    echo "ID: {$m->id}\n";
    echo "From: {$m->from_email}\n";
    echo "Subject: {$m->subject}\n";
    echo "Attachments: " . json_encode($m->attachments) . "\n";
    echo "Body length: " . strlen($m->body) . "\n";
    echo "Body snippet: " . substr($m->body, 0, 300) . "\n";
    echo "---------------------------------------------------------\n";
}
