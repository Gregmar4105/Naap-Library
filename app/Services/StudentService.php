<?php

namespace App\Services;

use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Mail\StudentCredentials;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Output\QRGdImagePNG;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class StudentService
{
    protected StudentRepositoryInterface $studentRepository;

    public function __construct(StudentRepositoryInterface $studentRepository)
    {
        $this->studentRepository = $studentRepository;
    }

    public function registerStudent(array $data, ?UploadedFile $picFile, bool $isPublic = false)
    {
        $libraryId = $this->studentRepository->generateNextLibraryId();
        $now = Carbon::now('Asia/Manila');

        $picPath = null;
        if ($picFile) {
            $extension = $picFile->getClientOriginalExtension();
            $filename = $libraryId . '_' . time() . '.' . $extension;
            $picFile->storeAs('avatars', $filename, 'public');
            $picPath = 'avatars/' . $filename;
        }

        // Calculate RENEW_ON based on program semester expiration setting
        $renewOn = null;
        $courseCodeOrName = $data['COURSE'] ?? null;
        if ($courseCodeOrName) {
            $program = \App\Models\Program::where('code', $courseCodeOrName)
                ->orWhere('name', $courseCodeOrName)
                ->first();

            if ($program) {
                $renewOn = $program->calculateRenewalDate($now)->format('Y-m-d');
            }
        }

        if (!$renewOn) {
            // Default 5 months fallback if program not found
            $renewOn = $now->copy()->addMonths(5)->format('Y-m-d');
        }

        $student = $this->studentRepository->create(array_merge($data, [
            'LIBRARY_ID' => $libraryId,
            'PIC' => $picPath,
            'REGISTERED_ON' => $now->format('Y-m-d'),
            'RENEW_ON' => $renewOn,
            'ID_STATUS' => 'Active',
            'ID_STATUS_DATE' => $now->format('Y-m-d'),
        ]));

        // Dispatch notifications
        try {
            if ($isPublic) {
                $notification = new SystemNotification(
                    'New Student Registered',
                    "{$student->FN} {$student->LN} ({$student->COURSE}) has self-registered.",
                    '/student-list'
                );
            } else {
                $adminName = auth()->user()->name ?? 'Admin';
                $notification = new SystemNotification(
                    'Student Added',
                    "{$student->FN} {$student->LN} has been added to the system by {$adminName}.",
                    '/student-list'
                );
            }
            foreach (User::all() as $user) {
                $user->notify($notification);
            }
        } catch (\Exception $e) {
            Log::error('Notification Error: ' . $e->getMessage());
        }

        // Generate QR code and Barcode and send credentials mail
        try {
            $credentials = \App\Services\BarcodeService::generateStudentCredentialsImages($libraryId);

            if ($student->EMAIL) {
                Mail::to($student->EMAIL)->send(new StudentCredentials($student, $credentials['qr_code'], $credentials['barcode']));
                $this->studentRepository->update($libraryId, ['QR_SENT' => true]);
            }
        } catch (\Throwable $e) {
            Log::error('Registration Email Error: ' . $e->getMessage());
        }

        return $student;
    }

    public function updateStudent(string $libraryId, array $data, ?UploadedFile $picFile)
    {
        $student = $this->studentRepository->findByLibraryId($libraryId);
        if (!$student) {
            throw new \Exception('Student not found.');
        }

        $oldEmail = $student->EMAIL;
        $newEmail = $data['EMAIL'] ?? null;
        $emailChanged = ($newEmail !== null && strtolower(trim($newEmail)) !== strtolower(trim($oldEmail)) && !empty(trim($newEmail)));

        if ($picFile) {
            $extension = $picFile->getClientOriginalExtension();
            $filename = $student->LIBRARY_ID . '_' . time() . '.' . $extension;

            if ($student->PIC && Storage::disk('public')->exists($student->PIC)) {
                Storage::disk('public')->delete($student->PIC);
            }

            $picFile->storeAs('avatars', $filename, 'public');
            $data['PIC'] = 'avatars/' . $filename;
        }

        $this->studentRepository->update($libraryId, $data);
        $updatedStudent = $student->fresh();

        if ($emailChanged) {
            try {
                $credentials = \App\Services\BarcodeService::generateStudentCredentialsImages($libraryId);
                Mail::to($updatedStudent->EMAIL)->send(new StudentCredentials($updatedStudent, $credentials['qr_code'], $credentials['barcode']));
                $this->studentRepository->update($libraryId, ['QR_SENT' => true]);
            } catch (\Exception $e) {
                Log::error('Resend Credentials Email Error: ' . $e->getMessage());
            }
        }

        return $updatedStudent;
    }

    public function deactivateStudent(string $libraryId, ?string $note)
    {
        $student = $this->studentRepository->findByLibraryId($libraryId);
        if (!$student) {
            throw new \Exception('Student not found.');
        }

        $this->studentRepository->update($libraryId, [
            'ID_STATUS' => 'Inactive',
            'ID_STATUS_DATE' => Carbon::now('Asia/Manila')->format('Y-m-d'),
            'DEACTIVATION_NOTE' => $note
        ]);

        return $student->fresh();
    }

    public function activateStudent(string $libraryId)
    {
        $student = $this->studentRepository->findByLibraryId($libraryId);
        if (!$student) {
            throw new \Exception('Student not found.');
        }

        $this->studentRepository->update($libraryId, [
            'ID_STATUS' => 'Active',
            'ID_STATUS_DATE' => Carbon::now('Asia/Manila')->format('Y-m-d'),
            'DEACTIVATION_NOTE' => null
        ]);

        return $student->fresh();
    }

    public function sendStudentEmail(array $requestData, $attachments = [])
    {
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
                'mail.from.name'             => $settings->get('mail_from_name') ?: config('mail.from.name', 'Library System'),
                'mail.default'               => 'smtp',
            ]);

            app('mail.manager')->purge('smtp');
        }

        $to       = $requestData['to'];
        $subject  = $requestData['subject'];
        $bodyText = $requestData['body'];

        $savedAttachments = [];
        if (!empty($attachments) && is_array($attachments)) {
            \Illuminate\Support\Facades\Storage::makeDirectory('public/attachments');
            foreach ($attachments as $file) {
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    $ext = $file->getClientOriginalExtension() ?: 'bin';
                    $storedName = 'attach_' . time() . '_' . \Illuminate\Support\Str::random(6) . '.' . $ext;
                    $path = $file->storeAs('public/attachments', $storedName);
                    $url = '/storage/attachments/' . $storedName;

                    $mime = $file->getMimeType() ?: 'application/octet-stream';
                    $type = 'file';
                    if (str_starts_with($mime, 'image/')) $type = 'image';
                    elseif (str_starts_with($mime, 'video/')) $type = 'video';
                    elseif (str_starts_with($mime, 'audio/')) $type = 'audio';

                    $savedAttachments[] = [
                        'name' => $file->getClientOriginalName(),
                        'url'  => $url,
                        'mime' => $mime,
                        'type' => $type,
                        'size' => $file->getSize(),
                    ];
                }
            }
        }

        Mail::send([], [], function ($message) use ($to, $subject, $bodyText, $attachments) {
            $message->to($to)
                    ->subject($subject)
                    ->html(nl2br(e($bodyText)));

            if (!empty($attachments) && is_array($attachments)) {
                foreach ($attachments as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $message->attachData(
                            file_get_contents($file->getRealPath()),
                            $file->getClientOriginalName(),
                            ['mime' => $file->getMimeType()]
                        );
                    }
                }
            }
        });

        $fromAddress = config('mail.from.address') ?: 'naaplibrary@larable.dev';
        $libraryId = $requestData['library_id'] ?? null;
        if ($libraryId && !\App\Models\StudentInfo::where('LIBRARY_ID', $libraryId)->exists()) {
            $libraryId = null;
        }

        return \App\Models\EmailMessage::create([
            'library_id'  => $libraryId,
            'direction'   => 'outgoing',
            'from_email'  => $fromAddress,
            'to_email'    => $to,
            'subject'     => $subject,
            'body'        => $bodyText,
            'sent_to'     => $to,
            'is_read'     => true,
            'attachments' => count($savedAttachments) > 0 ? $savedAttachments : null,
        ]);
    }

    public function linkCard(string $libraryId, string $rfidNumber)
    {
        $student = $this->studentRepository->findByLibraryId($libraryId);
        if (!$student) {
            throw new \Exception('Student not found.', 404);
        }

        $existingRfid = \App\Models\StudentInfo::where('STUDENT_RFID_NUMBER', $rfidNumber)
            ->where('LIBRARY_ID', '!=', $libraryId)
            ->first();

        if ($existingRfid) {
            throw new \Exception('This RFID card is already linked to another student: ' . $existingRfid->FN . ' ' . $existingRfid->LN . ' (' . $existingRfid->STUDENT_NUMBER . ').', 422);
        }

        $this->studentRepository->update($libraryId, ['STUDENT_RFID_NUMBER' => $rfidNumber]);
        return $student->fresh();
    }

    public function linkFace(string $libraryId, array $descriptor)
    {
        $student = $this->studentRepository->findByLibraryId($libraryId);
        if (!$student) {
            throw new \Exception('Student not found.', 404);
        }

        $this->studentRepository->update($libraryId, ['FACE_EMBEDDING' => $descriptor]);
        return $student->fresh();
    }

    public function verify(string $id, string $type)
    {
        if ($type === 'rfid') {
            $student = \App\Models\StudentInfo::where('STUDENT_RFID_NUMBER', $id)->first();
        } else {
            $student = $this->studentRepository->findByLibraryId($id);
        }

        if (!$student) {
            $msg = $type === 'rfid' ? 'RFID card' : ucfirst($type);
            throw new \Exception("No student found with this {$msg}.", 404);
        }

        return $student;
    }

    public function verifyFace(array $descriptor)
    {
        $thresholdSetting = \App\Models\SensitivityThreshold::where('key', 'face_recognition')->first();
        $threshold = $thresholdSetting ? (float)$thresholdSetting->value : 0.45;

        $baseUrl = config('services.face_engine.url', 'http://127.0.0.1:8000');
        $response = \Illuminate\Support\Facades\Http::timeout(5)->post(rtrim($baseUrl, '/') . '/recognize', [
            'descriptor' => $descriptor,
            'threshold' => $threshold
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data && isset($data['match']) && $data['match']) {
                $student = $this->studentRepository->findByLibraryId($data['library_id']);
                if ($student) {
                    return [
                        'success' => true,
                        'student' => $student
                    ];
                }
            }
            
            return [
                'success' => false,
                'message' => 'Face not recognized or not registered.',
                'best_distance' => $data['distance'] ?? null
            ];
        }

        throw new \Exception('Service error. Check face recognition engine.');
    }

    public function linkTwin(string $libraryId, ?string $twinLibraryId)
    {
        $student = $this->studentRepository->findByLibraryId($libraryId);
        if (!$student) {
            throw new \Exception('Student not found.', 404);
        }

        if (empty($twinLibraryId)) {
            // Unlink twin
            if ($student->TWIN_LIBRARY_ID) {
                $oldTwin = $this->studentRepository->findByLibraryId($student->TWIN_LIBRARY_ID);
                if ($oldTwin && $oldTwin->TWIN_LIBRARY_ID === $libraryId) {
                    $this->studentRepository->update($oldTwin->LIBRARY_ID, [
                        'TWIN_LIBRARY_ID' => null,
                        'IS_TWIN' => false
                    ]);
                }
            }
            $this->studentRepository->update($libraryId, [
                'TWIN_LIBRARY_ID' => null,
                'IS_TWIN' => false
            ]);
            return $student->fresh();
        }

        if ($libraryId === $twinLibraryId) {
            throw new \Exception('A student cannot be set as their own twin.', 422);
        }

        $twinStudent = $this->studentRepository->findByLibraryId($twinLibraryId);
        if (!$twinStudent) {
            throw new \Exception('Twin student account not found.', 404);
        }

        // Bidirectional twin link
        $this->studentRepository->update($libraryId, [
            'TWIN_LIBRARY_ID' => $twinLibraryId,
            'IS_TWIN' => true
        ]);

        $this->studentRepository->update($twinLibraryId, [
            'TWIN_LIBRARY_ID' => $libraryId,
            'IS_TWIN' => true
        ]);

        return $student->fresh();
    }
}

