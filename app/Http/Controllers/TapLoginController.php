<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentInfo;
use App\Models\StudentLog;
use Carbon\Carbon;

class TapLoginController extends Controller
{
    public function processTap(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
        ]);

        $libraryId = $request->input('library_id');

        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.'
            ], 404);
        }

        // Current time for the log
        $now = Carbon::now('Asia/Manila');
        $today = $now->format('Y-m-d');

        // Check if student has an active session today (odd number of logs = currently logged in)
        $logsCount = StudentLog::where('LIBRARY_ID', $student->LIBRARY_ID)
                        ->where('LOG_DATE', $today)
                        ->count();

        if ($logsCount % 2 !== 0) {
            return response()->json([
                'success' => false,
                'status' => 'already_in',
                'student' => $student,
                'message' => 'You are already logged in!'
            ]);
        }
        
        // Log session as UNIX timestamp per user requirement
        $session = $now->timestamp;

        $log = StudentLog::create([
            'LIBRARY_ID' => $student->LIBRARY_ID,
            'LOG_TIME' => $now->format('H:i:s'),
            'LOG_DATE' => $today,
            'LOG_SESSION' => (string) $session
        ]);

        // Return the formatted time for the React component (e.g. 10:45 PM)
        return response()->json([
            'success' => true,
            'status' => 'success',
            'student' => $student,
            'time_in' => $now->format('g:i A')
        ]);
    }

    public function processTapOut(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
        ]);

        $libraryId = $request->input('library_id');

        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.'
            ], 404);
        }

        // Current time for the log
        $now = Carbon::now('Asia/Manila');
        $today = $now->format('Y-m-d');
        
        // Fetch all logs for today to determine session state
        $activeLogs = StudentLog::where('LIBRARY_ID', $student->LIBRARY_ID)
                        ->where('LOG_DATE', $today)
                        ->orderBy('LOG_TIME', 'desc')
                        ->get();

        if ($activeLogs->count() % 2 === 0) {
            return response()->json([
                'success' => false,
                'status' => 'already_out',
                'student' => $student,
                'message' => 'You are already logged out!'
            ]);
        }

        // Grab the LOG_SESSION from the latest log (which was the Login) to pair them!
        $session = $activeLogs->first()->LOG_SESSION;

        // Insert new row for tap out
        $log = StudentLog::create([
            'LIBRARY_ID' => $student->LIBRARY_ID,
            'LOG_TIME' => $now->format('H:i:s'),
            'LOG_DATE' => $today,
            'LOG_SESSION' => $session
        ]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'student' => $student,
            'time_out' => $now->format('g:i A')
        ]);
    }
}
