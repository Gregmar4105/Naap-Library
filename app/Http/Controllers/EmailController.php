<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    /**
     * Display the emails page.
     */
    public function index()
    {
        // Fetch only students who have at least one email message
        $libraryIdsWithMessages = \App\Models\EmailMessage::whereNotNull('library_id')->pluck('library_id')->unique();
        
        $students = \App\Models\StudentInfo::whereIn('LIBRARY_ID', $libraryIdsWithMessages)
            ->orderBy('REGISTERED_ON', 'desc')
            ->get();

        // Get all messages for these students to map to conversations
        $allMessages = \App\Models\EmailMessage::whereIn('library_id', $libraryIdsWithMessages)
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('library_id');

        $contacts = $students->map(function($student) use ($allMessages) {
            $studentMessages = $allMessages->get($student->LIBRARY_ID, collect([]));
            $lastMessage = $studentMessages->last();

            return [
                'id' => $student->LIBRARY_ID,
                'name' => trim($student->FN . ' ' . $student->LN) ?: 'Unknown Student',
                'avatar' => $student->PIC,
                'email' => $student->EMAIL,
                'course' => $student->COURSE,
                'lastMessage' => $lastMessage ? $lastMessage->subject : 'No messages',
                'time' => $lastMessage ? $lastMessage->created_at->format('h:i A') : '',
                'unread' => 0,
                'status' => 'offline',
                'messages' => $studentMessages->map(function($msg) {
                    return [
                        'id' => $msg->id,
                        'senderId' => 'me', // Since admin sends all these emails for now
                        'subject' => $msg->subject,
                        'text' => $msg->body,
                        'time' => $msg->created_at->format('h:i A')
                    ];
                })->toArray()
            ];
        })->values();

        return Inertia::render('emails/index', [
            'initialContacts' => $contacts
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->query('query');

        if (empty($query)) {
            return response()->json([]);
        }

        $students = \App\Models\StudentInfo::where('FN', 'LIKE', "%{$query}%")
            ->orWhere('LN', 'LIKE', "%{$query}%")
            ->orWhere('LIBRARY_ID', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get();

        $libraryIds = $students->pluck('LIBRARY_ID');

        // Get all messages for these students to map to conversations
        $allMessages = \App\Models\EmailMessage::whereIn('library_id', $libraryIds)
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('library_id');

        $contacts = $students->map(function($student) use ($allMessages) {
            $studentMessages = $allMessages->get($student->LIBRARY_ID, collect([]));
            $lastMessage = $studentMessages->last();

            return [
                'id' => $student->LIBRARY_ID,
                'name' => trim($student->FN . ' ' . $student->LN) ?: 'Unknown Student',
                'avatar' => $student->PIC,
                'email' => $student->EMAIL,
                'course' => $student->COURSE,
                'lastMessage' => $lastMessage ? $lastMessage->subject : 'No messages',
                'time' => $lastMessage ? $lastMessage->created_at->format('h:i A') : '',
                'unread' => 0,
                'status' => 'offline',
                'messages' => $studentMessages->map(function($msg) {
                    return [
                        'id' => $msg->id,
                        'senderId' => 'me',
                        'subject' => $msg->subject,
                        'text' => $msg->body,
                        'time' => $msg->created_at->format('h:i A')
                    ];
                })->toArray()
            ];
        });

        return response()->json($contacts);
    }
}
