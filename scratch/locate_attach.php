<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$dir = storage_path();
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
foreach ($iterator as $file) {
    if ($file->isFile() && str_contains($file->getFilename(), 'attach_')) {
        echo "Found: " . $file->getPathname() . " (" . filesize($file->getPathname()) . " bytes)\n";
    }
}
