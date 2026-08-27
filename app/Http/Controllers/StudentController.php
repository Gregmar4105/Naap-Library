<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Services\StudentService;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    protected StudentService $studentService;
    protected StudentRepositoryInterface $studentRepository;

    public function __construct(StudentService $studentService, StudentRepositoryInterface $studentRepository)
    {
        $this->studentService = $studentService;
        $this->studentRepository = $studentRepository;
    }

    /**
     * Display the student list page.
     */
    public function index()
    {
        return Inertia::render('student-list');
    }

    /**
     * Fetch students data with optional searching.
     */
    public function getData(Request $request)
    {
        $search = $request->input('search');
        $students = $this->studentRepository->paginateWithSearch($search, 20);
        return response()->json($students);
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, $libraryId)
    {
        $validated = $request->validate([
            'STUDENT_NUMBER' => 'required|string|max:50',
            'FN' => 'required|string|max:50',
            'MN' => 'nullable|string|max:50',
            'LN' => 'required|string|max:50',
            'SEX' => 'nullable|string|max:20',
            'BIRTHDAY' => 'nullable|string',
            'CONTACT_NUMBER' => 'nullable|string|max:50',
            'EMAIL' => 'nullable|email|max:100',
            'COURSE' => 'required|string|max:100',
            'STUDENT_RFID_NUMBER' => 'nullable|string|max:100',
            'REGISTERED_ON' => 'nullable|date',
            'RENEW_ON' => 'nullable|date',
            'PIC' => 'nullable|image|max:5120',
        ]);

        try {
            $pic = $request->file('PIC');
            unset($validated['PIC']);

            $student = $this->studentService->updateStudent($libraryId, $validated, $pic);

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully.',
                'student' => $student
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete the student (mark as Inactive).
     */
    public function destroy(Request $request, $libraryId)
    {
        try {
            $student = $this->studentService->deactivateStudent($libraryId, $request->input('note'));

            return response()->json([
                'success' => true,
                'message' => 'Student marked as Inactive.',
                'student' => $student
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send an email to a student.
     */
    public function sendEmail(Request $request)
    {
        $request->validate([
            'to'             => 'required|email',
            'subject'        => 'required|string|max:255',
            'body'           => 'required|string',
            'library_id'     => 'nullable|string',
            'attachments.*'  => 'nullable|file|max:10240',
        ]);

        try {
            $attachments = $request->file('attachments', []);
            $this->studentService->sendStudentEmail($request->only('to', 'subject', 'body', 'library_id'), $attachments);

            return response()->json(['success' => true, 'message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Activate the student (mark as Active).
     */
    public function activate($libraryId)
    {
        try {
            $student = $this->studentService->activateStudent($libraryId);

            return response()->json([
                'success' => true,
                'message' => 'Student account has been activated.',
                'student' => $student
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate QR Code and Barcode for a specified student's Library ID.
     */
    public function generateQr($libraryId)
    {
        try {
            $credentials = \App\Services\BarcodeService::generateStudentCredentialsImages($libraryId);

            return response()->json([
                'success' => true,
                'secret_key' => $credentials['secret_key'],
                'qr_code' => $credentials['qr_code'],
                'barcode' => $credentials['barcode'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code and Barcode: ' . $e->getMessage()
            ], 500);
        }
    }
}
