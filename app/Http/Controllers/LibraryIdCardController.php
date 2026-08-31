<?php

namespace App\Http\Controllers;

use App\Models\LibraryIdCard;
use App\Models\Setting;
use App\Models\StudentInfo;
use App\Services\BarcodeService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LibraryIdCardController extends Controller
{
    /**
     * Display the Library ID Cards dashboard & template settings.
     */
    public function index(Request $request)
    {
        $search = trim($request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $perPage = (int) $request->input('per_page', 15);

        $query = StudentInfo::query()->where(function ($q) {
            $q->whereNull('ID_STATUS')
              ->orWhere('ID_STATUS', '!=', 'Deactivated');
        });

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('LIBRARY_ID', 'LIKE', "%{$search}%")
                  ->orWhere('STUDENT_NUMBER', 'LIKE', "%{$search}%")
                  ->orWhere('FN', 'LIKE', "%{$search}%")
                  ->orWhere('LN', 'LIKE', "%{$search}%")
                  ->orWhere('COURSE', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$search}%"]);
            });
        }

        // Fetch students with their active and past ID card records
        $studentsQuery = $query->orderBy('REGISTERED_ON', 'desc')
            ->orderBy('LIBRARY_ID', 'desc')
            ->with(['activeIdCard', 'idCards' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }]);

        if ($statusFilter === 'active') {
            $studentsQuery->whereHas('activeIdCard');
        } elseif ($statusFilter === 'unissued') {
            $studentsQuery->whereDoesntHave('activeIdCard');
        }

        $students = $studentsQuery->paginate($perPage)->withQueryString();

        // Attach barcode Data URIs & formatted info for active cards
        $students->getCollection()->transform(function ($student) {
            $activeCard = $student->activeIdCard;
            $cardData = null;
            if ($activeCard) {
                $credentials = BarcodeService::generateStudentCredentialsImages($activeCard->library_id_number);
                $cardData = [
                    'id' => $activeCard->id,
                    'library_id_number' => $activeCard->library_id_number,
                    'barcode_value' => $activeCard->barcode_value,
                    'barcode_image' => $credentials['barcode'] ?? null,
                    'status' => $activeCard->status,
                    'issued_at' => $activeCard->issued_at ? $activeCard->issued_at->format('Y-m-d H:i') : null,
                    'printed_at' => $activeCard->printed_at ? $activeCard->printed_at->format('Y-m-d H:i') : null,
                ];
            } else {
                // If student doesn't have an ID card record yet, prepare potential ID barcode
                $credentials = BarcodeService::generateStudentCredentialsImages($student->LIBRARY_ID);
                $cardData = [
                    'id' => null,
                    'library_id_number' => $student->LIBRARY_ID,
                    'barcode_value' => $student->LIBRARY_ID,
                    'barcode_image' => $credentials['barcode'] ?? null,
                    'status' => 'UNISSUED',
                    'issued_at' => null,
                    'printed_at' => null,
                ];
            }
            $student->current_card = $cardData;
            return $student;
        });

        // Template settings
        $settings = $this->getTemplateSettings();

        return Inertia::render('id-cards/index', [
            'students' => $students,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
            'templateSettings' => $settings,
        ]);
    }

    /**
     * Issue a new Library ID Card for a single student.
     */
    public function issueCard(Request $request, string $studentLibraryId)
    {
        $student = StudentInfo::where('LIBRARY_ID', $studentLibraryId)->firstOrFail();

        DB::beginTransaction();
        try {
            // Deactivate any existing active cards for this student
            LibraryIdCard::where('student_library_id', $student->LIBRARY_ID)
                ->where('status', 'ACTIVE')
                ->update(['status' => 'REPLACED']);

            $newIdNumber = $this->generateNextIdNumber();
            $currentYear = (int) Carbon::now('Asia/Manila')->format('Y');

            $card = LibraryIdCard::create([
                'student_library_id' => $student->LIBRARY_ID,
                'library_id_number' => $newIdNumber,
                'barcode_value' => $newIdNumber,
                'created_year' => $currentYear,
                'status' => 'ACTIVE',
                'issued_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', "Library ID {$newIdNumber} issued successfully for {$student->FN} {$student->LN}.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to issue Library ID Card: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to issue Library ID Card: ' . $e->getMessage());
        }
    }

    /**
     * Batch issue Library ID Cards for multiple selected members.
     */
    public function batchIssueCards(Request $request)
    {
        $request->validate([
            'student_library_ids' => 'required|array|min:1',
            'student_library_ids.*' => 'string|exists:tbl_student_info,LIBRARY_ID',
        ]);

        $ids = $request->input('student_library_ids');
        $issuedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($ids as $studentLibraryId) {
                $student = StudentInfo::where('LIBRARY_ID', $studentLibraryId)->first();
                if (!$student) continue;

                // Check if active card already exists
                $existingActive = LibraryIdCard::where('student_library_id', $student->LIBRARY_ID)
                    ->where('status', 'ACTIVE')
                    ->first();

                if (!$existingActive) {
                    $newIdNumber = $this->generateNextIdNumber();
                    $currentYear = (int) Carbon::now('Asia/Manila')->format('Y');

                    LibraryIdCard::create([
                        'student_library_id' => $student->LIBRARY_ID,
                        'library_id_number' => $newIdNumber,
                        'barcode_value' => $newIdNumber,
                        'created_year' => $currentYear,
                        'status' => 'ACTIVE',
                        'issued_at' => now(),
                    ]);
                    $issuedCount++;
                }
            }

            DB::commit();
            return redirect()->back()->with('success', "Successfully issued {$issuedCount} new Library ID cards.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to batch issue Library ID cards: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to batch issue cards: ' . $e->getMessage());
        }
    }

    /**
     * Mark an existing card as reprinted (updates printed_at without incrementing sequence).
     */
    public function reprintCard(Request $request, int $cardId)
    {
        $card = LibraryIdCard::findOrFail($cardId);
        $card->update([
            'printed_at' => now(),
            'status' => 'ISSUED',
        ]);

        return redirect()->back()->with('success', "Library ID {$card->library_id_number} marked as printed.");
    }

    /**
     * Mark cards as ISSUED automatically after a successful print.
     */
    public function markAsIssued(Request $request)
    {
        $request->validate([
            'student_library_ids' => 'required|array|min:1',
            'student_library_ids.*' => 'string',
        ]);

        $studentLibIds = $request->input('student_library_ids');
        $updatedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($studentLibIds as $studentLibId) {
                $student = StudentInfo::where('LIBRARY_ID', $studentLibId)->first();
                if (!$student) continue;

                // Find active or latest card
                $card = LibraryIdCard::where('student_library_id', $student->LIBRARY_ID)
                    ->whereIn('status', ['ACTIVE', 'ISSUED'])
                    ->latest()
                    ->first();

                if (!$card) {
                    // Create card if missing
                    $newIdNumber = $this->generateNextIdNumber();
                    $currentYear = (int) Carbon::now('Asia/Manila')->format('Y');

                    $card = LibraryIdCard::create([
                        'student_library_id' => $student->LIBRARY_ID,
                        'library_id_number' => $newIdNumber,
                        'barcode_value' => $newIdNumber,
                        'created_year' => $currentYear,
                        'status' => 'ISSUED',
                        'issued_at' => now(),
                        'printed_at' => now(),
                    ]);
                } else {
                    $card->update([
                        'status' => 'ISSUED',
                        'printed_at' => now(),
                        'issued_at' => $card->issued_at ?? now(),
                    ]);
                }

                $updatedCount++;
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "Successfully marked {$updatedCount} cards as ISSUED.",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to mark cards as ISSUED: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update card status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update card status (ACTIVE, ISSUED, REVOKED, REPLACED, EXPIRED).
     */
    public function updateStatus(Request $request, int $cardId)
    {
        $request->validate([
            'status' => 'required|string|in:ACTIVE,ISSUED,REVOKED,REPLACED,EXPIRED',
        ]);

        $card = LibraryIdCard::findOrFail($cardId);
        $card->update(['status' => $request->status]);

        return redirect()->back()->with('success', "Card {$card->library_id_number} status updated to {$request->status}.");
    }

    /**
     * Get preview data for single or batch print sheets.
     */
    public function getPrintData(Request $request)
    {
        $request->validate([
            'student_library_ids' => 'required|array|min:1',
            'student_library_ids.*' => 'string',
        ]);

        $ids = $request->input('student_library_ids');

        $items = [];
        foreach ($ids as $studentLibId) {
            $student = StudentInfo::where('LIBRARY_ID', $studentLibId)->first();
            if (!$student) continue;

            $activeCard = LibraryIdCard::where('student_library_id', $student->LIBRARY_ID)
                ->where('status', 'ACTIVE')
                ->latest()
                ->first();

            $idNumber = $activeCard ? $activeCard->library_id_number : $student->LIBRARY_ID;
            $cardId = $activeCard ? $activeCard->id : null;

            $credentials = BarcodeService::generateStudentCredentialsImages($idNumber);

            $items[] = [
                'card_id' => $cardId,
                'student_library_id' => $student->LIBRARY_ID,
                'student_number' => $student->STUDENT_NUMBER,
                'full_name' => trim("{$student->FN} {$student->MN} {$student->LN}"),
                'first_name' => $student->FN,
                'last_name' => $student->LN,
                'course' => $student->COURSE ?? 'N/A',
                'photo' => $student->PIC ? (str_starts_with($student->PIC, 'http') || str_starts_with($student->PIC, 'data:') ? $student->PIC : asset('storage/' . ltrim($student->PIC, '/'))) : null,
                'library_id_number' => $idNumber,
                'barcode_value' => $idNumber,
                'barcode_image' => $credentials['barcode'] ?? null,
                'status' => $activeCard ? $activeCard->status : 'ACTIVE',
            ];
        }

        return response()->json([
            'items' => $items,
            'templateSettings' => $this->getTemplateSettings(),
        ]);
    }

    /**
     * Update template configuration settings.
     */
    public function updateTemplateSettings(Request $request)
    {
        $request->validate([
            'country' => 'required|string|max:150',
            'school_name' => 'required|string|max:200',
            'sub_header' => 'nullable|string|max:300',
            'address' => 'nullable|string|max:250',
            'card_width_mm' => 'nullable|numeric|min:50|max:200',
            'card_height_mm' => 'nullable|numeric|min:30|max:150',
            'librarian_name' => 'required|string|max:150',
            'librarian_title' => 'required|string|max:150',
            'rules' => 'required|array',
            'rules.*' => 'string|max:200',
            'logo' => 'nullable|image|max:2048',
            'librarian_signature' => 'nullable|image|max:2048',
            'font_size_country' => 'nullable|numeric|min:2|max:24',
            'font_size_school_name' => 'nullable|numeric|min:2|max:24',
            'font_size_sub_header' => 'nullable|numeric|min:2|max:24',
            'font_size_address' => 'nullable|numeric|min:2|max:24',
            'font_size_student_name' => 'nullable|numeric|min:2|max:24',
            'font_size_id_number' => 'nullable|numeric|min:2|max:24',
            'font_size_course' => 'nullable|numeric|min:2|max:24',
            'font_size_role' => 'nullable|numeric|min:2|max:24',
            'font_size_librarian_name' => 'nullable|numeric|min:2|max:24',
            'font_size_librarian_title' => 'nullable|numeric|min:2|max:24',
            'font_size_rules' => 'nullable|numeric|min:2|max:24',
        ]);

        $settingsMap = [
            'id_card_country' => $request->country,
            'id_card_school_name' => $request->school_name,
            'id_card_sub_header' => $request->sub_header,
            'id_card_address' => $request->address,
            'id_card_width_mm' => $request->input('card_width_mm', 85.60),
            'id_card_height_mm' => $request->input('card_height_mm', 53.98),
            'id_card_librarian_name' => $request->librarian_name,
            'id_card_librarian_title' => $request->librarian_title,
            'id_card_rules' => json_encode(array_values(array_filter($request->rules))),
            'id_card_font_size_country' => $request->input('font_size_country', 4.8),
            'id_card_font_size_school_name' => $request->input('font_size_school_name', 6.6),
            'id_card_font_size_sub_header' => $request->input('font_size_sub_header', 4.2),
            'id_card_font_size_address' => $request->input('font_size_address', 4.2),
            'id_card_font_size_student_name' => $request->input('font_size_student_name', 7.8),
            'id_card_font_size_id_number' => $request->input('font_size_id_number', 6.2),
            'id_card_font_size_course' => $request->input('font_size_course', 6.8),
            'id_card_font_size_role' => $request->input('font_size_role', 6.8),
            'id_card_font_size_librarian_name' => $request->input('font_size_librarian_name', 6.5),
            'id_card_font_size_librarian_title' => $request->input('font_size_librarian_title', 5.5),
            'id_card_font_size_rules' => $request->input('font_size_rules', 5.0),
        ];

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('id_templates', 'public');
            $settingsMap['id_card_logo'] = Storage::url($path);
        }

        if ($request->hasFile('librarian_signature')) {
            $path = $request->file('librarian_signature')->store('id_templates', 'public');
            $settingsMap['id_card_librarian_signature'] = Storage::url($path);
        }

        foreach ($settingsMap as $key => $val) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $val]
            );
        }

        return redirect()->back()->with('success', 'Library ID Card template settings updated successfully.');
    }

    /**
     * Helper to get template configuration with standard defaults.
     */
    protected function getTemplateSettings(): array
    {
        $settingsRaw = Setting::where('key', 'LIKE', 'id_card_%')->pluck('value', 'key')->toArray();

        $defaultRules = [
            'NO UNIFORM, NO LIBRARY ID, NO ENTRY',
            'HELD RESPONSIBLE FOR ALL MATERIALS BORROWED',
            'NON-TRANSFERABLE',
        ];

        $rulesJson = $settingsRaw['id_card_rules'] ?? null;
        $rules = $rulesJson ? json_decode($rulesJson, true) : $defaultRules;

        return [
            'country' => $settingsRaw['id_card_country'] ?? 'Republic of the Philippines',
            'school_name' => $settingsRaw['id_card_school_name'] ?? 'NATIONAL AVIATION ACADEMY OF THE PHILIPPINES',
            'sub_header' => $settingsRaw['id_card_sub_header'] ?? "The National Professional Institution for Aviation\n(Formerly Philippine State College of Aeronautics)",
            'address' => $settingsRaw['id_card_address'] ?? 'Piccio Garden, Villamor, Pasay City',
            'card_width_mm' => isset($settingsRaw['id_card_width_mm']) ? (float) $settingsRaw['id_card_width_mm'] : 85.60,
            'card_height_mm' => isset($settingsRaw['id_card_height_mm']) ? (float) $settingsRaw['id_card_height_mm'] : 53.98,
            'logo' => $settingsRaw['id_card_logo'] ?? null,
            'librarian_name' => $settingsRaw['id_card_librarian_name'] ?? 'ESTRELLA E. YAGO, DPA. RL',
            'librarian_title' => $settingsRaw['id_card_librarian_title'] ?? 'College Librarian',
            'librarian_signature' => $settingsRaw['id_card_librarian_signature'] ?? null,
            'rules' => is_array($rules) ? $rules : $defaultRules,
            'font_size_country' => isset($settingsRaw['id_card_font_size_country']) ? (float) $settingsRaw['id_card_font_size_country'] : 4.8,
            'font_size_school_name' => isset($settingsRaw['id_card_font_size_school_name']) ? (float) $settingsRaw['id_card_font_size_school_name'] : 6.6,
            'font_size_sub_header' => isset($settingsRaw['id_card_font_size_sub_header']) ? (float) $settingsRaw['id_card_font_size_sub_header'] : 4.2,
            'font_size_address' => isset($settingsRaw['id_card_font_size_address']) ? (float) $settingsRaw['id_card_font_size_address'] : 4.2,
            'font_size_student_name' => isset($settingsRaw['id_card_font_size_student_name']) ? (float) $settingsRaw['id_card_font_size_student_name'] : 7.8,
            'font_size_id_number' => isset($settingsRaw['id_card_font_size_id_number']) ? (float) $settingsRaw['id_card_font_size_id_number'] : 6.2,
            'font_size_course' => isset($settingsRaw['id_card_font_size_course']) ? (float) $settingsRaw['id_card_font_size_course'] : 6.8,
            'font_size_role' => isset($settingsRaw['id_card_font_size_role']) ? (float) $settingsRaw['id_card_font_size_role'] : 6.8,
            'font_size_librarian_name' => isset($settingsRaw['id_card_font_size_librarian_name']) ? (float) $settingsRaw['id_card_font_size_librarian_name'] : 6.5,
            'font_size_librarian_title' => isset($settingsRaw['id_card_font_size_librarian_title']) ? (float) $settingsRaw['id_card_font_size_librarian_title'] : 5.5,
            'font_size_rules' => isset($settingsRaw['id_card_font_size_rules']) ? (float) $settingsRaw['id_card_font_size_rules'] : 5.0,
        ];
    }

    /**
     * Helper to generate unique YY-NNNN sequence number.
     * Example: 26-0001, 26-0002, 26-0289
     */
    protected function generateNextIdNumber(): string
    {
        $yearPrefix = Carbon::now('Asia/Manila')->format('y'); // e.g. "26"

        // Find max sequence in library_id_cards table for current year
        $maxCardSeq = LibraryIdCard::where('library_id_number', 'LIKE', "{$yearPrefix}-%")
            ->get()
            ->map(function ($card) {
                $parts = explode('-', $card->library_id_number);
                return isset($parts[1]) ? intval($parts[1]) : 0;
            })
            ->max() ?? 0;

        // Also check max sequence in StudentInfo LIBRARY_ID table
        $maxStudentSeq = StudentInfo::where('LIBRARY_ID', 'LIKE', "{$yearPrefix}-%")
            ->get()
            ->map(function ($s) {
                $parts = explode('-', $s->LIBRARY_ID);
                return isset($parts[1]) ? intval($parts[1]) : 0;
            })
            ->max() ?? 0;

        $nextSeq = max($maxCardSeq, $maxStudentSeq) + 1;

        // Pad sequence number to 4 digits (e.g., 26-0001, 26-0289)
        return $yearPrefix . '-' . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
