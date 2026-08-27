<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get list of system notifications.
     */
    public function index()
    {
        $notifications = SystemNotification::orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($n) {
                return [
                    'id'      => $n->id,
                    'type'    => $n->type,
                    'title'   => $n->title,
                    'message' => $n->message,
                    'link'    => $n->link,
                    'time'    => $n->created_at ? $n->created_at->timezone('Asia/Manila')->diffForHumans() : '',
                    'is_read' => !is_null($n->read_at),
                ];
            });

        $unreadCount = SystemNotification::whereNull('read_at')->count();

        return response()->json([
            'notifications' => $notifications,
            'unreadCount'   => $unreadCount,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        SystemNotification::whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }
}
