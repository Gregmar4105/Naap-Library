<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentInfo;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\StudentCredentials;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Inertia\Inertia;

class StudentRegistrationController extends Controller
{
    public function index()
    {
        $thresholdSetting = \App\Models\SensitivityThreshold::where('key', 'face_recognition')->first();
        $faceThreshold = $thresholdSetting ? (float)$thresholdSetting->value : 0.45;

        return Inertia::render('student-registration', [
            'faceThreshold' => $faceThreshold
        ]);
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

        // Handle PIC upload if provided
        $picPath = null;
        if ($request->hasFile('PIC')) {
            $file = $request->file('PIC');
            $extension = $file->getClientOriginalExtension();
            $filename = $libraryId . '_' . time() . '.' . $extension;
            // Store in storage/app/public/avatars (explicitly using the 'public' disk)
            $file->storeAs('avatars', $filename, 'public');
            // Save as 'avatars/filename.ext' so it works with the frontend's resolveImageUrl
            $picPath = 'avatars/' . $filename;
        }

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
            'PIC' => $picPath,
            'REGISTERED_ON' => $now->format('Y-m-d'),
            'ID_STATUS' => 'Active',
            'ID_STATUS_DATE' => $now->format('Y-m-d'),
        ]);

        // Generate QR code dynamically
        try {
            $qrCode = (new QRCode)->render($libraryId);

            // Send email if student has email
            if ($student->EMAIL) {
                Mail::to($student->EMAIL)->send(new StudentCredentials($student, $qrCode));
                $student->update(['QR_SENT' => true]);
            }
        } catch (\Exception $e) {
            Log::error('Registration Email Error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'student' => $student,
            'message' => 'Student registered successfully! Library ID: ' . $libraryId . '. Credentials sent to email.'
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
     * Link a Face descriptor to a student by assigning FACE_EMBEDDING.
     */
    public function linkFace(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
            'descriptor' => 'required|array', // Can be single vector or a map of vectors
        ]);

        $student = StudentInfo::where('LIBRARY_ID', $request->library_id)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.'
            ], 404);
        }

        // Store the array directly; Laravel's 'array' cast on the model will handle JSON serialization.
        $student->FACE_EMBEDDING = $request->descriptor;
        $student->save();

        return response()->json([
            'success' => true,
            'student' => $student,
            'message' => 'Face linked successfully!'
        ]);
    }

    /**
     * Verify an identifier (RFID, Barcode, or QR).
     */
    public function verify(Request $request)
    {
        $request->validate([
            'id' => 'required|string',
            'type' => 'required|string|in:rfid,barcode,qr',
        ]);

        $id = $request->input('id');
        $type = $request->input('type');

        if ($type === 'rfid') {
            $student = StudentInfo::where('STUDENT_RFID_NUMBER', $id)->first();
        } else {
            // Barcode and QR use LIBRARY_ID
            $student = StudentInfo::where('LIBRARY_ID', $id)->first();
        }

        if (!$student) {
            $msg = $type === 'rfid' ? 'RFID card' : ucfirst($type);
            return response()->json([
                'success' => false,
                'message' => "No student found with this {$msg}."
            ], 404);
        }

        return response()->json([
            'success' => true,
            'student' => $student,
        ]);
    }

    /**
     * Verify by Face Descriptor.
     */
    public function verifyFace(Request $request)
    {
        $request->validate([
            'descriptor' => 'required|array|size:128',
        ]);

        try {
            $thresholdSetting = \App\Models\SensitivityThreshold::where('key', 'face_recognition')->first();
            $threshold = $thresholdSetting ? (float)$thresholdSetting->value : 0.45;

            $response = \Illuminate\Support\Facades\Http::timeout(5)->post('http://127.0.0.1:8000/recognize', [
                'descriptor' => $request->input('descriptor'),
                'threshold' => $threshold
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if ($data && isset($data['match']) && $data['match']) {
                    $student = StudentInfo::where('LIBRARY_ID', $data['library_id'])->first();
                    if ($student) {
                        return response()->json([
                            'success' => true,
                            'student' => $student,
                        ]);
                    }
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Face not recognized or not registered.',
                    'best_distance' => $data['distance'] ?? null
                ], 200);
            }
        } catch (\Exception $e) {
            \Log::error('Python Face Engine Error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => false,
            'message' => 'Service error. Check face recognition engine.'
        ], 500);
    }
}
