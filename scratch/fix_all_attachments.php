<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\File;

$privatePublic = storage_path('app/private/public/attachments');
$publicStorage = storage_path('app/public/attachments');

if (!File::exists($publicStorage)) {
    File::makeDirectory($publicStorage, 0755, true);
}

if (File::exists($privatePublic)) {
    foreach (File::files($privatePublic) as $f) {
        $dest = $publicStorage . '/' . $f->getFilename();
        File::copy($f->getRealPath(), $dest);
        echo "Copied {$f->getFilename()} to {$dest}\n";
    }
}

echo "Public disk attachments count: " . count(File::files($publicStorage)) . "\n";
foreach (File::files($publicStorage) as $f) {
    $webPath = public_path('storage/attachments/' . $f->getFilename());
    echo "Web file: {$webPath} | Exists: " . (file_exists($webPath) ? 'YES' : 'NO') . " (" . filesize($webPath) . " bytes)\n";
}
