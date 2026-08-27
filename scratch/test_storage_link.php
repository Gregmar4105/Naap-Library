<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\EmailMessage;

echo "Public storage path: " . public_path('storage') . "\n";
echo "Storage link exists: " . (file_exists(public_path('storage')) ? 'YES' : 'NO') . "\n";
if (file_exists(public_path('storage'))) {
    echo "Is link: " . (is_link(public_path('storage')) ? 'YES' : 'NO') . "\n";
}

echo "\nStorage app public attachments:\n";
$files = glob(storage_path('app/public/attachments/*'));
foreach ($files as $f) {
    echo $f . " (" . filesize($f) . " bytes)\n";
}

echo "\nCheck Public storage attachments:\n";
$pubFiles = glob(public_path('storage/attachments/*'));
foreach ($pubFiles as $f) {
    echo $f . " (" . filesize($f) . " bytes)\n";
}

echo "\nLatest Email Messages Attachments:\n";
foreach (EmailMessage::latest()->limit(5)->get() as $m) {
    echo "ID: {$m->id} | Attachments: " . json_encode($m->attachments) . "\n";
}
