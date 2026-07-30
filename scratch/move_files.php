<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\File;

$src = storage_path('app/public/attachments');
$dst = storage_path('app/public/attachments');

if (!File::exists($dst)) {
    File::makeDirectory($dst, 0755, true);
}

if (File::exists($src)) {
    foreach (File::files($src) as $f) {
        $target = $dst . '/' . $f->getFilename();
        File::copy($f->getRealPath(), $target);
        echo "Copied {$f->getFilename()} -> {$target}\n";
    }
}

echo "\nCheck target folder files:\n";
print_r(File::files($dst));
