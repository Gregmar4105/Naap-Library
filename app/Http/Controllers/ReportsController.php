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
}
