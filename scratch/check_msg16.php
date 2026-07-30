<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$msg = \App\Models\EmailMessage::find(16);
echo "Message 16 attachments raw: " . json_encode($msg->attachments) . "\n";

foreach ($msg->attachments as $att) {
    $relUrl = $att['url'];
    echo "Url: {$relUrl}\n";
    $diskPath = storage_path('app/public/' . str_replace('/storage/', '', $relUrl));
    echo "Disk path ({$diskPath}): " . (file_exists($diskPath) ? "EXISTS (size: " . filesize($diskPath) . ")" : "DOES NOT EXIST") . "\n";

    $publicPath = public_path(ltrim($relUrl, '/'));
    echo "Public path ({$publicPath}): " . (file_exists($publicPath) ? "EXISTS" : "DOES NOT EXIST") . "\n";
}

echo "\nCheck symlink or public/storage:\n";
echo "public/storage link exists: " . (is_link(public_path('storage')) || file_exists(public_path('storage')) ? "YES" : "NO") . "\n";
