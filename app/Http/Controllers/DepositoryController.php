<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RfidInfo;
use App\Models\RfidHistory;
use App\Models\StudentInfo;
use App\Models\StudentLog;
use Inertia\Inertia;
use Carbon\Carbon;

class DepositoryController extends Controller
{
    /**
     * Render the depository page with locker data and today's history.
     */
    public function index()
    {
        $lockers = RfidInfo::orderByRaw('CAST(LOCKER_NUMBER AS UNSIGNED)')->get()->toArray();

        $todayDate = Carbon::now('Asia/Manila')->format('F d, Y');

        // Get today's active borrow records (borrowed today, not yet returned)
        $activeRecords = RfidHistory::select(
                'tbl_rfidhistory.*',
                'tbl_student_info.STUDENT_NUMBER',
                'tbl_student_info.FN',
                'tbl_student_info.MN',
                'tbl_student_info.LN',
                'tbl_student_info.COURSE'
            )
            ->join('tbl_student_info', 'tbl_rfidhistory.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->whereNull('tbl_rfidhistory.RETURN_ON')
            ->orderBy('tbl_rfidhistory.BORROW_ON', 'desc')
            ->get()
            ->toArray();

        // Get today's history (including returned)
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');
        $todayHistory = RfidHistory::select(
                'tbl_rfidhistory.*',
                'tbl_student_info.STUDENT_NUMBER',
                'tbl_student_info.FN',
                'tbl_student_info.MN',
                'tbl_student_info.LN',
                'tbl_student_info.COURSE'
            )
            ->join('tbl_student_info', 'tbl_rfidhistory.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->whereDate('tbl_rfidhistory.BORROW_ON', $today)
            ->orderBy('tbl_rfidhistory.BORROW_ON', 'desc')
            ->get()
            ->toArray();

        return Inertia::render('depository', [
            'lockers' => $lockers,
            'activeRecords' => $activeRecords,
            'todayHistory' => $todayHistory,
            'todayDate' => $todayDate,
        ]);
    }

    /**
     * Get live data for polling.
     */
    public function getData()
    {
        $lockers = RfidInfo::orderByRaw('CAST(LOCKER_NUMBER AS UNSIGNED)')->get()->toArray();
        $todayDate = Carbon::now('Asia/Manila')->format('F d, Y');
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');

        $activeRecords = RfidHistory::select(
                'tbl_rfidhistory.*',
                'tbl_student_info.STUDENT_NUMBER',
                'tbl_student_info.FN',
                'tbl_student_info.MN',
                'tbl_student_info.LN',
                'tbl_student_info.COURSE'
            )
            ->join('tbl_student_info', 'tbl_rfidhistory.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->whereNull('tbl_rfidhistory.RETURN_ON')
            ->orderBy('tbl_rfidhistory.BORROW_ON', 'desc')
            ->get()
            ->toArray();

        $todayHistory = RfidHistory::select(
                'tbl_rfidhistory.*',
                'tbl_student_info.STUDENT_NUMBER',
                'tbl_student_info.FN',
                'tbl_student_info.MN',
                'tbl_student_info.LN',
                'tbl_student_info.COURSE'
            )
            ->join('tbl_student_info', 'tbl_rfidhistory.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->whereDate('tbl_rfidhistory.BORROW_ON', $today)
            ->orderBy('tbl_rfidhistory.BORROW_ON', 'desc')
            ->get()
            ->toArray();

        return response()->json([
            'lockers' => $lockers,
            'activeRecords' => $activeRecords,
            'todayHistory' => $todayHistory,
            'todayDate' => $todayDate,
        ]);
    }

    /**
     * Step 1: Employee taps the physical RFID key.
     * This selects the locker key and prepares it for assignment.
     */
    public function scanKey(Request $request)
    {
        $request->validate([
            'rfid_card_number' => 'required|string',
        ]);

        $rfidNumber = $request->input('rfid_card_number');

        // Look up the RFID key in tbl_rfid_info
        $rfidInfo = RfidInfo::where('RFID_NUMBER', $rfidNumber)->first();

        if (!$rfidInfo) {
            return response()->json([
                'success' => false,
                'message' => 'RFID key not found in the system.',
            ], 404);
        }

        // Check if the key is available
        if (strtolower($rfidInfo->IS_AVAILABLE) !== 'yes') {
            // Key is currently in use — this is a RETURN action
            // Find the active borrow record for this key
            $activeRecord = RfidHistory::where('RFID_CARD_NUMBER', $rfidNumber)
                ->whereNull('RETURN_ON')
                ->first();

            if ($activeRecord) {
                return response()->json([
                    'success' => true,
                    'action' => 'ready_return',
                    'rfid_number' => $rfidInfo->RFID_NUMBER,
                    'locker_number' => $rfidInfo->LOCKER_NUMBER,
                    'message' => 'Locker ' . $rfidInfo->LOCKER_NUMBER . ' key scanned for return. Student must now tap their Library ID to confirm.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'This key is marked as unavailable but no active borrow record was found.',
            ], 400);
        }

        // Key is available — ready for lending
        return response()->json([
            'success' => true,
            'action' => 'ready',
            'rfid_number' => $rfidInfo->RFID_NUMBER,
            'locker_number' => $rfidInfo->LOCKER_NUMBER,
            'message' => 'Locker ' . $rfidInfo->LOCKER_NUMBER . ' key is ready. Student can now tap their Library ID.',
        ]);
    }

    /**
     * Step 2: Student taps their Library ID to be assigned the locker.
     */
    public function assignLocker(Request $request)
    {
        $request->validate([
            'rfid_card_number' => 'required|string',
            'library_id' => 'required|string',
        ]);

        $rfidNumber = $request->input('rfid_card_number');
        $libraryId = $request->input('library_id');

        // Verify RFID key exists and is available
        $rfidInfo = RfidInfo::where('RFID_NUMBER', $rfidNumber)->first();

        if (!$rfidInfo) {
            return response()->json([
                'success' => false,
                'message' => 'RFID key not found.',
            ], 404);
        }

        // Verify student exists
        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        // RETURN CONTEXT: If key is NOT available
        if (strtolower($rfidInfo->IS_AVAILABLE) !== 'yes') {
            $activeRecord = RfidHistory::where('RFID_CARD_NUMBER', $rfidNumber)
                ->whereNull('RETURN_ON')
                ->first();

            if (!$activeRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'This key is marked as unavailable but no active borrow record was found.',
                ], 400);
            }

            if ($activeRecord->LIBRARY_ID !== $libraryId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Library ID mismatch! This student did not borrow this locker.',
                ], 400);
            }

            // Process Return
            $now = Carbon::now('Asia/Manila');
            RfidHistory::where('RFID_CARD_NUMBER', $rfidNumber)
                ->whereNull('RETURN_ON')
                ->update(['RETURN_ON' => $now]);

            $rfidInfo->update(['IS_AVAILABLE' => 'Yes']);

            return response()->json([
                'success' => true,
                'action' => 'returned',
                'locker_number' => $rfidInfo->LOCKER_NUMBER,
                'student' => $student,
                'return_time' => $now->format('g:i A'),
                'message' => 'Key returned successfully! Locker ' . $rfidInfo->LOCKER_NUMBER . ' is now available.',
            ]);
        }

        // ASSIGN CONTEXT: If key IS available
        // --- ADDED RULE: Student must be logged in to the library ---
        $todayStr = Carbon::now('Asia/Manila')->format('Y-m-d');
        $logsCount = StudentLog::where('LIBRARY_ID', $libraryId)
                        ->where('LOG_DATE', $todayStr)
                        ->count();

        if ($logsCount % 2 === 0) {
            return response()->json([
                'success' => false,
                'status' => 'not_logged_in',
                'message' => 'Student is not currently logged in to the library. Please tap in at the entrance first.',
            ], 403);
        }
        // --- END ADDED RULE ---

        // Check if student already has an active locker
        $existingBorrow = RfidHistory::where('LIBRARY_ID', $libraryId)
            ->whereNull('RETURN_ON')
            ->first();

        if ($existingBorrow) {
            return response()->json([
                'success' => false,
                'message' => 'This student already has an active locker (Locker ' . $existingBorrow->LOCKER_NUMBER . ').',
            ], 400);
        }

        $now = Carbon::now('Asia/Manila');

        // Create the borrow record
        RfidHistory::create([
            'RFID_CARD_NUMBER' => $rfidNumber,
            'LIBRARY_ID' => $libraryId,
            'BORROW_ON' => $now,
            'RETURN_ON' => null,
            'LOCKER_NUMBER' => $rfidInfo->LOCKER_NUMBER,
            'EMP_ID' => auth()->user() ? (string)auth()->id() : null,
        ]);

        // Mark the key as unavailable
        $rfidInfo->update(['IS_AVAILABLE' => 'No']);

        return response()->json([
            'success' => true,
            'action' => 'assigned',
            'student' => $student,
            'locker_number' => $rfidInfo->LOCKER_NUMBER,
            'borrow_time' => $now->format('g:i A'),
            'message' => 'Locker ' . $rfidInfo->LOCKER_NUMBER . ' assigned to ' . $student->FN . ' ' . $student->LN . '.',
        ]);
    }

    /**
     * Add a new physical locker key to the system.
     */
    public function addLocker(Request $request)
    {
        $request->validate([
            'rfid_card_number' => 'required|string',
        ]);

        $rfidNumber = $request->input('rfid_card_number');

        // Check if the key already exists
        $existing = RfidInfo::where('RFID_NUMBER', $rfidNumber)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'This RFID key is already registered as Locker #' . $existing->LOCKER_NUMBER . '.',
            ], 400);
        }

        // Find the maximum locker number to increment
        $maxLockerDb = RfidInfo::orderByRaw('CAST(LOCKER_NUMBER AS UNSIGNED) DESC')->first();
        
        $newLockerNumber = '1';
        if ($maxLockerDb) {
            $newLockerNumber = (string)((int)$maxLockerDb->LOCKER_NUMBER + 1);
        }

        // Insert new locker
        RfidInfo::create([
            'RFID_NUMBER' => $rfidNumber,
            'LOCKER_NUMBER' => $newLockerNumber,
            'IS_AVAILABLE' => 'Yes'
        ]);

        return response()->json([
            'success' => true,
            'locker_number' => $newLockerNumber,
            'message' => 'Locker #' . $newLockerNumber . ' successfully added.',
        ]);
    }

    /**
     * Delete a physical locker key from the system.
     */
    public function deleteLocker($rfidNumber)
    {
        $rfidInfo = RfidInfo::where('RFID_NUMBER', $rfidNumber)->first();

        if (!$rfidInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Locker key not found.',
            ], 404);
        }

        // Check if locker is currently occupied
        if (strtolower($rfidInfo->IS_AVAILABLE) !== 'yes') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Locker #' . $rfidInfo->LOCKER_NUMBER . ' while it is currently occupied.',
            ], 400);
        }

        $activeRecord = RfidHistory::where('RFID_CARD_NUMBER', $rfidNumber)
            ->whereNull('RETURN_ON')
            ->first();

        if ($activeRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Locker #' . $rfidInfo->LOCKER_NUMBER . ' while there is an active borrow record.',
            ], 400);
        }

        $lockerNum = $rfidInfo->LOCKER_NUMBER;
        $rfidInfo->delete();

        return response()->json([
            'success' => true,
            'locker_number' => $lockerNum,
            'message' => 'Locker #' . $lockerNum . ' deleted successfully.',
        ]);
    }
}
