<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Services\StudentService;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class StudentRegistrationController extends Controller
{
    protected StudentService $studentService;
    protected StudentRepositoryInterface $studentRepository;

    public function __construct(StudentService $studentService, StudentRepositoryInterface $studentRepository)
    {
        $this->studentService = $studentService;
        $this->studentRepository = $studentRepository;
    }

    public function index()
    {
        $thresholdSetting = \App\Models\SensitivityThreshold::where('key', 'face_recognition')->first();
        $faceThreshold = $thresholdSetting ? (float)$thresholdSetting->value : 0.45;

        return Inertia::render('student-registration', [
            'faceThreshold' => $faceThreshold,
        ]);
    }

    /**
     * Generate QR Code for a specified URL dynamically.
     */
    public function generateUrlQr(Request $request)
    {
        $request->validate([
            'url' => 'required|url',
        ]);

        try {
            $options = new QROptions([
                'outputInterface' => QRGdImagePNG::class,
                'outputBase64' => true,
                'scale' => 6,
            ]);
            $qrCode = (new QRCode($options))->render($request->input('url'));

            return response()->json([
                'success' => true,
                'qr_code' => $qrCode,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search students by name or student number.
     * Returns recently registered students if query is empty.
     */
    public function search(Request $request)
    {
        $query = trim($request->input('q', ''));

        if (strlen($query) < 2) {
            $recentStudents = \App\Models\StudentInfo::orderBy('REGISTERED_ON', 'desc')
                ->orderBy('LIBRARY_ID', 'desc')
                ->limit(10)
                ->get();
            return response()->json($recentStudents);
        }

        $students = $this->studentRepository->searchAll($query, 20);
        return response()->json($students);
    }


    /**
     * Get the next available LIBRARY_ID for the frontend preview.
     */
    public function nextLibraryId()
    {
        return response()->json([
            'library_id' => $this->studentRepository->generateNextLibraryId(),
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
            'PIC' => 'nullable|image|max:5120',
        ]);

        $existing = $this->studentRepository->findByStudentNumber($request->STUDENT_NUMBER);
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A student with this Student Number already exists.'
            ], 422);
        }

        try {
            $student = $this->studentService->registerStudent($request->all(), $request->file('PIC'), false);
            $credentials = \App\Services\BarcodeService::generateStudentCredentialsImages($student->LIBRARY_ID);

            return response()->json([
                'success' => true,
                'student' => $student,
                'qr_code' => $credentials['qr_code'],
                'barcode' => $credentials['barcode'],
                'secret_key' => $credentials['secret_key'],
                'message' => 'Student registered successfully! Credentials sent to email.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
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

        try {
            $student = $this->studentService->linkCard($request->library_id, $request->rfid_number);

            return response()->json([
                'success' => true,
                'student' => $student,
                'message' => 'RFID card linked successfully!'
            ]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = in_array($code, [404, 422]) ? $code : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Link a Face descriptor to a student by assigning FACE_EMBEDDING.
     */
    public function linkFace(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
            'descriptor' => 'required|array',
        ]);

        try {
            $student = $this->studentService->linkFace($request->library_id, $request->descriptor);

            return response()->json([
                'success' => true,
                'student' => $student,
                'message' => 'Face linked successfully!'
            ]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = ($code == 404) ? 404 : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $status);
        }
    }

    /**
     * Link or update twin relationship for a student.
     */
    public function linkTwin(Request $request)
    {
        $request->validate([
            'library_id' => 'required|string',
            'twin_library_id' => 'nullable|string',
        ]);

        try {
            $student = $this->studentService->linkTwin($request->library_id, $request->twin_library_id);

            return response()->json([
                'success' => true,
                'student' => $student,
                'message' => $request->twin_library_id ? 'Twin relationship linked successfully!' : 'Twin relationship unlinked successfully!'
            ]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = in_array($code, [404, 422]) ? $code : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $status);
        }
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

        try {
            $scannedId = \App\Services\BarcodeService::decodeStudentSecret($request->input('id'));
            $student = $this->studentService->verify($scannedId, $request->input('type'));

            return response()->json([
                'success' => true,
                'student' => $student,
            ]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = ($code == 404) ? 404 : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $status);
        }
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
            $result = $this->studentService->verifyFace($request->input('descriptor'));

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('verifyFace Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Public Student Registration (no auth required) with optional Face linking.
     */
    public function publicRegister(Request $request)
    {
        $request->validate([
            'STUDENT_NUMBER' => 'required|string|max:50',
            'FN' => 'required|string|max:50',
            'LN' => 'required|string|max:50',
            'COURSE' => 'required|string|max:50',
            'PIC' => 'nullable|image|max:5120',
        ]);

        $existing = $this->studentRepository->findByStudentNumber($request->STUDENT_NUMBER);
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A student with this Student Number already exists in the system.'
            ], 422);
        }

        try {
            $student = $this->studentService->registerStudent($request->all(), $request->file('PIC'), true);

            // If face descriptors are supplied during public registration, link them directly
            if ($request->has('descriptor')) {
                $rawDescriptor = $request->input('descriptor');
                $descriptor = is_string($rawDescriptor) ? json_decode($rawDescriptor, true) : $rawDescriptor;
                if (!empty($descriptor) && is_array($descriptor)) {
                    $student = $this->studentService->linkFace($student->LIBRARY_ID, $descriptor);
                }
            }

            $credentials = \App\Services\BarcodeService::generateStudentCredentialsImages($student->LIBRARY_ID);

            return response()->json([
                'success' => true,
                'student' => $student,
                'qr_code' => $credentials['qr_code'],
                'barcode' => $credentials['barcode'],
                'secret_key' => $credentials['secret_key'],
                'message' => 'Student registration successful! Credentials sent to email if provided.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify student by Student Number and Birthday for face registration.
     */
    public function publicVerifyStudent(Request $request)
    {
        $request->validate([
            'student_number' => 'required|string',
            'birthday' => 'required|string',
        ]);

        $studentNumber = trim($request->input('student_number'));
        $birthday = trim($request->input('birthday'));

        $student = $this->studentRepository->findByStudentNumber($studentNumber);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'No student account found matching Student Number ' . $studentNumber . '.'
            ], 404);
        }

        if (!$student->BIRTHDAY) {
            // If student has no birthday recorded, match allowed
            return response()->json([
                'success' => true,
                'student' => $student,
                'message' => 'Student account verified!'
            ]);
        }

        try {
            $studentBirthday = Carbon::parse($student->BIRTHDAY)->format('Y-m-d');
            $inputBirthday = Carbon::parse($birthday)->format('Y-m-d');

            if ($studentBirthday !== $inputBirthday) {
                return response()->json([
                    'success' => false,
                    'message' => 'The birthday provided does not match our records for this Student Number.'
                ], 422);
            }
        } catch (\Exception $e) {
            // Fallback raw string comparison
            if (trim($student->BIRTHDAY) !== $birthday) {
                return response()->json([
                    'success' => false,
                    'message' => 'The birthday provided does not match our records for this Student Number.'
                ], 422);
            }
        }

        return response()->json([
            'success' => true,
            'student' => $student,
            'message' => 'Student account verified successfully!'
        ]);
    }
}


