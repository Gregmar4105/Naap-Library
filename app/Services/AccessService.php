<?php

namespace App\Services;

use App\Repositories\Contracts\AccessAttemptRepositoryInterface;
use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Notifications\SystemNotification;
use App\Models\StudentInfo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AccessService
{
    protected AccessAttemptRepositoryInterface $accessAttemptRepository;
    protected StudentRepositoryInterface $studentRepository;

    public function __construct(
        AccessAttemptRepositoryInterface $accessAttemptRepository,
        StudentRepositoryInterface $studentRepository
    ) {
        $this->accessAttemptRepository = $accessAttemptRepository;
        $this->studentRepository = $studentRepository;
    }

    public function processLogin(array $data)
    {
        $imagePath = $this->saveCapture($data['captured_image'] ?? null);
        
        $libraryId = $data['library_id'] ?? null;
        $rfidNumber = $data['rfid_number'] ?? null;
        $recognition = null;

        if (!$libraryId && !$rfidNumber && isset($data['descriptor'])) {
            $recognition = $this->identifyFace($data['descriptor']);
            $libraryId = ($recognition && isset($recognition['match']) && $recognition['match']) ? $recognition['library_id'] : null;
        }

        $now = Carbon::now('Asia/Manila');
        $today = $now->format('Y-m-d');
        $time = $now->format('H:i:s');

        // Check if twin is currently logged in (active session)
        if (empty($data['library_id']) && empty($data['rfid_number']) && isset($data['descriptor']) && $libraryId && $recognition) {
            if (isset($recognition['candidates'])) {
                foreach ($recognition['candidates'] as $candidate) {
                    $candidateId = $candidate['library_id'];
                    if ($candidateId !== $libraryId) {
                        $twinLogsToday = $this->accessAttemptRepository->getTodayLogsCount($candidateId, $today);
                        if ($twinLogsToday % 2 !== 0) {
                            // Twin is currently active in the library!
                            $twinStudent = $this->studentRepository->findByLibraryId($candidateId);
                            $matchedStudent = $this->studentRepository->findByLibraryId($libraryId);

                            $this->accessAttemptRepository->logAttempt([
                                'LIBRARY_ID' => $libraryId,
                                'STATUS' => 'failed',
                                'IMAGE_PATH' => $imagePath,
                                'ATTEMPT_TYPE' => 'login',
                                'LOG_DATE' => $today,
                                'LOG_TIME' => $time,
                            ]);

                            return [
                                'success' => false,
                                'status' => 'twin_detected',
                                'student' => $matchedStudent,
                                'twin' => $twinStudent,
                                'message' => 'Similar facial features detected with an active student. Please log in using another method (QR, RFID, or Barcode).'
                            ];
                        }
                    }
                }
            }
        }

        if ($rfidNumber && !$libraryId) {
            $student = StudentInfo::where('STUDENT_RFID_NUMBER', $rfidNumber)->first();
            if ($student) {
                $libraryId = $student->LIBRARY_ID;
            }
        }

        // Always log attempt
        $this->accessAttemptRepository->logAttempt([
            'LIBRARY_ID' => $libraryId,
            'STATUS' => $libraryId ? 'success' : 'failed',
            'IMAGE_PATH' => $imagePath,
            'ATTEMPT_TYPE' => 'login',
            'LOG_DATE' => $today,
            'LOG_TIME' => $time,
        ]);

        if (!$libraryId) {
            return [
                'success' => false,
                'message' => $rfidNumber ? 'RFID not recognized.' : 'Identification failed. Please try again.',
                'best_distance' => $recognition['best_distance'] ?? null,
                'best_match_id' => $recognition['best_match_id'] ?? null
            ];
        }

        $student = $this->studentRepository->findByLibraryId($libraryId);

        if (!$student) {
            return [
                'success' => false,
                'message' => 'Library ID not found in system.'
            ];
        }

        if (!$student->ID_STATUS || strcasecmp($student->ID_STATUS, 'Active') !== 0) {
            $this->notifyInactiveAttempt($student, 'access the library');
            return [
                'success' => false,
                'status' => 'inactive',
                'student' => $student,
                'message' => 'Your account is currently Inactive. Please contact the librarian.'
            ];
        }

        // Check duplicate
        $totalLogsToday = $this->accessAttemptRepository->getTodayLogsCount($student->LIBRARY_ID, $today);

        if ($totalLogsToday % 2 !== 0) {
            return [
                'success' => false,
                'status' => 'already_in',
                'student' => $student,
                'message' => 'You are already logged in!'
            ];
        }
        
        $session = $now->timestamp;

        $this->studentRepository->createStudentLog([
            'LIBRARY_ID' => $student->LIBRARY_ID,
            'LOG_TIME' => $time,
            'LOG_DATE' => $today,
            'LOG_SESSION' => (string) $session,
            'LOG_IMAGE' => $imagePath
        ]);

        return [
            'success' => true,
            'status' => 'success',
            'student' => $student,
            'time_in' => $now->format('g:i A')
        ];
    }

    public function processLogout(array $data)
    {
        $imagePath = $this->saveCapture($data['captured_image'] ?? null);
        
        $libraryId = $data['library_id'] ?? null;
        $rfidNumber = $data['rfid_number'] ?? null;
        $recognition = null;

        if (!$libraryId && !$rfidNumber && isset($data['descriptor'])) {
            $recognition = $this->identifyFace($data['descriptor']);
            $libraryId = ($recognition && isset($recognition['match']) && $recognition['match']) ? $recognition['library_id'] : null;
        }

        if ($rfidNumber && !$libraryId) {
            $student = StudentInfo::where('STUDENT_RFID_NUMBER', $rfidNumber)->first();
            if ($student) {
                $libraryId = $student->LIBRARY_ID;
            }
        }

        $now = Carbon::now('Asia/Manila');
        $today = $now->format('Y-m-d');
        $time = $now->format('H:i:s');

        // Always log attempt
        $this->accessAttemptRepository->logAttempt([
            'LIBRARY_ID' => $libraryId,
            'STATUS' => $libraryId ? 'success' : 'failed',
            'IMAGE_PATH' => $imagePath,
            'ATTEMPT_TYPE' => 'logout',
            'LOG_DATE' => $today,
            'LOG_TIME' => $time,
        ]);

        if (!$libraryId) {
            return [
                'success' => false,
                'message' => $rfidNumber ? 'RFID not recognized.' : 'Identification failed. Please try again.',
                'best_distance' => $recognition['best_distance'] ?? null,
                'best_match_id' => $recognition['best_match_id'] ?? null
            ];
        }

        $student = $this->studentRepository->findByLibraryId($libraryId);

        if (!$student) {
            return [
                'success' => false,
                'message' => 'Library ID not found in system.'
            ];
        }

        if (!$student->ID_STATUS || strcasecmp($student->ID_STATUS, 'Active') !== 0) {
            $this->notifyInactiveAttempt($student, 'leave the library');
            return [
                'success' => false,
                'status' => 'inactive',
                'student' => $student,
                'message' => 'Your account is currently Inactive. Please contact the librarian.'
            ];
        }
        
        $totalLogsToday = $this->accessAttemptRepository->getTodayLogsCount($student->LIBRARY_ID, $today);

        if ($totalLogsToday % 2 === 0) {
            return [
                'success' => false,
                'status' => 'already_out',
                'student' => $student,
                'message' => 'You are already logged out!'
            ];
        }

        $activeBorrow = $this->accessAttemptRepository->getActiveLockerHistory($student->LIBRARY_ID);

        if ($activeBorrow) {
            return [
                'success' => false,
                'status' => 'has_locker',
                'student' => $student,
                'message' => 'Please return your locker key (Locker #' . $activeBorrow->LOCKER_NUMBER . ') before leaving.'
            ];
        }

        $latestLog = $this->accessAttemptRepository->getLatestSessionLog($student->LIBRARY_ID, $today);
        $session = $latestLog ? $latestLog->LOG_SESSION : (string)$now->timestamp;

        $this->studentRepository->createStudentLog([
            'LIBRARY_ID' => $student->LIBRARY_ID,
            'LOG_TIME' => $time,
            'LOG_DATE' => $today,
            'LOG_SESSION' => $session,
            'LOG_IMAGE' => $imagePath
        ]);

        return [
            'success' => true,
            'status' => 'success',
            'student' => $student,
            'time_out' => $now->format('g:i A')
        ];
    }

    private function identifyFace(array $descriptor)
    {
        try {
            $thresholdSetting = \App\Models\SensitivityThreshold::where('key', 'face_recognition')->first();
            $threshold = $thresholdSetting ? (float)$thresholdSetting->value : 0.45;
            $twinThreshold = $threshold + 0.10; // Dynamic twin similarity threshold

            $response = Http::timeout(5)->post('http://127.0.0.1:8000/recognize', [
                'descriptor' => $descriptor,
                'threshold' => $threshold,
                'twin_threshold' => $twinThreshold
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['distance'])) {
                    Log::info("Face Match Attempt: best_distance=" . $data['distance'] . (isset($data['match']) && $data['match'] ? " [PASSED]" : " [FAILED]"));
                }

                return $data;
            }
        } catch (\Exception $e) {
            Log::error('Python Face Engine Error: ' . $e->getMessage());
        }

        return null;
    }

    private function saveCapture($base64Data)
    {
        if (!$base64Data) return null;

        try {
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $data = substr($base64Data, strpos($base64Data, ',') + 1);
                $type = strtolower($type[1]);

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
            Log::error('Image Capture Save Error: ' . $e->getMessage());
            return null;
        }
    }

    private function notifyInactiveAttempt(StudentInfo $student, string $actionType)
    {
        try {
            $notification = new SystemNotification(
                'Inactive Account Access Attempt',
                "Inactive student {$student->FN} {$student->LN} attempted to {$actionType}.",
                '/student-list'
            );
            foreach (User::all() as $user) {
                $user->notify($notification);
            }
        } catch (\Exception $ne) {
            Log::error('Notification Error: ' . $ne->getMessage());
        }
    }
}
