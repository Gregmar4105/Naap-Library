<?php

namespace App\Repositories\Eloquent;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Repositories\Contracts\SurveyRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentSurveyRepository extends BaseRepository implements SurveyRepositoryInterface
{
    public function __construct(Survey $model)
    {
        parent::__construct($model);
    }

    public function getAllWithCounts(): Collection
    {
        return $this->model::withCount('questions', 'responses')
            ->orderByDesc('created_at')
            ->get();
    }

    public function findWithQuestions(int $id): ?Survey
    {
        return $this->model::with('questions')->find($id);
    }

    public function findActiveWithQuestions(int $id): ?Survey
    {
        return $this->model::with('questions')
            ->where('status', 'active')
            ->find($id);
    }

    public function createQuestion(array $attributes)
    {
        return SurveyQuestion::create($attributes);
    }

    public function deleteQuestions(int $surveyId)
    {
        return SurveyQuestion::where('survey_id', $surveyId)->delete();
    }

    public function createResponse(array $attributes)
    {
        return SurveyResponse::create($attributes);
    }

    public function getResponses(int $surveyId): Collection
    {
        return SurveyResponse::where('survey_id', $surveyId)->get();
    }
}
