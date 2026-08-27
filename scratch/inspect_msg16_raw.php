<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$msg = \App\Models\EmailMessage::find(16);
if ($msg) {
    echo "Message 16 Body (first 1000 chars):\n";
    echo substr($msg->body, 0, 1000) . "\n";
}
