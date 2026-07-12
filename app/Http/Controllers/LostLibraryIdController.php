<?php

namespace App\Http\Controllers;

use App\Models\StudentInfo;
use App\Models\LostIdReport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LostLibraryIdController extends Controller
{
    public function index()
    {
        return Inertia::render('lost-library-id');
    }

    /**
     * Search for active students to report loss.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $students = StudentInfo::where('ID_STATUS', 'Active')
            ->where(function ($q) use ($query) {
                $q->where('STUDENT_NUMBER', 'LIKE', "%{$query}%")
                  ->orWhere('FN', 'LIKE', "%{$query}%")
                  ->orWhere('LN', 'LIKE', "%{$query}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$query}%"]);
            })
            ->select('LIBRARY_ID', 'STUDENT_NUMBER', 'FN', 'MN', 'LN', 'COURSE', 'PIC', 'ID_STATUS', 'EMAIL', 'CONTACT_NUMBER', 'SEX', 'BIRTHDAY', 'ADDRESS')
            ->limit(20)
            ->get();

        return response()->json($students);
    }

    /**
     * Process the loss report and re-register the student.
     */
    public function report(Request $request)
    {
        $request->validate([
            'old_library_id' => 'required|string|exists:tbl_student_info,LIBRARY_ID',
            'location_lost' => 'required|string|max:255',
            'description' => 'nullable|string',
            'affidavit' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $oldStudent = StudentInfo::findOrFail($request->old_library_id);
                
                // 1. Generate new Library ID
                $newLibraryId = $this->generateLibraryId();

                // 2. Handle Affidavit Upload
                $path = $request->file('affidavit')->store('affidavits', 'public');

                // 3. Create a new record (Re-registration)
                $now = Carbon::now('Asia/Manila');
                $newStudent = $oldStudent->replicate();
                $newStudent->LIBRARY_ID = $newLibraryId;
                $newStudent->ID_STATUS = 'Active';
                $newStudent->ID_STATUS_DATE = $now->format('Y-m-d');
                $newStudent->REGISTERED_ON = $now->format('Y-m-d');
                $newStudent->STUDENT_RFID_NUMBER = null; // Reset NFC if lost
                $newStudent->FACE_EMBEDDING = $oldStudent->FACE_EMBEDDING; // Keep face data
                $newStudent->save();

                // 4. Update Old Record to Deactivated
                $oldStudent->ID_STATUS = 'Deactivated';
                $oldStudent->ID_STATUS_DATE = $now->format('Y-m-d');
                $oldStudent->save();

                // 5. Save the lost ID report
                $report = LostIdReport::create([
                    'old_library_id' => $request->old_library_id,
                    'new_library_id' => $newLibraryId,
                    'student_number' => $oldStudent->STUDENT_NUMBER,
                    'location_lost' => $request->location_lost,
                    'description' => $request->description,
                    'affidavit_path' => $path,
                    'processed_by' => auth()->id(),
                ]);

                // Notify all admins of lost ID report
                try {
                    $notification = new \App\Notifications\SystemNotification(
                        'Lost ID Reported',
                        "Student {$oldStudent->FN} {$oldStudent->LN} reported their Library ID lost.",
                        '/lost-library-id'
                    );
                    foreach (\App\Models\User::all() as $user) {
                        $user->notify($notification);
                    }
                } catch (\Exception $ne) {
                    Log::error('Notification Error: ' . $ne->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Library ID reported lost and student re-registered successfully.',
                    'new_library_id' => $newLibraryId,
                    'report' => $report,
                    'student' => $newStudent
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Lost ID Report Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing the report.'
            ], 500);
        }
    }

    /**
     * Sequential Library ID generation logic (mirrored from StudentRegistrationController).
     */
    private function generateLibraryId(): string
    {
        $yearPrefix = Carbon::now('Asia/Manila')->format('y');

        $latest = StudentInfo::where('LIBRARY_ID', 'LIKE', $yearPrefix . '-%')
            ->orderByRaw("CAST(SUBSTRING_INDEX(LIBRARY_ID, '-', -1) AS UNSIGNED) DESC")
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->LIBRARY_ID);
            $nextCount = intval(end($parts)) + 1;
        } else {
            $nextCount = 1;
        }

        return $yearPrefix . '-' . str_pad($nextCount, 5, '0', STR_PAD_LEFT);
    }
}
