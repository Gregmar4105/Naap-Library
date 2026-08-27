<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

Storage::disk('public')->makeDirectory('attachments');

// Find files in storage/app/public/attachments
$wrongPath = storage_path('app/public/attachments');
$correctPath = storage_path('app/public/attachments');

if (File::exists($wrongPath)) {
    $files = File::files($wrongPath);
    foreach ($files as $f) {
        $dest = $correctPath . '/' . $f->getFilename();
        File::move($f->getRealPath(), $dest);
        echo "Moved {$f->getFilename()} to {$dest}\n";
    }
}

echo "Contents of public disk attachments:\n";
print_r(Storage::disk('public')->files('attachments'));
