<?php

use App\Models\StudentInfo;
use App\Services\BarcodeService;
use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Models\StudentLog;

test('it generates QR code using SHA-256 hash of library ID', function () {
    $libraryId = '24-00001';
    $credentials = BarcodeService::generateStudentCredentialsImages($libraryId);

    expect($credentials)->toHaveKeys(['secret_key', 'qr_code', 'barcode']);
    expect($credentials['qr_code'])->toStartWith('data:image/png;base64,');
});

test('it can find a student by SHA-256 hash of library ID', function () {
    $libraryId = '24-00002';
    
    // Create the student in the database
    $student = StudentInfo::create([
        'LIBRARY_ID' => $libraryId,
        'STUDENT_NUMBER' => '2024-0002',
        'FN' => 'John',
        'LN' => 'Doe',
        'ID_STATUS' => 'Active',
    ]);

    $repo = app(StudentRepositoryInterface::class);

    // Search by exact library ID
    $foundDirect = $repo->findByLibraryId($libraryId);
    expect($foundDirect)->not->toBeNull();
    expect($foundDirect->LIBRARY_ID)->toBe($libraryId);

    // Search by SHA-256 hash
    $hash = hash('sha256', $libraryId);
    $foundHashed = $repo->findByLibraryId($hash);
    expect($foundHashed)->not->toBeNull();
    expect($foundHashed->LIBRARY_ID)->toBe($libraryId);
});

test('it can process login and logout using SHA-256 hash of library ID', function () {
    $libraryId = '24-00003';
    
    // Create the student in the database
    $student = StudentInfo::create([
        'LIBRARY_ID' => $libraryId,
        'STUDENT_NUMBER' => '2024-0003',
        'FN' => 'Jane',
        'LN' => 'Doe',
        'ID_STATUS' => 'Active',
    ]);

    $hash = hash('sha256', $libraryId);

    // Process Login with SHA-256 hash
    $response = $this->postJson(route('api.face-login'), [
        'library_id' => $hash,
        'method' => 'qr',
    ]);

    $response->assertOk();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('student.LIBRARY_ID', $libraryId);

    // Verify a student log was written with the real LIBRARY_ID (not the hash!)
    $latestLog = StudentLog::where('LIBRARY_ID', $libraryId)->first();
    expect($latestLog)->not->toBeNull();
    expect($latestLog->LIBRARY_ID)->toBe($libraryId);

    // Process Logout with SHA-256 hash
    $logoutResponse = $this->postJson(route('api.face-logout'), [
        'library_id' => $hash,
        'method' => 'qr',
    ]);

    $logoutResponse->assertOk();
    $logoutResponse->assertJsonPath('success', true);
    $logoutResponse->assertJsonPath('student.LIBRARY_ID', $libraryId);
});

test('it generates QR code using SHA-256 hash of student number', function () {
    $libraryId = '24-00004';
    $studentNumber = '2024-0004';

    // Create the student in the database
    $student = StudentInfo::create([
        'LIBRARY_ID' => $libraryId,
        'STUDENT_NUMBER' => $studentNumber,
        'FN' => 'Alex',
        'LN' => 'Smith',
        'ID_STATUS' => 'Active',
    ]);

    $credentials = BarcodeService::generateStudentCredentialsImages($libraryId);

    expect($credentials)->toHaveKeys(['secret_key', 'qr_code', 'barcode']);
    
    $decodedSecret = BarcodeService::decodeStudentSecret($credentials['secret_key']);
    expect($decodedSecret)->toBe($studentNumber);
});

test('it can process login and logout using SHA-256 hash of student number', function () {
    $libraryId = '24-00005';
    $studentNumber = '2024-0005';
    
    // Create the student in the database
    $student = StudentInfo::create([
        'LIBRARY_ID' => $libraryId,
        'STUDENT_NUMBER' => $studentNumber,
        'FN' => 'Emily',
        'LN' => 'Jones',
        'ID_STATUS' => 'Active',
    ]);

    $hash = hash('sha256', $studentNumber);

    // Process Login with SHA-256 hash of student number
    $response = $this->postJson(route('api.face-login'), [
        'library_id' => $hash,
        'method' => 'qr',
    ]);

    $response->assertOk();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('student.LIBRARY_ID', $libraryId);

    // Verify a student log was written with the real LIBRARY_ID
    $latestLog = StudentLog::where('LIBRARY_ID', $libraryId)->first();
    expect($latestLog)->not->toBeNull();
    expect($latestLog->LIBRARY_ID)->toBe($libraryId);

    // Process Logout with SHA-256 hash of student number
    $logoutResponse = $this->postJson(route('api.face-logout'), [
        'library_id' => $hash,
        'method' => 'qr',
    ]);

    $logoutResponse->assertOk();
    $logoutResponse->assertJsonPath('success', true);
    $logoutResponse->assertJsonPath('student.LIBRARY_ID', $libraryId);
});
