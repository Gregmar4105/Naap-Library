<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$urlPath = public_path('storage/attachments/attach_1785373365_6a6aa2b5bd464.jpg');
echo "File path: {$urlPath}\n";
echo "Exists on disk: " . (file_exists($urlPath) ? 'YES' : 'NO') . "\n";
echo "File size: " . (file_exists($urlPath) ? filesize($urlPath) : 0) . " bytes\n";
