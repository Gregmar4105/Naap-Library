<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentLog;
use App\Models\StudentInfo;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');

        $todayFormatted = Carbon::now('Asia/Manila')->format('F d, Y'); // e.g. "April 04, 2026"

        // Fetch today's logs with student info, newest first
        $logs = StudentLog::select('tbl_student_logs.*', 
                'tbl_student_info.STUDENT_NUMBER', 
                'tbl_student_info.FN', 
                'tbl_student_info.MN',
                'tbl_student_info.LN', 
                'tbl_student_info.COURSE',
                'tbl_student_info.PIC',
                'tbl_student_info.ID_STATUS',
                'tbl_student_logs.LOG_IMAGE')
            ->join('tbl_student_info', 'tbl_student_logs.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->where('tbl_student_logs.LOG_DATE', $today)
            ->orderBy('tbl_student_logs.LOG_TIME', 'desc')
            ->get()
            ->toArray();

        // Recent security audits / attempts (Unknown Detections for Today)
        $recentAttempts = \App\Models\AccessAttempt::leftJoin('tbl_student_info', 'tbl_access_attempts.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->select('tbl_access_attempts.*', 'tbl_student_info.FN', 'tbl_student_info.LN')
            ->where('tbl_access_attempts.STATUS', 'failed')
            ->where('tbl_access_attempts.LOG_DATE', $today)
            ->orderBy('tbl_access_attempts.created_at', 'desc')
            ->limit(100)
            ->get()
            ->toArray();

        // Determine login vs logout for each log entry
        // Group by LOG_SESSION: first entry = login, second = logout
        $sessionGroups = [];
        foreach ($logs as $log) {
            $session = $log['LOG_SESSION'];
            if (!isset($sessionGroups[$session])) {
                $sessionGroups[$session] = [];
            }
            $sessionGroups[$session][] = $log;
        }

        $logTypeMap = [];
        foreach ($sessionGroups as $session => $sessionLogs) {
            // Sort by LOG_TIME ascending
            usort($sessionLogs, function($a, $b) {
                return strcmp($a['LOG_TIME'], $b['LOG_TIME']);
            });
            foreach ($sessionLogs as $i => $log) {
                $key = $log['LIBRARY_ID'] . '|' . $log['LOG_DATE'] . '|' . $log['LOG_TIME'] . '|' . $log['LOG_SESSION'];
                $logTypeMap[$key] = ($i === 0) ? 'login' : 'logout';
            }
        }

        // Attach log_type to each log
        $logsWithType = array_map(function($log) use ($logTypeMap) {
            $key = $log['LIBRARY_ID'] . '|' . $log['LOG_DATE'] . '|' . $log['LOG_TIME'] . '|' . $log['LOG_SESSION'];
            $log['log_type'] = $logTypeMap[$key] ?? 'login';
            return $log;
        }, $logs);

        // Count currently logged-in students today
        $allTodayLogs = StudentLog::where('LOG_DATE', $today)
            ->select('LIBRARY_ID')
            ->get()
            ->groupBy('LIBRARY_ID');

        $currentlyInCount = 0;
        foreach ($allTodayLogs as $libraryId => $studentLogs) {
            if ($studentLogs->count() % 2 !== 0) {
                $currentlyInCount++;
            }
        }

        $todayLogsCount = StudentLog::where('LOG_DATE', $today)->count();
        $totalStudents = StudentInfo::count();

        return Inertia::render('dashboard', [
            'logs' => $logsWithType,
            'recentAttempts' => $recentAttempts,
            'todayDate' => $todayFormatted,
            'stats' => [
                'currentlyIn' => $currentlyInCount,
                'todayLogs' => $todayLogsCount,
                'totalStudents' => $totalStudents,
            ],
        ]);
    }

    public function getData()
    {
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');
        $todayFormatted = Carbon::now('Asia/Manila')->format('F d, Y');

        $logs = StudentLog::select('tbl_student_logs.*', 
                'tbl_student_info.STUDENT_NUMBER', 
                'tbl_student_info.FN', 
                'tbl_student_info.MN',
                'tbl_student_info.LN', 
                'tbl_student_info.COURSE',
                'tbl_student_info.PIC',
                'tbl_student_info.ID_STATUS',
                'tbl_student_logs.LOG_IMAGE')
            ->join('tbl_student_info', 'tbl_student_logs.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->where('tbl_student_logs.LOG_DATE', $today)
            ->orderBy('tbl_student_logs.LOG_TIME', 'desc')
            ->get()
            ->toArray();

        $sessionGroups = [];
        foreach ($logs as $log) {
            $session = $log['LOG_SESSION'];
            if (!isset($sessionGroups[$session])) {
                $sessionGroups[$session] = [];
            }
            $sessionGroups[$session][] = $log;
        }

        $logTypeMap = [];
        foreach ($sessionGroups as $session => $sessionLogs) {
            usort($sessionLogs, function($a, $b) {
                return strcmp($a['LOG_TIME'], $b['LOG_TIME']);
            });
            foreach ($sessionLogs as $i => $log) {
                $key = $log['LIBRARY_ID'] . '|' . $log['LOG_DATE'] . '|' . $log['LOG_TIME'] . '|' . $log['LOG_SESSION'];
                $logTypeMap[$key] = ($i === 0) ? 'login' : 'logout';
            }
        }

        $logsWithType = array_map(function($log) use ($logTypeMap) {
            $key = $log['LIBRARY_ID'] . '|' . $log['LOG_DATE'] . '|' . $log['LOG_TIME'] . '|' . $log['LOG_SESSION'];
            $log['log_type'] = $logTypeMap[$key] ?? 'login';
            return $log;
        }, $logs);

        $allTodayLogs = StudentLog::where('LOG_DATE', $today)
            ->select('LIBRARY_ID')
            ->get()
            ->groupBy('LIBRARY_ID');

        $currentlyInCount = 0;
        foreach ($allTodayLogs as $libraryId => $studentLogs) {
            if ($studentLogs->count() % 2 !== 0) {
                $currentlyInCount++;
            }
        }

        $todayLogsCount = StudentLog::where('LOG_DATE', $today)->count();
        $totalStudents = StudentInfo::count();

        // Recent security audits / attempts (Unknown Detections for Today)
        $recentAttempts = \App\Models\AccessAttempt::leftJoin('tbl_student_info', 'tbl_access_attempts.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->select('tbl_access_attempts.*', 'tbl_student_info.FN', 'tbl_student_info.LN')
            ->where('tbl_access_attempts.STATUS', 'failed')
            ->where('tbl_access_attempts.LOG_DATE', $today)
            ->orderBy('tbl_access_attempts.created_at', 'desc')
            ->limit(100)
            ->get()
            ->toArray();

        return response()->json([
            'logs' => $logsWithType,
            'recentAttempts' => $recentAttempts,
            'todayDate' => $todayFormatted,
            'stats' => [
                'currentlyIn' => $currentlyInCount,
                'todayLogs' => $todayLogsCount,
                'totalStudents' => $totalStudents,
            ],
        ]);
    }
}
