<?php

namespace App\Http\Controllers;

use App\Models\StudentInfo;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;

class StudentController extends Controller
{
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

        $query = StudentInfo::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('LIBRARY_ID', 'LIKE', "%{$search}%")
                  ->orWhere('STUDENT_NUMBER', 'LIKE', "%{$search}%")
                  ->orWhere('FN', 'LIKE', "%{$search}%")
                  ->orWhere('MN', 'LIKE', "%{$search}%")
                  ->orWhere('LN', 'LIKE', "%{$search}%")
                  ->orWhere('EMAIL', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$search}%"])
                  ->orWhereRaw("CONCAT(FN, ' ', MN, ' ', LN) LIKE ?", ["%{$search}%"]);
            });
        }

        // Return most recent first
        $students = $query->orderBy('REGISTERED_ON', 'desc')
                          ->orderBy('LIBRARY_ID', 'desc')
                          ->paginate(20);

        return response()->json($students);
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, $libraryId)
    {
        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->firstOrFail();

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
        ]);

        $student->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Student updated successfully.',
            'student' => $student
        ]);
    }

    /**
     * Soft delete the student (mark as Inactive).
     */
    public function destroy($libraryId)
    {
        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->firstOrFail();

        $student->update([
            'ID_STATUS' => 'Inactive',
            'ID_STATUS_DATE' => Carbon::now('Asia/Manila')->format('Y-m-d')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Student marked as Inactive.'
        ]);
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
            // Load and apply email settings from the database
            $settings = Setting::where('key', 'LIKE', 'mail_%')->get()->pluck('value', 'key');

            if ($settings->isNotEmpty() && $settings->get('mail_host')) {
                $encryption = strtolower((string) $settings->get('mail_encryption', ''));
                $scheme = match($encryption) {
                    'ssl' => 'ssl',
                    'tls' => 'tls',
                    default => null,
                };

                config([
                    'mail.mailers.smtp.host'     => $settings->get('mail_host'),
                    'mail.mailers.smtp.port'     => (int) $settings->get('mail_port', 587),
                    'mail.mailers.smtp.scheme'   => $scheme,
                    'mail.mailers.smtp.username' => $settings->get('mail_username'),
                    'mail.mailers.smtp.password' => $settings->get('mail_password'),
                    'mail.from.address'          => $settings->get('mail_from_address'),
                    'mail.from.name'             => $settings->get('mail_from_name', 'Library System'),
                    'mail.default'               => 'smtp',
                ]);

                // Purge the cached transport so it rebuilds with the new config
                app('mail.manager')->purge('smtp');
            }

            $to          = $request->input('to');
            $subject     = $request->input('subject');
            $bodyText    = $request->input('body');
            $attachments = $request->file('attachments', []);

            Mail::send([], [], function ($message) use ($to, $subject, $bodyText, $attachments) {
                $message->to($to)
                        ->subject($subject)
                        ->html(nl2br(e($bodyText)));

                foreach ($attachments as $file) {
                    $message->attachData(
                        file_get_contents($file->getRealPath()),
                        $file->getClientOriginalName(),
                        ['mime' => $file->getMimeType()]
                    );
                }
            });

            // Store message in database
            \App\Models\EmailMessage::create([
                'library_id' => $request->input('library_id'),
                'subject' => $subject,
                'body' => $bodyText,
                'sent_to' => $to,
                'is_read' => true, // System messages are considered read for admin interface
                'attachments' => count($attachments) > 0 ? count($attachments) . ' file(s)' : null,
            ]);

            return response()->json(['success' => true, 'message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
