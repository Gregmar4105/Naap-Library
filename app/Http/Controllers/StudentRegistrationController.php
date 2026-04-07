<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentInfo;
use Carbon\Carbon;
use Inertia\Inertia;

class StudentRegistrationController extends Controller
{
    public function index()
    {
        return Inertia::render('student-registration');
    }

    /**
     * Search students by name or student number.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $students = StudentInfo::where(function ($q) use ($query) {
                $q->where('STUDENT_NUMBER', 'LIKE', "%{$query}%")
                  ->orWhere('FN', 'LIKE', "%{$query}%")
                  ->orWhere('LN', 'LIKE', "%{$query}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$query}%"]);
            })
            ->select('LIBRARY_ID', 'STUDENT_RFID_NUMBER', 'STUDENT_NUMBER', 'FN', 'MN', 'LN', 'COURSE', 'PIC', 'ID_STATUS', 'SEX', 'EMAIL', 'CONTACT_NUMBER')
            ->limit(20)
            ->get();

        return response()->json($students);
    }

    /**
     * Generate the next LIBRARY_ID in format "YY-NNNNN".
     * YY = last 2 digits of the current year.
     * NNNNN = sequential count (up to 5 digits) for that year.
     */
    private function generateLibraryId(): string
    {
        $yearPrefix = Carbon::now('Asia/Manila')->format('y'); // e.g. "26"

        // Find the highest existing LIBRARY_ID for this year prefix
        $latest = StudentInfo::where('LIBRARY_ID', 'LIKE', $yearPrefix . '-%')
            ->orderByRaw("CAST(SUBSTRING_INDEX(LIBRARY_ID, '-', -1) AS UNSIGNED) DESC")
            ->first();

        if ($latest) {
            // Extract the numeric part after the dash
            $parts = explode('-', $latest->LIBRARY_ID);
            $nextCount = intval(end($parts)) + 1;
        } else {
            $nextCount = 1;
        }

        // Pad up to 5 digits (allows up to 99999)
        $formattedCount = str_pad($nextCount, 5, '0', STR_PAD_LEFT);

        return $yearPrefix . '-' . $formattedCount;
    }

    /**
     * Get the next available LIBRARY_ID for the frontend preview.
     */
    public function nextLibraryId()
    {
        return response()->json([
            'library_id' => $this->generateLibraryId(),
        ]);
    }

    /**
     * Register a new student.
     */
    public function register(Request $request)
    {
        $request->validate([
            'STUDENT_NUMBER' => 'required|string|max:50',
            'FN' => 'required|string|max:50',
            'LN' => 'required|string|max:50',
            'COURSE' => 'required|string|max:50',
        ]);

        // Check if student number already exists
        $existing = StudentInfo::where('STUDENT_NUMBER', $request->STUDENT_NUMBER)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A student with this Student Number already exists.'
            ], 422);
        }

        // Generate the LIBRARY_ID in YY-NNNNN format
        $libraryId = $this->generateLibraryId();

        $now = Carbon::now('Asia/Manila');

        $student = StudentInfo::create([
            'LIBRARY_ID' => $libraryId,
            'STUDENT_NUMBER' => $request->STUDENT_NUMBER,
            'FN' => $request->FN,
            'MN' => $request->MN,
            'LN' => $request->LN,
            'SEX' => $request->SEX,
            'BIRTHDAY' => $request->BIRTHDAY,
            'CONTACT_NUMBER' => $request->CONTACT_NUMBER,
            'EMAIL' => $request->EMAIL,
            'COURSE' => $request->COURSE,
            'ADDRESS' => $request->ADDRESS,
            'REGISTERED_ON' => $now->format('Y-m-d'),
            'ID_STATUS' => 'Active',
            'ID_STATUS_DATE' => $now->format('Y-m-d'),
        ]);

        return response()->json([
            'success' => true,
            'student' => $student,
            'message' => 'Student registered successfully! Library ID: ' . $libraryId . '. Now tap their RFID card to link it.'
        ]);
    }

    /**
     * Link an RFID card to a student by assigning STUDENT_RFID_NUMBER.
     */
    public function linkCard(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
            'rfid_number' => 'required|string',
        ]);

        $student = StudentInfo::where('LIBRARY_ID', $request->library_id)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.'
            ], 404);
        }

        // Check if this RFID number is already linked to another student
        $existingRfid = StudentInfo::where('STUDENT_RFID_NUMBER', $request->rfid_number)
            ->where('LIBRARY_ID', '!=', $request->library_id)
            ->first();

        if ($existingRfid) {
            return response()->json([
                'success' => false,
                'message' => 'This RFID card is already linked to another student: ' . $existingRfid->FN . ' ' . $existingRfid->LN . ' (' . $existingRfid->STUDENT_NUMBER . ').'
            ], 422);
        }

        $student->STUDENT_RFID_NUMBER = $request->rfid_number;
        $student->save();

        return response()->json([
            'success' => true,
            'student' => $student,
            'message' => 'RFID card linked successfully!'
        ]);
    }

    /**
     * Verify a card scan — look up who a STUDENT_RFID_NUMBER belongs to.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'rfid_number' => 'required|string',
        ]);

        $student = StudentInfo::where('STUDENT_RFID_NUMBER', $request->rfid_number)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'No student found with this RFID card.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'student' => $student,
        ]);
    }
}
