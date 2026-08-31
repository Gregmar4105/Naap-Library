<?php

use App\Models\StudentInfo;
use App\Models\User;
use App\Services\LostIdService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('lost id report deactivates old profile and excludes deactivated duplicate from student list and id cards', function () {
    Storage::fake('public');
    $admin = User::factory()->create();
    $this->actingAs($admin);

    $oldStudent = StudentInfo::create([
        'LIBRARY_ID' => '26-00006',
        'STUDENT_NUMBER' => '12324MN-22126',
        'FN' => 'Juan',
        'LN' => 'Cruz',
        'COURSE' => 'BSAIT',
        'ID_STATUS' => 'Active',
        'REGISTERED_ON' => '2026-07-30',
    ]);

    $file = UploadedFile::fake()->create('affidavit.pdf', 100, 'application/pdf');

    /** @var LostIdService $lostIdService */
    $lostIdService = app(LostIdService::class);
    $result = $lostIdService->reportLostId([
        'old_library_id' => '26-00006',
        'location_lost' => 'Library Hallway',
        'description' => 'Left on table',
    ], $file);

    $newLibraryId = $result['new_library_id'];

    // Verify old student is deactivated and new student is active
    $this->assertDatabaseHas('tbl_student_info', [
        'LIBRARY_ID' => '26-00006',
        'ID_STATUS' => 'Deactivated',
    ]);

    $this->assertDatabaseHas('tbl_student_info', [
        'LIBRARY_ID' => $newLibraryId,
        'ID_STATUS' => 'Active',
    ]);

    // Verify /api/student-list-data excludes deactivated 26-00006 and includes 26-00007
    $listResponse = $this->getJson(route('api.student-list-data'));
    $listResponse->assertOk();
    $libraryIdsInList = collect($listResponse->json('data'))->pluck('LIBRARY_ID')->all();

    expect($libraryIdsInList)->toContain($newLibraryId);
    expect($libraryIdsInList)->not->toContain('26-00006');

    // Verify /id-cards excludes deactivated 26-00006 and includes 26-00007
    $cardsResponse = $this->get(route('id-cards.index'));
    $cardsResponse->assertOk();
    $cardsResponse->assertInertia(fn (Assert $page) => $page
        ->component('id-cards/index')
        ->where('students.data', fn ($students) => 
            collect($students)->pluck('LIBRARY_ID')->contains($newLibraryId) &&
            !collect($students)->pluck('LIBRARY_ID')->contains('26-00006')
        )
    );
});
