<?php

namespace App\Http\Controllers;

use App\Models\EmailMessage;
use App\Models\StudentInfo;
use App\Services\ImapService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailController extends Controller
{
    /**
     * Display the emails page.
     */
    public function index()
    {
        // Try fetching new emails on page load
        try {
            (new ImapService())->fetchNewEmails();
        } catch (\Exception $e) {
            // Log or ignore fetch error on render
        }

        $contacts = $this->buildContactsList();

        return Inertia::render('emails/index', [
            'initialContacts' => $contacts,
        ]);
    }

    /**
     * Sync endpoint for real-time polling.
     */
    public function sync()
    {
        $newCount = 0;
        try {
            $newCount = (new ImapService())->fetchNewEmails();
        } catch (\Exception $e) {
            // Ignore fetch error
        }

        $contacts = $this->buildContactsList();

        return response()->json([
            'newCount' => $newCount,
            'contacts' => $contacts,
        ]);
    }

    /**
     * Build contacts list with complete conversation histories.
     */
    protected function buildContactsList()
    {
        // Get all unique library IDs and email addresses in email messages
        $messages = EmailMessage::orderBy('created_at', 'asc')->get();

        // Group messages by contact key (library_id if present, else from_email or sent_to)
        $grouped = $messages->groupBy(function ($msg) {
            if ($msg->library_id) {
                return 'lib:' . $msg->library_id;
            }
            if ($msg->direction === 'incoming' && $msg->from_email) {
                return 'email:' . strtolower($msg->from_email);
            }
            if ($msg->to_email) {
                return 'email:' . strtolower($msg->to_email);
            }
            return 'email:' . strtolower($msg->sent_to ?: 'unknown');
        });

        // Collect all referenced library IDs & emails
        $libraryIds = [];
        $emailAddresses = [];

        foreach ($grouped as $key => $msgs) {
            if (str_starts_with($key, 'lib:')) {
                $libraryIds[] = substr($key, 4);
            } else {
                $emailAddresses[] = substr($key, 6);
            }
        }

        // Fetch student records
        $studentsByLib = StudentInfo::whereIn('LIBRARY_ID', array_filter($libraryIds))->get()->keyBy('LIBRARY_ID');
        $studentsByEmail = StudentInfo::whereIn('EMAIL', array_filter($emailAddresses))->get()->keyBy(function ($s) {
            return strtolower($s->EMAIL);
        });

        $contacts = collect();

        foreach ($grouped as $key => $msgs) {
            $lastMsg = $msgs->last();
            $unreadCount = $msgs->where('direction', 'incoming')->where('is_read', false)->count();

            $student = null;
            $email = '';
            $id = $key;
            $name = '';
            $avatar = null;
            $course = 'External Email';

            if (str_starts_with($key, 'lib:')) {
                $libId = substr($key, 4);
                $student = $studentsByLib->get($libId);
                $id = $libId;
            } else {
                $emailAddr = substr($key, 6);
                $student = $studentsByEmail->get($emailAddr);
                $email = $emailAddr;
            }

            if ($student) {
                $id = $student->LIBRARY_ID;
                $name = trim($student->FN . ' ' . $student->LN) ?: 'Student (' . $student->LIBRARY_ID . ')';
                $avatar = $student->PIC;
                $email = $student->EMAIL ?: $email;
                $course = $student->COURSE ?: 'Student';
            } else {
                if (empty($name)) {
                    $name = $msgs->first()->from_email ?: ($msgs->first()->sent_to ?: $email);
                }
            }

            $imapService = new ImapService();

            $mappedMessages = $msgs->map(function ($m) use ($imapService) {
                $isIncoming = $m->direction === 'incoming';
                $cleanBody = $imapService->stripQuotedReplies($m->body ?: '');
                return [
                    'id'       => $m->id,
                    'senderId' => $isIncoming ? 'them' : 'me',
                    'subject'  => $m->subject,
                    'text'     => $cleanBody ?: ($m->body ?: ''),
                    'time'     => $m->created_at ? $m->created_at->timezone('Asia/Manila')->format('h:i A') : '',
                    'date'     => $m->created_at ? $m->created_at->timezone('Asia/Manila')->format('M d, Y') : '',
                ];
            })->values()->toArray();

            $bodyPreview = '';
            if ($lastMsg) {
                $cleanLast = $imapService->stripQuotedReplies($lastMsg->body ?: '');
                $bodyPreview = trim(preg_replace('/\s+/', ' ', strip_tags($cleanLast)));
            }

            $contacts->push([
                'id'          => $id,
                'name'        => $name,
                'avatar'      => $avatar,
                'email'       => $email,
                'course'      => $course,
                'lastMessage' => $bodyPreview ?: ($lastMsg->subject ?: 'No messages'),
                'time'        => $lastMsg && $lastMsg->created_at ? $lastMsg->created_at->timezone('Asia/Manila')->format('h:i A') : '',
                'unread'      => $unreadCount,
                'status'      => 'online',
                'messages'    => $mappedMessages,
            ]);
        }

        return $contacts->values();
    }

    public function search(Request $request)
    {
        $query = $request->query('query');

        if (empty($query)) {
            return response()->json([]);
        }

        $students = StudentInfo::where('FN', 'LIKE', "%{$query}%")
            ->orWhere('LN', 'LIKE', "%{$query}%")
            ->orWhere('LIBRARY_ID', 'LIKE', "%{$query}%")
            ->orWhere('EMAIL', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get();

        $imapService = new ImapService();

        $contacts = $students->map(function ($student) use ($imapService) {
            $msgs = EmailMessage::where('library_id', $student->LIBRARY_ID)
                ->orWhere('from_email', $student->EMAIL)
                ->orWhere('to_email', $student->EMAIL)
                ->orderBy('created_at', 'asc')
                ->get();

            $lastMsg = $msgs->last();
            $bodyPreview = '';
            if ($lastMsg) {
                $cleanLast = $imapService->stripQuotedReplies($lastMsg->body ?: '');
                $bodyPreview = trim(preg_replace('/\s+/', ' ', strip_tags($cleanLast)));
            }

            return [
                'id'          => $student->LIBRARY_ID,
                'name'        => trim($student->FN . ' ' . $student->LN) ?: 'Unknown Student',
                'avatar'      => $student->PIC,
                'email'       => $student->EMAIL,
                'course'      => $student->COURSE,
                'lastMessage' => $bodyPreview ?: ($lastMsg->subject ?: 'No messages'),
                'time'        => $lastMsg && $lastMsg->created_at ? $lastMsg->created_at->timezone('Asia/Manila')->format('h:i A') : '',
                'unread'      => 0,
                'status'      => 'online',
                'messages'    => $msgs->map(function ($m) use ($imapService) {
                    $cleanBody = $imapService->stripQuotedReplies($m->body ?: '');
                    return [
                        'id'       => $m->id,
                        'senderId' => $m->direction === 'incoming' ? 'them' : 'me',
                        'subject'  => $m->subject,
                        'text'     => $cleanBody ?: ($m->body ?: ''),
                        'time'     => $m->created_at ? $m->created_at->timezone('Asia/Manila')->format('h:i A') : '',
                    ];
                })->toArray(),
            ];
        });

        return response()->json($contacts);
    }
}
