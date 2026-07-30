<?php

namespace App\Services;

use App\Repositories\Contracts\SurveyRepositoryInterface;
use App\Notifications\SystemNotification;
use App\Models\User;
use App\Models\SurveyResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class SurveyService
{
    protected SurveyRepositoryInterface $surveyRepository;
    protected GoogleFormsService $googleFormsService;

    public function __construct(
        SurveyRepositoryInterface $surveyRepository,
        GoogleFormsService $googleFormsService
    ) {
        $this->surveyRepository   = $surveyRepository;
        $this->googleFormsService = $googleFormsService;
    }

    public function getGoogleFormsService(): GoogleFormsService
    {
        return $this->googleFormsService;
    }

    public function createSurvey(array $data)
    {
        return DB::transaction(function () use ($data) {
            $survey = $this->surveyRepository->create([
                'title'          => $data['title'],
                'description'    => $data['description'] ?? null,
                'status'         => $data['status'] ?? 'draft',
                'is_google_form' => true,
                'created_by'     => auth()->id(),
            ]);

            $questions = $data['questions'] ?? [];
            $createdQuestions = [];

            foreach ($questions as $i => $q) {
                $createdQuestions[] = $this->surveyRepository->createQuestion([
                    'survey_id' => $survey->id,
                    'order'     => $i,
                    'type'      => $q['type'],
                    'label'     => $q['label'],
                    'options'   => $q['options'] ?? null,
                    'required'  => $q['required'] ?? false,
                ]);
            }

            // Create Google Form if API is configured
            if ($this->googleFormsService->isConfigured()) {
                try {
                    $googleResult = $this->googleFormsService->createForm(
                        $survey->title,
                        $survey->description,
                        $questions
                    );

                    $survey->update([
                        'google_form_id' => $googleResult['google_form_id'],
                        'responder_uri'  => $googleResult['responder_uri'],
                        'edit_uri'       => $googleResult['edit_uri'],
                    ]);

                    // Associate google_item_id with questions if provided
                    if (!empty($googleResult['items']) && is_array($googleResult['items'])) {
                        foreach ($googleResult['items'] as $idx => $gItem) {
                            if (isset($createdQuestions[$idx]) && isset($gItem['itemId'])) {
                                $createdQuestions[$idx]->update([
                                    'google_item_id' => $gItem['itemId'],
                                ]);
                            }
                        }
                    }
                } catch (Exception $e) {
                    Log::error('Google Forms API Creation Error: ' . $e->getMessage());
                }
            }

            // Notify all admins of new survey creation
            try {
                $creator = auth()->user()->name ?? 'Admin';
                $notification = new SystemNotification(
                    'New Survey Created',
                    "Survey \"{$survey->title}\" was created by {$creator}.",
                    '/survey'
                );
                foreach (User::all() as $user) {
                    $user->notify($notification);
                }
            } catch (Exception $ne) {
                Log::error('Notification Error: ' . $ne->getMessage());
            }

            return $survey->fresh()->load('questions');
        });
    }

    public function updateSurvey(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $survey = $this->surveyRepository->findOrFail($id);

            $this->surveyRepository->update($id, [
                'title'       => $data['title'],
                'description' => $data['description'] ?? null,
                'status'      => $data['status'] ?? $survey->status,
            ]);

            // Replace all questions locally
            $this->surveyRepository->deleteQuestions($id);
            $questions = $data['questions'] ?? [];
            $createdQuestions = [];

            foreach ($questions as $i => $q) {
                $createdQuestions[] = $this->surveyRepository->createQuestion([
                    'survey_id' => $survey->id,
                    'order'     => $i,
                    'type'      => $q['type'],
                    'label'     => $q['label'],
                    'options'   => $q['options'] ?? null,
                    'required'  => $q['required'] ?? false,
                ]);
            }

            // Update or create Google Form
            if ($this->googleFormsService->isConfigured()) {
                try {
                    if ($survey->google_form_id) {
                        $googleResult = $this->googleFormsService->updateForm(
                            $survey->google_form_id,
                            $data['title'],
                            $data['description'] ?? null,
                            $questions
                        );
                    } else {
                        $googleResult = $this->googleFormsService->createForm(
                            $data['title'],
                            $data['description'] ?? null,
                            $questions
                        );

                        $survey->update([
                            'google_form_id' => $googleResult['google_form_id'],
                            'responder_uri'  => $googleResult['responder_uri'],
                            'edit_uri'       => $googleResult['edit_uri'],
                        ]);
                    }

                    if (!empty($googleResult['items']) && is_array($googleResult['items'])) {
                        foreach ($googleResult['items'] as $idx => $gItem) {
                            if (isset($createdQuestions[$idx]) && isset($gItem['itemId'])) {
                                $createdQuestions[$idx]->update([
                                    'google_item_id' => $gItem['itemId'],
                                ]);
                            }
                        }
                    }
                } catch (Exception $e) {
                    Log::error('Google Forms API Update Error: ' . $e->getMessage());
                }
            }

            return $survey->fresh()->load('questions');
        });
    }

    public function publishToGoogleForms(int $surveyId)
    {
        $survey = $this->surveyRepository->findWithQuestions($surveyId);
        if (!$survey) {
            throw new Exception('Survey not found.', 404);
        }

        if (!$this->googleFormsService->isConfigured()) {
            throw new Exception('Google Forms API credentials not configured. Please set your Service Account JSON in Settings.', 400);
        }

        $questionsArray = $survey->questions->map(function ($q) {
            return [
                'type'     => $q->type,
                'label'    => $q->label,
                'options'  => $q->options,
                'required' => (bool)$q->required,
            ];
        })->toArray();

        if ($survey->google_form_id) {
            $googleResult = $this->googleFormsService->updateForm(
                $survey->google_form_id,
                $survey->title,
                $survey->description,
                $questionsArray
            );
        } else {
            $googleResult = $this->googleFormsService->createForm(
                $survey->title,
                $survey->description,
                $questionsArray
            );
        }

        $survey->update([
            'google_form_id' => $googleResult['google_form_id'],
            'responder_uri'  => $googleResult['responder_uri'],
            'edit_uri'       => $googleResult['edit_uri'],
            'is_google_form' => true,
        ]);

        if (!empty($googleResult['items']) && is_array($googleResult['items'])) {
            foreach ($googleResult['items'] as $idx => $gItem) {
                if (isset($survey->questions[$idx]) && isset($gItem['itemId'])) {
                    $survey->questions[$idx]->update([
                        'google_item_id' => $gItem['itemId'],
                    ]);
                }
            }
        }

        return $survey->fresh()->load('questions');
    }

    public function deleteSurvey(int $id)
    {
        $survey = $this->surveyRepository->findOrFail($id);

        if ($survey->google_form_id && $this->googleFormsService->isConfigured()) {
            try {
                $this->googleFormsService->deleteForm($survey->google_form_id);
            } catch (Exception $e) {
                Log::error('Google Forms API Delete Error: ' . $e->getMessage());
            }
        }

        return $this->surveyRepository->delete($id);
    }

    public function syncGoogleResponses(int $surveyId): array
    {
        $survey = $this->surveyRepository->findWithQuestions($surveyId);
        if (!$survey) {
            throw new Exception('Survey not found.', 404);
        }

        if (!$survey->google_form_id) {
            throw new Exception('Survey does not have an associated Google Form ID.', 400);
        }

        if (!$this->googleFormsService->isConfigured()) {
            throw new Exception('Google Forms API credentials not configured.', 400);
        }

        $rawResponses = $this->googleFormsService->getResponses($survey->google_form_id);
        $syncedCount  = 0;

        foreach ($rawResponses as $gResp) {
            $gResponseId = $gResp['responseId'] ?? null;
            if (!$gResponseId) continue;

            $answersMap = [];
            $gAnswers   = $gResp['answers'] ?? [];

            foreach ($survey->questions as $q) {
                $qid = (string) $q->id;
                $gItemId = $q->google_item_id;
                $val = null;

                // Match by google_item_id or fall back
                foreach ($gAnswers as $itemId => $ansObj) {
                    if ($gItemId && $itemId === $gItemId) {
                        $textAnswers = $ansObj['textAnswers']['answers'] ?? [];
                        $vals = array_column($textAnswers, 'value');
                        $val = count($vals) === 1 ? $vals[0] : $vals;
                        break;
                    }
                }

                if ($val !== null) {
                    $answersMap[$qid] = $val;
                }
            }

            $respondentEmail = $gResp['respondentEmail'] ?? null;
            $submittedAt = isset($gResp['createTime']) ? date('Y-m-d H:i:s', strtotime($gResp['createTime'])) : now();

            // Store or update in DB
            SurveyResponse::updateOrCreate(
                [
                    'survey_id'        => $surveyId,
                    'respondent_email' => $respondentEmail,
                    'submitted_at'     => $submittedAt,
                ],
                [
                    'respondent_name'  => $respondentEmail ? explode('@', $respondentEmail)[0] : 'Google Respondent',
                    'answers'          => $answersMap,
                ]
            );
            $syncedCount++;
        }

        return [
            'success'      => true,
            'synced_count' => $syncedCount,
            'total_google' => count($rawResponses),
        ];
    }

    public function submitResponse(int $surveyId, array $data)
    {
        $survey = $this->surveyRepository->findActiveWithQuestions($surveyId);
        if (!$survey) {
            throw new Exception('This survey is not currently accepting responses.', 422);
        }

        // Validate required questions
        foreach ($survey->questions as $question) {
            if ($question->required) {
                $answer = $data['answers'][$question->id] ?? null;
                if ($answer === null || $answer === '' || (is_array($answer) && count($answer) === 0)) {
                    throw new Exception("Question \"{$question->label}\" is required.", 422);
                }
            }
        }

        $response = $this->surveyRepository->createResponse([
            'survey_id'        => $surveyId,
            'respondent_name'  => $data['respondent_name'] ?? null,
            'respondent_email' => $data['respondent_email'] ?? null,
            'answers'          => $data['answers'],
            'submitted_at'     => now(),
        ]);

        // Notify all admins of survey response
        try {
            $respondent = $data['respondent_name'] ?? 'Anonymous';
            $notification = new SystemNotification(
                'New Survey Response',
                "A response was submitted by {$respondent} for \"{$survey->title}\".",
                '/survey'
            );
            foreach (User::all() as $user) {
                $user->notify($notification);
            }
        } catch (Exception $ne) {
            Log::error('Notification Error: ' . $ne->getMessage());
        }

        return $response;
    }
}
