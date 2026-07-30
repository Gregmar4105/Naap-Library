<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$googleService = app(App\Services\GoogleFormsService::class);
$reflector = new ReflectionClass($googleService);
$method = $reflector->getMethod('getAccessToken');
$method->setAccessible(true);
$token = $method->invoke($googleService);

$folderId = '1RMlZZmFNTKdP8BYmNv53gdES4-FgCU7_';

// Test copying a form template
// Let's test if files.copy works when copying any publicly viewable form
$testTemplateId = '1FAIpQLSc_EXAMPLE'; // replace with actual form id

$res = Http::withToken($token)
    ->post("https://www.googleapis.com/drive/v3/files/{$testTemplateId}/copy?supportsAllDrives=true", [
        'name' => 'Auto Copy Test',
        'parents' => [$folderId],
    ]);

echo "Copy Status: " . $res->status() . "\n";
echo "Copy Body: " . $res->body() . "\n";
