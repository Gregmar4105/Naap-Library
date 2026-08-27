<?php

namespace App\Services;

use App\Repositories\Contracts\LostIdRepositoryInterface;
use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Notifications\SystemNotification;
use App\Models\StudentInfo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class LostIdService
{
    protected LostIdRepositoryInterface $lostIdRepository;
    protected StudentRepositoryInterface $studentRepository;

    public function __construct(
        LostIdRepositoryInterface $lostIdRepository,
        StudentRepositoryInterface $studentRepository
    ) {
        $this->lostIdRepository = $lostIdRepository;
        $this->studentRepository = $studentRepository;
    }

    public function reportLostId(array $data, UploadedFile $affidavitFile)
    {
        return DB::transaction(function () use ($data, $affidavitFile) {
            $oldStudent = StudentInfo::findOrFail($data['old_library_id']);
            
            // 1. Generate new Library ID
            $newLibraryId = $this->studentRepository->generateNextLibraryId();

            // 2. Handle Affidavit Upload
            $path = $affidavitFile->store('affidavits', 'public');

            // 3. Create a new student record
            $now = Carbon::now('Asia/Manila');
            $newStudent = $oldStudent->replicate();
            $newStudent->LIBRARY_ID = $newLibraryId;
            $newStudent->ID_STATUS = 'Active';
            $newStudent->ID_STATUS_DATE = $now->format('Y-m-d');
            $newStudent->REGISTERED_ON = $now->format('Y-m-d');
            $newStudent->STUDENT_RFID_NUMBER = null; // Reset RFID if lost
            $newStudent->FACE_EMBEDDING = $oldStudent->FACE_EMBEDDING; // Keep face data
            $newStudent->save();

            // 4. Update Old Record to Deactivated
            $oldStudent->ID_STATUS = 'Deactivated';
            $oldStudent->ID_STATUS_DATE = $now->format('Y-m-d');
            $oldStudent->save();

            // 5. Save the lost ID report
            $report = $this->lostIdRepository->createReport([
                'old_library_id' => $data['old_library_id'],
                'new_library_id' => $newLibraryId,
                'student_number' => $oldStudent->STUDENT_NUMBER,
                'location_lost'  => $data['location_lost'],
                'description'    => $data['description'] ?? null,
                'affidavit_path' => $path,
                'processed_by'   => auth()->id(),
            ]);

            // Notify all admins of lost ID report
            try {
                $notification = new SystemNotification(
                    'Lost ID Reported',
                    "Student {$oldStudent->FN} {$oldStudent->LN} reported their Library ID lost.",
                    '/lost-library-id'
                );
                foreach (User::all() as $user) {
                    $user->notify($notification);
                }
            } catch (\Exception $ne) {
                Log::error('Notification Error: ' . $ne->getMessage());
            }

            return [
                'new_library_id' => $newLibraryId,
                'report'         => $report,
                'student'        => $newStudent
            ];
        });
    }
}
