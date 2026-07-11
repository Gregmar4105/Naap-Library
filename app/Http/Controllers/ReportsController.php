<?php

namespace App\Http\Controllers;

use App\Models\StudentLog;
use App\Models\StudentInfo;
use App\Models\LostIdReport;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    use \App\Concerns\HasAi;

    public function index(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now('Asia/Manila')->subDays(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now('Asia/Manila')->format('Y-m-d'));

        // KPI Summary
        $summary = [
            'totalLogs' => StudentLog::whereBetween('LOG_DATE', [$startDate, $endDate])->count(),
            'totalRegistrations' => StudentInfo::whereBetween('REGISTERED_ON', [$startDate, $endDate])->count(),
            'totalLostIds' => LostIdReport::whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ])->count(),
            'totalSurveys' => SurveyResponse::whereBetween('submitted_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ])->count(),
        ];

        // Daily Trend for Logs
        $logsTrend = StudentLog::select('LOG_DATE as name', DB::raw('count(*) as logs'))
            ->whereBetween('LOG_DATE', [$startDate, $endDate])
            ->groupBy('LOG_DATE')
            ->orderBy('LOG_DATE', 'asc')
            ->get();

        // Course Distribution
        $courseDistribution = StudentInfo::select('COURSE as name', DB::raw('count(*) as value'))
            ->whereNotNull('COURSE')
            ->groupBy('COURSE')
            ->get();

        // Recent Activity
        $recentActivity = StudentInfo::select('LIBRARY_ID', 'FN', 'LN', 'COURSE', 'REGISTERED_ON as date', DB::raw("'Registration' as type"))
            ->whereBetween('REGISTERED_ON', [$startDate, $endDate])
            ->union(
                LostIdReport::join('tbl_student_info', 'tbl_lost_id_reports.old_library_id', '=', 'tbl_student_info.LIBRARY_ID')
                    ->select('tbl_student_info.LIBRARY_ID', 'tbl_student_info.FN', 'tbl_student_info.LN', 'tbl_student_info.COURSE', 'tbl_lost_id_reports.created_at as date', DB::raw("'Lost ID Report' as type"))
                    ->whereBetween('tbl_lost_id_reports.created_at', [
                        Carbon::parse($startDate)->startOfDay(),
                        Carbon::parse($endDate)->endOfDay()
                    ])
            )
            ->orderBy('date', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('reports/index', [
            'summary' => $summary,
            'logsTrend' => $logsTrend,
            'courseDistribution' => $courseDistribution,
            'recentActivity' => $recentActivity,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function analyze(Request $request)
    {
        set_time_limit(0);

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->input('start_date'));
        $endDate = Carbon::parse($request->input('end_date'));
        $periodDays = $startDate->diffInDays($endDate) + 1;

        // Previous period for comparison
        $prevEnd = $startDate->copy()->subDay();
        $prevStart = $prevEnd->copy()->subDays($periodDays - 1);

        // Current Stats
        $current = [
            'logs' => StudentLog::whereBetween('LOG_DATE', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])->count(),
            'registrations' => StudentInfo::whereBetween('REGISTERED_ON', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])->count(),
            'lost_ids' => LostIdReport::whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])->count(),
            'surveys' => SurveyResponse::whereBetween('submitted_at', [$startDate->startOfDay(), $endDate->endOfDay()])->count(),
        ];

        // Previous Stats
        $previous = [
            'logs' => StudentLog::whereBetween('LOG_DATE', [$prevStart->format('Y-m-d'), $prevEnd->format('Y-m-d')])->count(),
            'registrations' => StudentInfo::whereBetween('REGISTERED_ON', [$prevStart->format('Y-m-d'), $prevEnd->format('Y-m-d')])->count(),
            'lost_ids' => LostIdReport::whereBetween('created_at', [$prevStart->startOfDay(), $prevEnd->endOfDay()])->count(),
            'surveys' => SurveyResponse::whereBetween('submitted_at', [$prevStart->startOfDay(), $prevEnd->endOfDay()])->count(),
        ];

        // Course Distribution
        $courses = StudentInfo::select('COURSE', DB::raw('count(*) as count'))
            ->groupBy('COURSE')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        // Data for AI
        $dataSummary = [
            'period' => [
                'current' => $startDate->format('M d') . ' - ' . $endDate->format('M d, Y'),
                'previous' => $prevStart->format('M d') . ' - ' . $prevEnd->format('M d, Y'),
                'days' => $periodDays
            ],
            'metrics' => [
                'logs' => ['current' => $current['logs'], 'previous' => $previous['logs']],
                'registrations' => ['current' => $current['registrations'], 'previous' => $previous['registrations']],
                'lost_ids' => ['current' => $current['lost_ids'], 'previous' => $previous['lost_ids']],
                'surveys' => ['current' => $current['surveys'], 'previous' => $previous['surveys']],
            ],
            'top_courses' => $courses->toArray()
        ];

        $jsonContext = json_encode($dataSummary, JSON_PRETTY_PRINT);

        $systemPrompt = <<<PROMPT
