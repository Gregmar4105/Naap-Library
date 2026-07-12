<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SurveyController extends Controller
{
    /**
     * Render the survey management page with all surveys and their question counts.
     */
    public function index()
    {
        $surveys = Survey::withCount('questions', 'responses')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('survey', [
            'surveys' => $surveys,
        ]);
    }

    /**
     * Create a new survey with its questions.
     */
    public function store(Request $request)
    {
        ini_set('display_errors', '0');
        try {
            $request->validate([
                'title'                     => 'required|string|max:255',
                'description'               => 'nullable|string',
                'status'                    => 'in:draft,active,closed',
                'questions'                 => 'array',
                'questions.*.type'          => 'required|in:short_text,paragraph,multiple_choice,checkboxes,dropdown,rating,date',
                'questions.*.label'         => 'required|string',
                'questions.*.options'       => 'nullable|array',
                'questions.*.required'      => 'boolean',
            ]);

            $survey = Survey::create([
                'title'       => $request->title,
                'description' => $request->description,
                'status'      => $request->input('status', 'draft'),
                'created_by'  => auth()->id(),
            ]);

            foreach ($request->input('questions', []) as $i => $q) {
                SurveyQuestion::create([
                    'survey_id' => $survey->id,
                    'order'     => $i,
                    'type'      => $q['type'],
                    'label'     => $q['label'],
                    'options'   => $q['options'] ?? null,
                    'required'  => $q['required'] ?? false,
                ]);
            }

            // Notify all admins of new survey creation
            try {
                $creator = auth()->user()->name ?? 'Admin';
                $notification = new \App\Notifications\SystemNotification(
                    'New Survey Created',
                    "Survey \"{$survey->title}\" was created by {$creator}.",
                    '/survey'
                );
                foreach (\App\Models\User::all() as $user) {
                    $user->notify($notification);
                }
            } catch (\Exception $ne) {
                Log::error('Notification Error: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'survey'  => $survey->load('questions'),
            ]);
        } catch (\Throwable $e) {
            Log::emergency('SURVEY ERROR: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'System error logged.'], 500);
        }
    }

    /**
     * Update an existing survey and replace its questions.
     */
    public function update(Request $request, int $id)
    {
        ini_set('display_errors', '0');
        try {
            $request->validate([
                'title'                     => 'required|string|max:255',
                'description'               => 'nullable|string',
                'status'                    => 'in:draft,active,closed',
                'questions'                 => 'array',
                'questions.*.type'          => 'required|in:short_text,paragraph,multiple_choice,checkboxes,dropdown,rating,date',
                'questions.*.label'         => 'required|string',
                'questions.*.options'       => 'nullable|array',
                'questions.*.required'      => 'boolean',
            ]);

            $survey = Survey::findOrFail($id);

            $survey->update([
                'title'       => $request->title,
                'description' => $request->description,
                'status'      => $request->input('status', $survey->status),
            ]);

            // Replace all questions
            $survey->questions()->delete();
            foreach ($request->input('questions', []) as $i => $q) {
                SurveyQuestion::create([
                    'survey_id' => $survey->id,
                    'order'     => $i,
                    'type'      => $q['type'],
                    'label'     => $q['label'],
                    'options'   => $q['options'] ?? null,
                    'required'  => $q['required'] ?? false,
                ]);
            }

            return response()->json([
                'success' => true,
                'survey'  => $survey->fresh()->load('questions'),
            ]);
        } catch (\Throwable $e) {
            Log::emergency('SURVEY ERROR: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'System error logged.'], 500);
        }
    }

    /**
     * Delete a survey and all associated data (cascades).
     */
    public function destroy(int $id)
    {
        try {
            Survey::findOrFail($id)->delete();
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
        $survey = Survey::with('questions')->findOrFail($id);
        return response()->json($survey);
    }

    /**
     * Render the public survey form.
     */
    public function publicShow(int $id)
    {
        $survey = Survey::with('questions')->findOrFail($id);

        if ($survey->status !== 'active') {
            abort(404, 'This survey is not currently active.');
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
        $survey = Survey::with('questions')->findOrFail($id);

        if ($survey->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'This survey is not currently accepting responses.'], 422);
        }

        $request->validate([
            'respondent_name'  => 'nullable|string|max:255',
            'respondent_email' => 'nullable|email|max:255',
            'answers'          => 'required|array',
        ]);

        // Validate required questions
        foreach ($survey->questions as $question) {
            if ($question->required) {
                $answer = $request->input('answers.' . $question->id);
                if ($answer === null || $answer === '' || (is_array($answer) && count($answer) === 0)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Question \"{$question->label}\" is required.",
                    ], 422);
                }
            }
        }

        try {
            $response = SurveyResponse::create([
                'survey_id'        => $id,
                'respondent_name'  => $request->respondent_name,
                'respondent_email' => $request->respondent_email,
                'answers'          => $request->answers,
                'submitted_at'     => now(),
            ]);

            // Notify all admins of survey response
            try {
                $respondent = $request->respondent_name ?: 'Anonymous';
                $notification = new \App\Notifications\SystemNotification(
                    'New Survey Response',
                    "A response was submitted by {$respondent} for \"{$survey->title}\".",
                    '/survey'
                );
                foreach (\App\Models\User::all() as $user) {
                    $user->notify($notification);
                }
            } catch (\Exception $ne) {
                Log::error('Notification Error: ' . $ne->getMessage());
            }

            return response()->json(['success' => true, 'response_id' => $response->id]);
        } catch (\Exception $e) {
            Log::error('Survey submit error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to submit response.'], 500);
        }
    }

    /**
     * Get aggregated responses for a survey.
     */
    public function getResponses(int $id)
    {
        $survey = Survey::with('questions')->findOrFail($id);
        $responses = SurveyResponse::where('survey_id', $id)->get();

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
}
