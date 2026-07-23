<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $students = DB::table('tbl_student_info')->select('LIBRARY_ID')->limit(5)->get();
    echo "Found " . count($students) . " students:\n";
    foreach ($students as $student) {
        $id = $student->LIBRARY_ID;
        $phpHash = hash('sha256', $id);
        
        // Query using MySQL SHA2
        $mysqlHashRow = DB::selectOne("SELECT SHA2(?, 256) as hash", [$id]);
        $mysqlHash = $mysqlHashRow ? $mysqlHashRow->hash : 'FAILED';
        
        echo "ID: '$id'\n";
        echo "  PHP Hash:   $phpHash\n";
        echo "  MySQL Hash: $mysqlHash\n";
        
        // Test Laravel query
        $found = DB::table('tbl_student_info')->whereRaw('SHA2(LIBRARY_ID, 256) = ?', [$phpHash])->first();
        echo "  Laravel whereRaw match: " . ($found ? "SUCCESS ({$found->LIBRARY_ID})" : "FAILED") . "\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
