<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\StudentInfo;
use App\Models\StudentLog;
use App\Models\AccessAttempt;
use Carbon\Carbon;

class FaceLoginController extends Controller
{
    private function identifyFace(array $descriptor)
    {
        try {
            $response = Http::timeout(5)->post('http://127.0.0.1:8000/recognize', [
                'descriptor' => $descriptor
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['distance'])) {
                    \Log::info("Face Match Attempt: best_distance=" . $data['distance'] . (isset($data['match']) && $data['match'] ? " [PASSED]" : " [FAILED]"));
                }

                return $data;
            }
        } catch (\Exception $e) {
            \Log::error('Python Face Engine Error: ' . $e->getMessage());
        }

        return null;
    }

    private function saveCapture($base64Data)
    {
        if (!$base64Data) return null;

        try {
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $data = substr($base64Data, strpos($base64Data, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, etc

                if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                    return null;
                }

                $data = base64_decode($data);
                if ($data === false) return null;
            } else {
                return null;
            }

            $fileName = 'capture_' . Str::random(10) . '_' . time() . '.' . $type;
            $path = 'log_captures/' . $fileName;
            
            Storage::disk('public')->put($path, $data);
            
            return $path;
        } catch (\Exception $e) {
            \Log::error('Image Capture Save Error: ' . $e->getMessage());
            return null;
        }
    }

    public function processFaceLogin(Request $request)
    {
        $request->validate([
            'descriptor' => 'required|array|size:128',
            'captured_image' => 'nullable|string',
        ]);

        $imagePath = $this->saveCapture($request->input('captured_image'));
        $recognition = $this->identifyFace($request->input('descriptor'));
        $libraryId = ($recognition && isset($recognition['match']) && $recognition['match']) ? $recognition['library_id'] : null;

        $now = Carbon::now('Asia/Manila');
        $today = $now->format('Y-m-d');
        $time = $now->format('H:i:s');

        // Always log attempt
        AccessAttempt::create([
            'LIBRARY_ID' => $libraryId,
            'STATUS' => $libraryId ? 'success' : 'failed',
            'IMAGE_PATH' => $imagePath,
            'ATTEMPT_TYPE' => 'login',
            'LOG_DATE' => $today,
            'LOG_TIME' => $time,
        ]);

        if (!$libraryId) {
            return response()->json([
                'success' => false,
                'message' => 'Face not recognized or not registered.',
                'best_distance' => $recognition['best_distance'] ?? null,
                'best_match_id' => $recognition['best_match_id'] ?? null
            ], 200);
        }

        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->first();

        // Check duplicate
        $totalLogsToday = StudentLog::where('LIBRARY_ID', $student->LIBRARY_ID)
                        ->where('LOG_DATE', $today)
                        ->count();

        if ($totalLogsToday % 2 !== 0) {
            return response()->json([
                'success' => false,
                'status' => 'already_in',
                'student' => $student,
                'message' => 'You are already logged in!'
            ]);
        }
        
        $session = $now->timestamp;

        StudentLog::create([
            'LIBRARY_ID' => $student->LIBRARY_ID,
            'LOG_TIME' => $time,
            'LOG_DATE' => $today,
            'LOG_SESSION' => (string) $session,
            'LOG_IMAGE' => $imagePath
        ]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'student' => $student,
            'time_in' => $now->format('g:i A')
        ]);
    }

    public function processFaceLogout(Request $request)
    {
        $request->validate([
            'descriptor' => 'required|array|size:128',
            'captured_image' => 'nullable|string',
        ]);

        $imagePath = $this->saveCapture($request->input('captured_image'));
        $recognition = $this->identifyFace($request->input('descriptor'));
        $libraryId = ($recognition && isset($recognition['match']) && $recognition['match']) ? $recognition['library_id'] : null;

        $now = Carbon::now('Asia/Manila');
        $today = $now->format('Y-m-d');
        $time = $now->format('H:i:s');

        // Always log attempt
        AccessAttempt::create([
            'LIBRARY_ID' => $libraryId,
            'STATUS' => $libraryId ? 'success' : 'failed',
            'IMAGE_PATH' => $imagePath,
            'ATTEMPT_TYPE' => 'logout',
            'LOG_DATE' => $today,
            'LOG_TIME' => $time,
        ]);

        if (!$libraryId) {
            return response()->json([
                'success' => false,
                'message' => 'Face not recognized or not registered.',
                'best_distance' => $recognition['best_distance'] ?? null,
                'best_match_id' => $recognition['best_match_id'] ?? null
            ], 200);
        }

        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->first();
        
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

        $activeBorrow = \App\Models\RfidHistory::where('LIBRARY_ID', $student->LIBRARY_ID)
            ->whereNull('RETURN_ON')
            ->first();

        if ($activeBorrow) {
            return response()->json([
                'success' => false,
                'status' => 'has_locker',
                'student' => $student,
                'message' => 'Please return your locker key (Locker #' . $activeBorrow->LOCKER_NUMBER . ') before leaving.'
            ]);
        }

        $session = $activeLogs->first()->LOG_SESSION;

        StudentLog::create([
            'LIBRARY_ID' => $student->LIBRARY_ID,
            'LOG_TIME' => $time,
            'LOG_DATE' => $today,
            'LOG_SESSION' => $session,
            'LOG_IMAGE' => $imagePath
        ]);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'student' => $student,
            'time_out' => $now->format('g:i A')
        ]);
    }
}

