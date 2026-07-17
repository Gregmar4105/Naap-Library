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

        // Detect local network IP addresses
        $ips = [];
        try {
            if (stristr(PHP_OS, 'WIN')) {
                exec('ipconfig', $output);
                foreach ($output as $line) {
                    if (preg_match('/IPv4 Address[\.\s]+:\s*([\d\.]+)/', $line, $matches)) {
                        $ip = trim($matches[1]);
                        if (!str_starts_with($ip, '127.') && !str_starts_with($ip, '169.254.')) {
                            $ips[] = $ip;
                        }
                    }
                }
            } else {
                exec('hostname -I', $output);
                if (!empty($output)) {
                    $parts = explode(' ', trim($output[0]));
                    foreach ($parts as $part) {
                        $ip = trim($part);
                        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && !str_starts_with($ip, '127.') && !str_starts_with($ip, '169.254.')) {
                            $ips[] = $ip;
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('IP Detection Error: ' . $e->getMessage());
        }

        if (empty($ips)) {
            $ips[] = gethostbyname(gethostname()) ?: '127.0.0.1';
        }

        return Inertia::render('student-registration', [
            'faceThreshold' => $faceThreshold,
            'localIps' => $ips
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
     * Render the public Student Self-Registration form page.
     */
    public function publicForm()
    {
        return Inertia::render('register-student');
    }

    /**
     * Register a new student via the public self-registration page.
     */
    public function publicRegister(Request $request)
    {
        $request->validate([
            'STUDENT_NUMBER' => 'required|string|max:50',
            'FN' => 'required|string|max:50',
            'LN' => 'required|string|max:50',
            'COURSE' => 'required|string|max:50',
        ]);

        $existing = $this->studentRepository->findByStudentNumber($request->STUDENT_NUMBER);
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A student with this Student Number already exists.'
            ], 422);
        }

        try {
            $student = $this->studentService->registerStudent($request->all(), $request->file('PIC'), true);

            return response()->json([
                'success' => true,
                'student' => $student,
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
     * Search students by name or student number.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
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

            return response()->json([
                'success' => true,
                'student' => $student,
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
     * Verify an identifier (RFID, Barcode, or QR).
     */
    public function verify(Request $request)
    {
        $request->validate([
            'id' => 'required|string',
            'type' => 'required|string|in:rfid,barcode,qr',
        ]);

        try {
            $student = $this->studentService->verify($request->input('id'), $request->input('type'));

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
}
