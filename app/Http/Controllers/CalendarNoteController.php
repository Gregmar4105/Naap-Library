<?php

namespace App\Http\Controllers;

use App\Models\CalendarNote;
use Illuminate\Http\Request;

class CalendarNoteController extends Controller
{
    public function index(Request $request)
    {
        $notes = CalendarNote::orderBy('time')->get();
        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'note' => 'required|string',
        ]);

        $note = CalendarNote::create([
            'date' => $request->date,
            'time' => $request->time,
            'note' => $request->note
        ]);

        return response()->json([
            'message' => 'Note saved successfully',
            'note' => $note
        ]);
    }

    public function destroy($id)
    {
        try {
            $note = CalendarNote::findOrFail($id);
            $note->delete();
            return response()->json(['message' => 'Note deleted successfully']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Delete note failed: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
