<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (\App\Models\EmailMessage::all() as $m) {
    echo "ID: {$m->id} | Dir: {$m->direction} | Time PST: " . $m->created_at->timezone('Asia/Manila')->format('h:i A') . "\n";
    echo "Subj: {$m->subject}\n";
    echo "Body: " . trim(strip_tags($m->body)) . "\n\n";
}
