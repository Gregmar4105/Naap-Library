<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\StudentInfo;
use App\Services\AccessService;
use App\Services\StudentService;
use Carbon\Carbon;

echo "=== STARTING ACCURATE TWIN DETECTION TESTS ===\n\n";

$studentService = app(StudentService::class);
$accessService = app(AccessService::class);
$today = Carbon::now('Asia/Manila')->format('Y-m-d');
$nowTime = Carbon::now('Asia/Manila')->format('H:i:s');

// 1. Create 2 Separate Students with same last name (e.g., Andrei Moreno & Dus Moreno) - NOT TWINS
$user1_Id = 'TEST-USER-1-' . time();
$user2_Id = 'TEST-USER-2-' . time();

$user1 = StudentInfo::create([
    'LIBRARY_ID' => $user1_Id,
    'STUDENT_NUMBER' => 'SN-' . rand(10000, 99999),
    'FN' => 'Andrei',
    'MN' => '',
    'LN' => 'Moreno',
    'REGISTERED_ON' => $today,
    'ID_STATUS' => 'Active',
    'ID_STATUS_DATE' => $today,
]);

$user2 = StudentInfo::create([
    'LIBRARY_ID' => $user2_Id,
    'STUDENT_NUMBER' => 'SN-' . rand(10000, 99999),
    'FN' => 'Dus',
    'MN' => '',
    'LN' => 'Moreno',
    'REGISTERED_ON' => $today,
    'ID_STATUS' => 'Active',
    'ID_STATUS_DATE' => $today,
]);

echo "[Test 1] Verifying two separate users with same surname are NOT flagged as twins...\n";
// Log User 2 into the library (active session)
DB::table('tbl_student_logs')->insert([
    'LIBRARY_ID' => $user2_Id,
    'LOG_TIME' => $nowTime,
    'LOG_DATE' => $today,
    'LOG_SESSION' => 'IN',
    'LOG_METHOD' => 'qr'
]);

$detectedTwinForUser1 = $accessService->findActiveTwin($user1_Id, [], $today);

if ($detectedTwinForUser1 === null) {
    echo "✓ PASS: Separate user Andrei Moreno is NOT falsely flagged as twin of Dus Moreno!\n";
} else {
    echo "✗ FAIL: Separate user was falsely detected as a twin!\n";
    exit(1);
}

echo "\n[Test 2] Verifying explicit twin linkage works correctly when confirmed...\n";
$studentService->linkTwin($user1_Id, $user2_Id);
$user1 = $user1->fresh();
$user2 = $user2->fresh();

$detectedConfirmedTwin = $accessService->findActiveTwin($user1_Id, [], $today);
if ($detectedConfirmedTwin && $detectedConfirmedTwin->LIBRARY_ID === $user2_Id) {
    echo "✓ PASS: Confirmed explicitly linked twin is correctly detected when active!\n";
} else {
    echo "✗ FAIL: Explicitly linked twin was not detected!\n";
    exit(1);
}

// Cleanup test records
StudentInfo::whereIn('LIBRARY_ID', [$user1_Id, $user2_Id])->delete();
DB::table('tbl_student_logs')->whereIn('LIBRARY_ID', [$user1_Id, $user2_Id])->delete();

echo "\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n";