You are a Library Data Strategist. Analyze the following library usage data and provide strategic insights.
STRUCTURE your response using these EXACT headers:
## 📊 Descriptive Analysis — What Happened
## 🔍 Diagnostic Analysis — Why It Happened
## 📈 Predictive Analysis — What Will Happen
## 💡 Prescriptive Analysis — What To Do About It

DATA CONTEXT:
{$jsonContext}

RULES:
- Use actual numbers and calculate percentage changes.
- Focus on student engagement and operational efficiency.
- Provide actionable recommendations for library staff.
- Keep sections concise (3-4 bullet points each).
PROMPT;

        $userMessage = "Perform a complete strategic analysis of the library data for the period {$dataSummary['period']['current']}.";

        return $this->streamAiResponse([
            ['role' => 'user', 'content' => $userMessage]
        ], $systemPrompt);
    }

    public function export(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now('Asia/Manila')->subDays(6)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now('Asia/Manila')->format('Y-m-d'));

        // Fetch logs
        $logs = StudentLog::select('tbl_student_logs.*', 
                'tbl_student_info.STUDENT_NUMBER', 
                'tbl_student_info.FN', 
                'tbl_student_info.MN',
                'tbl_student_info.LN', 
                'tbl_student_info.COURSE')
            ->join('tbl_student_info', 'tbl_student_logs.LIBRARY_ID', '=', 'tbl_student_info.LIBRARY_ID')
            ->whereBetween('tbl_student_logs.LOG_DATE', [$startDate, $endDate])
            ->orderBy('tbl_student_logs.LOG_DATE', 'asc')
            ->orderBy('tbl_student_logs.LOG_TIME', 'asc')
            ->get()
            ->toArray();

        // Determine login/logout
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
                $logTypeMap[$key] = ($i === 0) ? 'Login' : 'Logout';
            }
        }

        // Fetch new registrations
        $registrations = StudentInfo::whereBetween('REGISTERED_ON', [$startDate, $endDate])
            ->orderBy('REGISTERED_ON', 'asc')
            ->get();

        // Fetch lost ID reports
        $lostIds = LostIdReport::join('tbl_student_info', 'tbl_lost_id_reports.old_library_id', '=', 'tbl_student_info.LIBRARY_ID')
            ->select('tbl_lost_id_reports.*', 'tbl_student_info.FN', 'tbl_student_info.LN', 'tbl_student_info.COURSE')
            ->whereBetween('tbl_lost_id_reports.created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ])
            ->orderBy('tbl_lost_id_reports.created_at', 'asc')
            ->get();

        // Fetch survey responses
        $surveyResponses = SurveyResponse::with('survey')
            ->whereBetween('submitted_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ])
            ->orderBy('submitted_at', 'asc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="library_analytics_report_' . $startDate . '_to_' . $endDate . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($startDate, $endDate, $logs, $logTypeMap, $registrations, $lostIds, $surveyResponses) {
            $file = fopen('php://output', 'w');

            // Title block
            fputcsv($file, ['NAAP LIBRARY ANALYTICS REPORT']);
            fputcsv($file, ['Reporting Period', $startDate . ' to ' . $endDate]);
            fputcsv($file, ['Generated At', Carbon::now('Asia/Manila')->format('Y-m-d H:i:s')]);
            fputcsv($file, []); // Empty row

            // Section 1: Access Logs
            fputcsv($file, ['SECTION 1: STUDENT ACCESS LOGS (Total: ' . count($logs) . ')']);
            fputcsv($file, ['Date', 'Time', 'Library ID', 'Student Number', 'Student Name', 'Course/Department', 'Action']);
            foreach ($logs as $log) {
                $key = $log['LIBRARY_ID'] . '|' . $log['LOG_DATE'] . '|' . $log['LOG_TIME'] . '|' . $log['LOG_SESSION'];
                $action = $logTypeMap[$key] ?? 'Login';
                $middleInitial = $log['MN'] ? ' ' . substr($log['MN'], 0, 1) . '.' : '';
                $fullName = $log['FN'] . $middleInitial . ' ' . $log['LN'];

                fputcsv($file, [
                    $log['LOG_DATE'],
                    $log['LOG_TIME'],
                    $log['LIBRARY_ID'],
                    $log['STUDENT_NUMBER'] ?? 'N/A',
                    $fullName,
                    $log['COURSE'] ?? 'N/A',
                    $action
                ]);
            }
            fputcsv($file, []); // Empty row
            fputcsv($file, []); // Empty row

            // Section 2: Registrations
            fputcsv($file, ['SECTION 2: NEW REGISTRATIONS (Total: ' . count($registrations) . ')']);
            fputcsv($file, ['Date Registered', 'Library ID', 'Student Number', 'Student Name', 'Course/Department', 'Email', 'Sex', 'Birthday']);
            foreach ($registrations as $student) {
                $middleInitial = $student->MN ? ' ' . substr($student->MN, 0, 1) . '.' : '';
                $fullName = $student->FN . $middleInitial . ' ' . $student->LN;

                fputcsv($file, [
                    $student->REGISTERED_ON,
                    $student->LIBRARY_ID,
                    $student->STUDENT_NUMBER ?? 'N/A',
                    $fullName,
                    $student->COURSE ?? 'N/A',
                    $student->EMAIL ?? 'N/A',
                    $student->SEX ?? 'N/A',
                    $student->BIRTHDAY ?? 'N/A'
                ]);
            }
            fputcsv($file, []); // Empty row
            fputcsv($file, []); // Empty row

            // Section 3: Lost ID Reports
            fputcsv($file, ['SECTION 3: LOST ID INCIDENT REPORTS (Total: ' . count($lostIds) . ')']);
            fputcsv($file, ['Date Reported', 'Old Library ID', 'Student Number', 'Student Name', 'Course/Department', 'Location Lost', 'Description']);
            foreach ($lostIds as $report) {
                $fullName = $report->FN . ' ' . $report->LN;

                fputcsv($file, [
                    $report->created_at->format('Y-m-d H:i:s'),
                    $report->old_library_id,
                    $report->student_number,
                    $fullName,
                    $report->COURSE ?? 'N/A',
                    $report->location_lost,
                    $report->description ?? 'N/A'
                ]);
            }
            fputcsv($file, []); // Empty row
            fputcsv($file, []); // Empty row

            // Section 4: Survey Responses
            fputcsv($file, ['SECTION 4: SURVEY RESPONSES (Total: ' . count($surveyResponses) . ')']);
            fputcsv($file, ['Submitted At', 'Respondent Name', 'Respondent Email', 'Survey Title', 'Answers (JSON)']);
            foreach ($surveyResponses as $response) {
                fputcsv($file, [
                    $response->submitted_at->format('Y-m-d H:i:s'),
                    $response->respondent_name ?? 'Anonymous',
                    $response->respondent_email ?? 'N/A',
                    $response->survey->title ?? 'N/A',
                    json_encode($response->answers)
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
