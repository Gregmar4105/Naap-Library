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
            ->select('ID', 'LIBRARY_ID', 'STUDENT_NUMBER', 'FN', 'MN', 'LN', 'COURSE', 'PIC', 'ID_STATUS', 'SEX', 'EMAIL', 'CONTACT_NUMBER')
            ->limit(20)
            ->get();

        return response()->json($students);
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

        // Generate a unique LIBRARY_ID (10-digit numeric string)
        do {
            $libraryId = str_pad(mt_rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (StudentInfo::where('LIBRARY_ID', $libraryId)->exists());

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
            'message' => 'Student registered successfully! Tap their NFC card to write LIBRARY_ID: ' . $libraryId
        ]);
    }

    /**
     * Verify a card scan — look up who a LIBRARY_ID belongs to.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
        ]);

        $student = StudentInfo::where('LIBRARY_ID', $request->library_id)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'No student found with this card.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'student' => $student,
        ]);
    }
}
