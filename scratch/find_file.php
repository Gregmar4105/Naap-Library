<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;

echo "Storage disk 'public' root: " . config('filesystems.disks.public.root') . "\n";

$allStorageFiles = Storage::allFiles();
echo "All files in default storage:\n";
print_r($allStorageFiles);

$allPublicFiles = Storage::disk('public')->allFiles();
echo "\nAll files in 'public' disk:\n";
print_r($allPublicFiles);
