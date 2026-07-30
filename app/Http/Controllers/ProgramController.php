<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ProgramController extends Controller
{
    /**
     * Display the programs management page.
     */
    public function index()
    {
        return Inertia::render('programs');
    }

    /**
     * Get paginated or filtered programs data with KPI statistics.
     */
    public function getData(Request $request)
    {
        $search = trim($request->input('search', ''));
        $departmentFilter = trim($request->input('department', ''));
        $statusFilter = trim($request->input('status', ''));

        $query = Program::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($departmentFilter !== '') {
            $query->where('department', $departmentFilter);
        }

        if ($statusFilter !== '') {
            $query->where('status', $statusFilter);
        }

        $programs = $query->orderBy('code', 'asc')->get();

        // Calculate KPI Statistics
        $totalPrograms = Program::count();
        $activePrograms = Program::where('status', 'Active')->count();
        $avgDurationYears = round(Program::avg('duration_years') ?? 4.0, 1);
        $departments = Program::whereNotNull('department')->where('department', '!=', '')->distinct()->pluck('department');

        return response()->json([
            'programs' => $programs,
            'stats' => [
                'total' => $totalPrograms,
                'active' => $activePrograms,
                'avg_duration_years' => $avgDurationYears,
                'departments_count' => $departments->count(),
            ],
            'departments' => $departments,
        ]);
    }

    /**
     * Get active programs list for registration dropdowns.
     */
    public function getActivePrograms()
    {
        $programs = Program::where('status', 'Active')
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'department', 'duration_years', 'duration_months', 'semester_duration_months', 'semester_expiration_date', 'duration_display']);

        return response()->json($programs);
    }

    /**
     * Store a newly created program.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:tbl_programs,code',
            'name' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'duration_years' => 'required|numeric|min:0.1|max:10',
            'duration_months' => 'nullable|integer|min:1|max:120',
            'semester_duration_months' => 'required|integer|min:1|max:24',
            'semester_expiration_date' => 'nullable|date',
            'duration_display' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'status' => 'required|in:Active,Inactive',
        ]);

        if (empty($validated['duration_months'])) {
            $validated['duration_months'] = (int) round($validated['duration_years'] * 12);
        }

        try {
            $program = Program::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Program created successfully!',
                'program' => $program,
            ]);
        } catch (\Exception $e) {
            Log::error('Create Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create program: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified program.
     */
    public function update(Request $request, $id)
    {
        $program = Program::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:tbl_programs,code,' . $id,
            'name' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'duration_years' => 'required|numeric|min:0.1|max:10',
            'duration_months' => 'nullable|integer|min:1|max:120',
            'semester_duration_months' => 'required|integer|min:1|max:24',
            'semester_expiration_date' => 'nullable|date',
            'duration_display' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'status' => 'required|in:Active,Inactive',
        ]);

        if (empty($validated['duration_months'])) {
            $validated['duration_months'] = (int) round($validated['duration_years'] * 12);
        }

        try {
            $program->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Program updated successfully!',
                'program' => $program,
            ]);
        } catch (\Exception $e) {
            Log::error('Update Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update program: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete the specified program.
     */
    public function destroy($id)
    {
        try {
            $program = Program::findOrFail($id);
            $program->delete();

            return response()->json([
                'success' => true,
                'message' => 'Program deleted successfully!',
            ]);
        } catch (\Exception $e) {
            Log::error('Delete Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete program: ' . $e->getMessage(),
            ], 500);
        }
    }
}
