<?php

namespace App\Http\Controllers;

use App\Models\StudentInfo;
use App\Models\StudentViolation;
use App\Models\ViolationType;
use App\Models\Setting;
use App\Models\AuditTrail;
use App\Mail\StudentViolationNotice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ViolationController extends Controller
{
    /**
     * Default maximum violations allowed per student before ID expiration.
     */
    protected const DEFAULT_MAX_VIOLATIONS = 3;

    /**
     * Display the violations index page.
     */
    public function index()
    {
        return \Inertia\Inertia::render('violations');
    }

    /**
     * Fetch all violation types, student violations, stats, and student dropdown list.
     */
    public function getData(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $typeId = $request->query('type_id');
        $status = $request->query('status');

        $maxViolations = (int) (Setting::where('key', 'max_student_violations')->value('value') ?? self::DEFAULT_MAX_VIOLATIONS);

        // Fetch violation types
        $violationTypes = ViolationType::orderBy('severity')
            ->orderBy('name')
            ->get();

        // Fetch student violations with relationships
        $query = StudentViolation::with(['student', 'violationType'])
            ->orderBy('occurred_at', 'desc');

        if ($search) {
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('STUDENT_NUMBER', 'LIKE', "%{$search}%")
                  ->orWhere('LIBRARY_ID', 'LIKE', "%{$search}%")
                  ->orWhere('FN', 'LIKE', "%{$search}%")
                  ->orWhere('LN', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$search}%"]);
            });
        }

        if ($typeId) {
            $query->where('violation_type_id', $typeId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $studentViolations = $query->get()->map(function ($sv) use ($maxViolations) {
            $activeCount = StudentViolation::where('student_library_id', $sv->student_library_id)
                ->where('status', 'Active')
                ->count();

            return [
                'id' => $sv->id,
                'student_library_id' => $sv->student_library_id,
                'violation_type_id' => $sv->violation_type_id,
                'notes' => $sv->notes,
                'occurred_at' => $sv->occurred_at ? $sv->occurred_at->format('Y-m-d H:i') : null,
                'occurred_at_display' => $sv->occurred_at ? $sv->occurred_at->format('M j, Y g:i A') : 'N/A',
                'issued_by' => $sv->issued_by,
                'status' => $sv->status,
                'resolved_at' => $sv->resolved_at ? $sv->resolved_at->format('Y-m-d H:i') : null,
                'resolution_notes' => $sv->resolution_notes,
                'student' => $sv->student ? [
                    'LIBRARY_ID' => $sv->student->LIBRARY_ID,
                    'STUDENT_NUMBER' => $sv->student->STUDENT_NUMBER,
                    'full_name' => trim(($sv->student->FN ?? '') . ' ' . ($sv->student->LN ?? '')),
                    'FN' => $sv->student->FN,
                    'LN' => $sv->student->LN,
                    'COURSE' => $sv->student->COURSE,
                    'PIC' => $sv->student->PIC,
                    'EMAIL' => $sv->student->EMAIL,
                    'ID_STATUS' => $sv->student->ID_STATUS,
                    'DEACTIVATION_NOTE' => $sv->student->DEACTIVATION_NOTE,
                    'active_violations_count' => $activeCount,
                    'is_expired' => strtolower((string)$sv->student->ID_STATUS) === 'expired',
                ] : null,
                'violation_type' => $sv->violationType ? [
                    'id' => $sv->violationType->id,
                    'code' => $sv->violationType->code,
                    'name' => $sv->violationType->name,
                    'severity' => $sv->violationType->severity,
                ] : null,
            ];
        });

        // Summary statistics
        $stats = [
            'total_types' => $violationTypes->count(),
            'total_violations' => StudentViolation::count(),
            'active_violations' => StudentViolation::where('status', 'Active')->count(),
            'expired_students' => StudentInfo::where('ID_STATUS', 'Expired')->count(),
            'max_allowed' => $maxViolations,
        ];

        // List of students for dropdown selection
        $studentsList = StudentInfo::select('LIBRARY_ID', 'STUDENT_NUMBER', 'FN', 'LN', 'COURSE', 'EMAIL', 'ID_STATUS', 'PIC')
            ->orderBy('LN')
            ->orderBy('FN')
            ->get()
            ->map(function ($s) {
                $activeViolationsCount = StudentViolation::where('student_library_id', $s->LIBRARY_ID)
                    ->where('status', 'Active')
                    ->count();

                return [
                    'LIBRARY_ID' => $s->LIBRARY_ID,
                    'STUDENT_NUMBER' => $s->STUDENT_NUMBER,
                    'full_name' => trim(($s->FN ?? '') . ' ' . ($s->LN ?? '')),
                    'FN' => $s->FN,
                    'LN' => $s->LN,
                    'COURSE' => $s->COURSE,
                    'EMAIL' => $s->EMAIL,
                    'ID_STATUS' => $s->ID_STATUS,
                    'PIC' => $s->PIC,
                    'active_violations_count' => $activeViolationsCount,
                ];
            });

        return response()->json([
            'violation_types' => $violationTypes,
            'student_violations' => $studentViolations,
            'stats' => $stats,
            'students' => $studentsList,
        ]);
    }

    /**
     * Create a new Violation Type.
     */
    public function storeViolationType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:tbl_violation_types,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'severity' => 'required|string|in:Minor,Moderate,Major,Critical',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $type = ViolationType::create($validated);

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'System Admin',
            'auditable_type' => ViolationType::class,
            'auditable_id' => (string) $type->id,
            'event' => 'create_violation_type',
            'activity' => "Created violation type '{$type->name}' ({$type->code})",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Violation type created successfully.',
            'violation_type' => $type,
        ]);
    }

    /**
     * Update an existing Violation Type.
     */
    public function updateViolationType(Request $request, int $id): JsonResponse
    {
        $type = ViolationType::findOrFail($id);

        $validated = $request->validate([
            'code' => "required|string|max:50|unique:tbl_violation_types,code,{$id}",
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'severity' => 'required|string|in:Minor,Moderate,Major,Critical',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $type->update($validated);

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'System Admin',
            'auditable_type' => ViolationType::class,
            'auditable_id' => (string) $type->id,
            'event' => 'update_violation_type',
            'activity' => "Updated violation type '{$type->name}'",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Violation type updated successfully.',
            'violation_type' => $type,
        ]);
    }

    /**
     * Delete a Violation Type.
     */
    public function destroyViolationType(Request $request, int $id): JsonResponse
    {
        $type = ViolationType::findOrFail($id);
        $name = $type->name;

        $type->delete();

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'System Admin',
            'auditable_type' => ViolationType::class,
            'auditable_id' => (string) $id,
            'event' => 'delete_violation_type',
            'activity' => "Deleted violation type '{$name}'",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Violation type deleted successfully.',
        ]);
    }

    /**
     * Issue/Record a violation for a student.
     */
    public function storeStudentViolation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_library_id' => 'required|string|exists:tbl_student_info,LIBRARY_ID',
            'violation_type_id' => 'required|integer|exists:tbl_violation_types,id',
            'notes' => 'nullable|string',
            'occurred_at' => 'nullable|date',
            'send_email' => 'nullable|boolean',
        ]);

        $student = StudentInfo::where('LIBRARY_ID', $validated['student_library_id'])->firstOrFail();
        $violationType = ViolationType::findOrFail($validated['violation_type_id']);
        $issuerName = auth()->user()->name ?? 'Library Admin';

        $studentViolation = StudentViolation::create([
            'student_library_id' => $student->LIBRARY_ID,
            'violation_type_id' => $violationType->id,
            'notes' => $validated['notes'] ?? null,
            'occurred_at' => $validated['occurred_at'] ?? now(),
            'issued_by' => $issuerName,
            'status' => 'Active',
        ]);

        // Calculate total active violations for this student
        $activeCount = StudentViolation::where('student_library_id', $student->LIBRARY_ID)
            ->where('status', 'Active')
            ->count();

        $maxAllowed = (int) (Setting::where('key', 'max_student_violations')->value('value') ?? self::DEFAULT_MAX_VIOLATIONS);
        $isExpired = false;

        // Policy Check: If student reaches or exceeds max allowed violations, mark ID_STATUS as Expired
        if ($activeCount >= $maxAllowed) {
            $isExpired = true;
            $student->update([
                'ID_STATUS' => 'Expired',
                'ID_STATUS_DATE' => now()->toDateString(),
                'DEACTIVATION_NOTE' => "Library ID & Registration EXPIRED due to accumulating {$activeCount} violations (Max allowed: {$maxAllowed}). Account reactivation required.",
            ]);

            AuditTrail::create([
                'user_id' => auth()->id(),
                'user_name' => $issuerName,
                'auditable_type' => StudentInfo::class,
                'auditable_id' => $student->LIBRARY_ID,
                'event' => 'student_expired_due_to_violations',
                'activity' => "Student {$student->FN} {$student->LN} ({$student->LIBRARY_ID}) status set to Expired after receiving {$activeCount} violations.",
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);
        }

        // Send HTML email notification if requested and student has valid email
        $emailSent = false;
        $shouldSendEmail = $request->boolean('send_email', true);

        if ($shouldSendEmail && !empty($student->EMAIL)) {
            try {
                $settings = Setting::where('key', 'LIKE', 'mail_%')->get()->pluck('value', 'key');
                $mailHost = $settings->get('mail_host');

                if ($settings->isNotEmpty() && !empty($mailHost)) {
                    $encryption = strtolower((string) $settings->get('mail_encryption', ''));
                    $port = (int) ($settings->get('mail_port') ?: 587);
                    $scheme = match($encryption) {
                        'ssl', 'smtps' => 'smtps',
                        'tls' => ($port === 465 ? 'smtps' : null),
                        default => null,
                    };

                    config([
                        'mail.mailers.smtp.host'     => $mailHost,
                        'mail.mailers.smtp.port'     => $port,
                        'mail.mailers.smtp.scheme'   => $scheme,
                        'mail.mailers.smtp.username' => $settings->get('mail_username') ?: config('mail.mailers.smtp.username'),
                        'mail.mailers.smtp.password' => $settings->get('mail_password') ?: config('mail.mailers.smtp.password'),
                        'mail.from.address'          => $settings->get('mail_from_address') ?: config('mail.from.address'),
                        'mail.from.name'             => $settings->get('mail_from_name') ?: config('mail.from.name', 'NAAP Library'),
                        'mail.default'               => 'smtp',
                    ]);

                    app('mail.manager')->purge('smtp');
                }

                Mail::to($student->EMAIL)->send(
                    new StudentViolationNotice(
                        $studentViolation,
                        $student,
                        $violationType,
                        $activeCount,
                        $maxAllowed,
                        $isExpired
                    )
                );
                $emailSent = true;
            } catch (\Exception $e) {
                Log::error("Failed to send violation email to {$student->EMAIL}: " . $e->getMessage());
            }
        }

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => $issuerName,
            'auditable_type' => StudentViolation::class,
            'auditable_id' => (string) $studentViolation->id,
            'event' => 'issue_student_violation',
            'activity' => "Issued violation '{$violationType->name}' to student {$student->FN} {$student->LN} ({$student->LIBRARY_ID})",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student violation recorded successfully.' . ($emailSent ? ' Email notification sent.' : ''),
            'student_violation' => $studentViolation,
            'active_violations_count' => $activeCount,
            'is_expired' => $isExpired,
            'email_sent' => $emailSent,
        ]);
    }

    /**
     * Update an existing Student Violation record.
     */
    public function updateStudentViolation(Request $request, int $id): JsonResponse
    {
        $studentViolation = StudentViolation::findOrFail($id);

        $validated = $request->validate([
            'violation_type_id' => 'required|integer|exists:tbl_violation_types,id',
            'notes' => 'nullable|string',
            'occurred_at' => 'required|date',
            'status' => 'required|string|in:Active,Resolved,Dismissed',
            'resolution_notes' => 'nullable|string',
        ]);

        $oldStatus = $studentViolation->status;
        $newStatus = $validated['status'];

        if ($newStatus !== 'Active' && $oldStatus === 'Active') {
            $validated['resolved_at'] = now();
        }

        $studentViolation->update($validated);

        // Check if student status should be re-evaluated
        $student = StudentInfo::where('LIBRARY_ID', $studentViolation->student_library_id)->first();
        if ($student) {
            $activeCount = StudentViolation::where('student_library_id', $student->LIBRARY_ID)
                ->where('status', 'Active')
                ->count();
            $maxAllowed = (int) (Setting::where('key', 'max_student_violations')->value('value') ?? self::DEFAULT_MAX_VIOLATIONS);

            // If active violations dropped below max and student was expired due to violations, clear note if updated
            if ($activeCount < $maxAllowed && strtolower((string)$student->ID_STATUS) === 'expired') {
                // Keep expired unless manually reactivated, but update note info
            }
        }

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'Library Admin',
            'auditable_type' => StudentViolation::class,
            'auditable_id' => (string) $studentViolation->id,
            'event' => 'update_student_violation',
            'activity' => "Updated violation record #{$id} status to '{$newStatus}'",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student violation record updated successfully.',
            'student_violation' => $studentViolation,
        ]);
    }

    /**
     * Delete a Student Violation record.
     */
    public function destroyStudentViolation(Request $request, int $id): JsonResponse
    {
        $studentViolation = StudentViolation::findOrFail($id);
        $studentId = $studentViolation->student_library_id;

        $studentViolation->delete();

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'Library Admin',
            'auditable_type' => StudentViolation::class,
            'auditable_id' => (string) $id,
            'event' => 'delete_student_violation',
            'activity' => "Deleted violation record #{$id} for student ID {$studentId}",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student violation record deleted successfully.',
        ]);
    }

    /**
     * Reactivate a student's library ID & account registration.
     */
    public function reactivateStudent(Request $request, string $libraryId): JsonResponse
    {
        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->firstOrFail();

        $student->update([
            'ID_STATUS' => 'Active',
            'ID_STATUS_DATE' => now()->toDateString(),
            'DEACTIVATION_NOTE' => null,
        ]);

        AuditTrail::create([
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'Library Admin',
            'auditable_type' => StudentInfo::class,
            'auditable_id' => $student->LIBRARY_ID,
            'event' => 'reactivate_student_account',
            'activity' => "Manually reactivated account for student {$student->FN} {$student->LN} ({$student->LIBRARY_ID})",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Student registration and Library ID reactivated successfully.",
            'student' => $student,
        ]);
    }
}
