<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\ImapService;

echo "Testing ImapService...\n";
$service = new ImapService();

$test = $service->testConnection();
echo "Test connection result: " . json_encode($test) . "\n";

echo "Fetching new emails...\n";
$count = $service->fetchNewEmails();
echo "Fetched $count new emails.\n";
