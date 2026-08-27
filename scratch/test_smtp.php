<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Models\Setting;

echo "Testing SMTP send...\n";

config([
    'mail.mailers.smtp.host'     => 'smtp.larksuite.com',
    'mail.mailers.smtp.port'     => 465,
    'mail.mailers.smtp.scheme'   => 'smtps',
    'mail.mailers.smtp.username' => 'naaplibrary@larable.dev',
    'mail.mailers.smtp.password' => '3BgoCA1F0mU26cfR',
    'mail.from.address'          => 'naaplibrary@larable.dev',
    'mail.from.name'             => 'NAAP Library',
    'mail.default'               => 'smtp',
]);

app('mail.manager')->purge('smtp');

try {
    Mail::raw("Test email from NAAP Library system at " . date('Y-m-d H:i:s'), function ($message) {
        $message->to('naaplibrary@larable.dev')
                ->subject('Test SMTP Email - Lark Mail Integration');
    });
    echo "SMTP Send Success!\n";
} catch (\Exception $e) {
    echo "SMTP Send Error: " . $e->getMessage() . "\n";
}
