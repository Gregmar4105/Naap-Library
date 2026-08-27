<?php

namespace App\AI;

use App\Models\StudentInfo;
use App\Models\StudentLog;
use App\Models\RfidInfo;
use App\Models\RfidHistory;
use App\Models\AuditTrail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LibraryTools
{
    /**
     * Get the JSON definitions for the tools.
     */
    public static function getDefinitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_students',
                    'description' => 'Search for students by name, library ID, or student number.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'query' => [
                                'type' => 'string',
                                'description' => 'The search term (name, ID, or number).',
                            ],
                        ],
                        'required' => ['query'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_student_details',
                    'description' => 'Get full profile details for a specific student using their Library ID.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'library_id' => [
                                'type' => 'string',
                                'description' => 'The unique Library ID of the student.',
                            ],
                        ],
                        'required' => ['library_id'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_library_stats',
                    'description' => 'Get general statistics about the library (total students, active logs today, locker usage).',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => (object)[],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'check_locker_status',
                    'description' => 'Check the status of a specific locker or see all available lockers.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'locker_number' => [
                                'type' => 'string',
                                'description' => 'Optional locker number to check specifically.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_recent_logs',
                    'description' => 'Get the most recent library entrance/exit logs.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'limit' => [
                                'type' => 'integer',
                                'description' => 'Number of logs to retrieve (default 10, max 50).',
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Execute a tool call.
     */
    public static function call(string $name, array $arguments)
    {
        switch ($name) {
            case 'search_students':
                return self::searchStudents($arguments['query']);
            case 'get_student_details':
                return self::getStudentDetails($arguments['library_id']);
            case 'get_library_stats':
                return self::getLibraryStats();
            case 'check_locker_status':
                return self::checkLockerStatus($arguments['locker_number'] ?? null);
            case 'get_recent_logs':
                return self::getRecentLogs($arguments['limit'] ?? 10);
            default:
                throw new \Exception("Unknown tool: {$name}");
        }
    }

    private static function searchStudents(string $query)
    {
        return StudentInfo::where('FN', 'LIKE', "%{$query}%")
            ->orWhere('LN', 'LIKE', "%{$query}%")
            ->orWhere('LIBRARY_ID', 'LIKE', "%{$query}%")
            ->orWhere('STUDENT_NUMBER', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get(['LIBRARY_ID', 'STUDENT_NUMBER', 'FN', 'MN', 'LN', 'COURSE', 'ID_STATUS'])
            ->toArray();
    }

    private static function getStudentDetails(string $libraryId)
    {
        $student = StudentInfo::where('LIBRARY_ID', $libraryId)->first();
        if (!$student) return ['error' => 'Student not found.'];

        // Get recent logs for this student
        $logs = StudentLog::where('LIBRARY_ID', $libraryId)
            ->orderBy('LOG_DATE', 'desc')
            ->orderBy('LOG_TIME', 'desc')
            ->limit(5)
            ->get()
            ->toArray();

        // Get current locker
        $locker = RfidHistory::where('LIBRARY_ID', $libraryId)
            ->whereNull('RETURN_ON')
            ->first();

        return [
            'profile' => $student->toArray(),
            'recent_logs' => $logs,
            'active_locker' => $locker ? $locker->toArray() : null,
        ];
    }

    private static function getLibraryStats()
    {
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');
        
        return [
            'total_registered_students' => StudentInfo::count(),
            'active_logs_today' => StudentLog::where('LOG_DATE', $today)->count(),
            'total_lockers' => RfidInfo::count(),
            'available_lockers' => RfidInfo::where(DB::raw('LOWER(IS_AVAILABLE)'), 'yes')->count(),
            'active_locker_borrows' => RfidHistory::whereNull('RETURN_ON')->count(),
        ];
    }

    private static function checkLockerStatus(?string $lockerNumber = null)
    {
        if ($lockerNumber) {
            $locker = RfidInfo::where('LOCKER_NUMBER', $lockerNumber)->first();
            if (!$locker) return ['error' => 'Locker not found.'];

            $status = [
                'locker_number' => $locker->LOCKER_NUMBER,
                'is_available' => strtolower($locker->IS_AVAILABLE) === 'yes',
            ];

            if (!$status['is_available']) {
                $borrower = RfidHistory::where('LOCKER_NUMBER', $lockerNumber)
                    ->whereNull('RETURN_ON')
                    ->with('student') // Assuming relationship exists
                    ->first();
                
                if ($borrower) {
                    $status['borrowed_by'] = $borrower->LIBRARY_ID;
                    $status['borrowed_at'] = $borrower->BORROW_ON;
                }
            }

            return $status;
        }

        return RfidInfo::get(['LOCKER_NUMBER', 'IS_AVAILABLE'])->toArray();
    }

    private static function getRecentLogs(int $limit = 10)
    {
        $limit = min($limit, 50);
        return StudentLog::select('tbl_student_logs.*', 'tbl_student_info.FN', 'tbl_student_info.LN')
            ->join('tbl_student_info', 'tbl_student_logs.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->orderBy('LOG_DATE', 'desc')
            ->orderBy('LOG_TIME', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
