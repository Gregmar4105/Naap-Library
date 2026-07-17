<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\LostIdRepositoryInterface;
use App\Services\LostIdService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LostLibraryIdController extends Controller
{
    protected LostIdService $lostIdService;
    protected LostIdRepositoryInterface $lostIdRepository;

    public function __construct(
        LostIdService $lostIdService,
        LostIdRepositoryInterface $lostIdRepository
    ) {
        $this->lostIdService = $lostIdService;
        $this->lostIdRepository = $lostIdRepository;
    }

    public function index()
    {
        return Inertia::render('lost-library-id');
    }

    /**
     * Search for active students to report loss.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $students = $this->lostIdRepository->searchActiveStudents($query, 20);
        return response()->json($students);
    }

    /**
     * Process the loss report and re-register the student.
     */
    public function report(Request $request)
    {
        $request->validate([
            'old_library_id' => 'required|string|exists:tbl_student_info,LIBRARY_ID',
            'location_lost' => 'required|string|max:255',
            'description' => 'nullable|string',
            'affidavit' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
        ]);

        try {
            $result = $this->lostIdService->reportLostId($request->all(), $request->file('affidavit'));

            return response()->json(array_merge([
                'success' => true,
                'message' => 'Library ID reported lost and student re-registered successfully.',
            ], $result));
        } catch (\Exception $e) {
            \Log::error('Lost ID Report Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing the report: ' . $e->getMessage()
            ], 500);
        }
    }
}
