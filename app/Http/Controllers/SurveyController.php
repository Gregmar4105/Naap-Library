<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\SurveyRepositoryInterface;
use App\Services\SurveyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyController extends Controller
{
    protected SurveyService $surveyService;
    protected SurveyRepositoryInterface $surveyRepository;

    public function __construct(SurveyService $surveyService, SurveyRepositoryInterface $surveyRepository)
    {
        $this->surveyService = $surveyService;
        $this->surveyRepository = $surveyRepository;
    }

    /**
     * Render the survey management page with all surveys and their question counts.
     */
    public function index()
    {
        $surveys = $this->surveyRepository->getAllWithCounts();
        $googleStatus = $this->surveyService->getGoogleFormsService()->testConnection();

        $ips = [];
        try {
            if (stristr(PHP_OS, 'WIN')) {
                exec('ipconfig', $output);
                foreach ($output as $line) {
                    if (preg_match('/IPv4 Address[\.\s]+:\s*([\d\.]+)/', $line, $matches)) {
                        $ip = trim($matches[1]);
                        if (!str_starts_with($ip, '127.') && !str_starts_with($ip, '169.254.')) {
                            $ips[] = $ip;
                        }
                    }
                }
            } else {
                exec('hostname -I', $output);
                if (!empty($output)) {
                    $parts = explode(' ', trim($output[0]));
                    foreach ($parts as $part) {
                        $ip = trim($part);
                        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && !str_starts_with($ip, '127.') && !str_starts_with($ip, '169.254.')) {
                            $ips[] = $ip;
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('IP Detection Error: ' . $e->getMessage());
        }

        if (empty($ips)) {
            $ips[] = gethostbyname(gethostname()) ?: '127.0.0.1';
        }

        return Inertia::render('survey', [
            'surveys'           => $surveys,
            'localIps'          => $ips,
            'googleFormsStatus' => $googleStatus,
        ]);
    }

    /**
     * Check Google Forms API status endpoint.
     */
    public function getGoogleFormsStatus()
    {
        $status = $this->surveyService->getGoogleFormsService()->testConnection();
        return response()->json($status);
    }

    /**
     * Create a new survey with its questions and Google Form.
     */
    public function store(Request $request)
    {
        ini_set('display_errors', '0');
        try {
            $request->validate([
                'title'                => 'required|string|max:255',
                'description'          => 'nullable|string',
                'status'               => 'in:draft,active,closed',
                'questions'            => 'array',
                'questions.*.type'     => 'required|in:short_text,paragraph,multiple_choice,checkboxes,dropdown,rating,date',
                'questions.*.label'    => 'required|string',
                'questions.*.options'  => 'nullable|array',
                'questions.*.required' => 'boolean',
            ]);

            $survey = $this->surveyService->createSurvey($request->all());

            return response()->json([
                'success' => true,
                'survey'  => $survey,
            ]);
        } catch (\Throwable $e) {
            \Log::emergency('SURVEY ERROR: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update an existing survey and sync with Google Forms API.
     */
    public function update(Request $request, int $id)
    {
        ini_set('display_errors', '0');
        try {
            $request->validate([
                'title'                => 'required|string|max:255',
                'description'          => 'nullable|string',
                'status'               => 'in:draft,active,closed',
                'questions'            => 'array',
                'questions.*.type'     => 'required|in:short_text,paragraph,multiple_choice,checkboxes,dropdown,rating,date',
                'questions.*.label'    => 'required|string',
                'questions.*.options'  => 'nullable|array',
                'questions.*.required' => 'boolean',
            ]);

            $survey = $this->surveyService->updateSurvey($id, $request->all());

            return response()->json([
                'success' => true,
                'survey'  => $survey,
            ]);
        } catch (\Throwable $e) {
            \Log::emergency('SURVEY ERROR: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a survey and its Google Form.
     */
    public function destroy(int $id)
    {
        try {
            $this->surveyService->deleteSurvey($id);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete survey.'], 500);
        }
    }

    /**
     * Get a survey's questions (for the filler/preview view).
     */
    public function show(int $id)
    {
        $survey = $this->surveyRepository->findWithQuestions($id);
        if (!$survey) {
            return response()->json(['message' => 'Survey not found'], 404);
        }
        return response()->json($survey);
    }

    /**
     * Render the public survey form.
     */
    public function publicShow(int $id)
    {
        $survey = $this->surveyRepository->findWithQuestions($id);
        if (!$survey || $survey->status !== 'active') {
            abort(404, 'This survey is not currently active.');
        }

        // If it's a Google Form with a responder URI, redirect directly to Google Form
        if (!empty($survey->responder_uri)) {
            return Inertia::location($survey->responder_uri);
        }

        return Inertia::render('survey-public', [
            'survey' => $survey,
        ]);
    }

    /**
     * Submit a response to a survey.
     */
    public function submit(Request $request, int $id)
    {
        $request->validate([
            'respondent_name'  => 'nullable|string|max:255',
            'respondent_email' => 'nullable|email|max:255',
            'answers'          => 'required|array',
        ]);

        try {
            $response = $this->surveyService->submitResponse($id, $request->all());
            return response()->json(['success' => true, 'response_id' => $response->id]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = ($code == 422) ? 422 : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $status);
        }
    }

    /**
     * Publish or re-sync survey to Google Forms API.
     */
    public function publishGoogleForm(int $id)
    {
        try {
            $survey = $this->surveyService->publishToGoogleForms($id);
            return response()->json(['success' => true, 'survey' => $survey]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Sync responses directly from Google Forms API.
     */
    public function syncGoogleResponses(int $id)
    {
        try {
            $result = $this->surveyService->syncGoogleResponses($id);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get aggregated responses for a survey.
     */
    public function getResponses(int $id)
    {
        $survey = $this->surveyRepository->findWithQuestions($id);
        if (!$survey) {
            return response()->json(['message' => 'Survey not found'], 404);
        }

        // Try syncing from Google Forms if available
        if ($survey->google_form_id && $this->surveyService->getGoogleFormsService()->isConfigured()) {
            try {
                $this->surveyService->syncGoogleResponses($id);
            } catch (\Exception $e) {
                \Log::warning('Auto sync Google responses failed: ' . $e->getMessage());
            }
        }

        $responses = $this->surveyRepository->getResponses($id);

        // Build per-question analytics
        $analytics = [];
        foreach ($survey->questions as $question) {
            $qid = (string) $question->id;
            $allAnswers = $responses->map(fn($r) => $r->answers[$qid] ?? null)->filter()->values();

            $data = [
                'question_id' => $question->id,
                'label'       => $question->label,
                'type'        => $question->type,
                'total'       => $allAnswers->count(),
            ];

            // Aggregate choice-based types
            if (in_array($question->type, ['multiple_choice', 'checkboxes', 'dropdown'])) {
                $counts = [];
                foreach ($allAnswers as $answer) {
                    $items = is_array($answer) ? $answer : [$answer];
                    foreach ($items as $item) {
                        $counts[$item] = ($counts[$item] ?? 0) + 1;
                    }
                }
                $data['counts'] = $counts;
            } elseif ($question->type === 'rating') {
                $numeric = $allAnswers->map(fn($a) => (int) $a);
                $data['average'] = $numeric->count() > 0 ? round($numeric->avg(), 1) : null;
                $data['distribution'] = array_fill(1, 5, 0);
                foreach ($numeric as $val) {
                    if ($val >= 1 && $val <= 5) {
                        $data['distribution'][$val]++;
                    }
                }
            } else {
                // Text-based
                $data['text_answers'] = $allAnswers->take(50)->values()->all();
            }

            $analytics[] = $data;
        }

        return response()->json([
            'survey'      => $survey,
            'total'       => $responses->count(),
            'responses'   => $responses->map(fn($r) => [
                'id'               => $r->id,
                'respondent_name'  => $r->respondent_name ?? 'Anonymous',
                'respondent_email' => $r->respondent_email,
                'submitted_at'     => $r->submitted_at,
                'answers'          => $r->answers,
            ])->values()->all(),
            'analytics'   => $analytics,
        ]);
    }

    /**
     * Render the public survey portal (list of active surveys).
     */
    public function publicIndex()
    {
        $surveys = $this->surveyRepository->getActiveWithCounts();

        return Inertia::render('survey-portal', [
            'surveys' => $surveys,
        ]);
    }
}
