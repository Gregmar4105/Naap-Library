<?php

namespace App\Services;

use App\Repositories\Contracts\SurveyRepositoryInterface;
use App\Notifications\SystemNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SurveyService
{
    protected SurveyRepositoryInterface $surveyRepository;

    public function __construct(SurveyRepositoryInterface $surveyRepository)
    {
        $this->surveyRepository = $surveyRepository;
    }

    public function createSurvey(array $data)
    {
        return DB::transaction(function () use ($data) {
            $survey = $this->surveyRepository->create([
                'title'       => $data['title'],
                'description' => $data['description'] ?? null,
                'status'      => $data['status'] ?? 'draft',
                'created_by'  => auth()->id(),
            ]);

            foreach ($data['questions'] ?? [] as $i => $q) {
                $this->surveyRepository->createQuestion([
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
                $notification = new SystemNotification(
                    'New Survey Created',
                    "Survey \"{$survey->title}\" was created by {$creator}.",
                    '/survey'
                );
                foreach (User::all() as $user) {
                    $user->notify($notification);
                }
            } catch (\Exception $ne) {
                Log::error('Notification Error: ' . $ne->getMessage());
            }

            return $survey->load('questions');
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

            // Replace all questions
            $this->surveyRepository->deleteQuestions($id);
            foreach ($data['questions'] ?? [] as $i => $q) {
                $this->surveyRepository->createQuestion([
                    'survey_id' => $survey->id,
                    'order'     => $i,
                    'type'      => $q['type'],
                    'label'     => $q['label'],
                    'options'   => $q['options'] ?? null,
                    'required'  => $q['required'] ?? false,
                ]);
            }

            return $survey->fresh()->load('questions');
        });
    }

    public function deleteSurvey(int $id)
    {
        $survey = $this->surveyRepository->findOrFail($id);
        return $this->surveyRepository->delete($id);
    }

    public function submitResponse(int $surveyId, array $data)
    {
        $survey = $this->surveyRepository->findActiveWithQuestions($surveyId);
        if (!$survey) {
            throw new \Exception('This survey is not currently accepting responses.', 422);
        }

        // Validate required questions
        foreach ($survey->questions as $question) {
            if ($question->required) {
                $answer = $data['answers'][$question->id] ?? null;
                if ($answer === null || $answer === '' || (is_array($answer) && count($answer) === 0)) {
                    throw new \Exception("Question \"{$question->label}\" is required.", 422);
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
        } catch (\Exception $ne) {
            Log::error('Notification Error: ' . $ne->getMessage());
        }

        return $response;
    }
}
