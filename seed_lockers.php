<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\RfidInfo;

// Clear existing to avoid unique constraint issues if any
RfidInfo::truncate();

for($i=1; $i<=12; $i++) {
    RfidInfo::create([
        'RFID_NUMBER' => 'KEY-' . str_pad($i, 3, '0', STR_PAD_LEFT),
        'LOCKER_NUMBER' => (string)$i,
        'IS_AVAILABLE' => 'Yes'
    ]);
}

echo "Seeded 12 lockers successfully.\n";
