<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StudentInfo;

foreach (StudentInfo::all() as $s) {
    echo "ID: {$s->LIBRARY_ID} | Name: {$s->FN} {$s->LN} | TwinID: {$s->TWIN_LIBRARY_ID} | IsTwin: " . ($s->IS_TWIN ? '1' : '0') . "\n";
}
