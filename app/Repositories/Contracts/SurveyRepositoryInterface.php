<?php

namespace App\Repositories\Contracts;

use App\Models\Survey;
use Illuminate\Database\Eloquent\Collection;

interface SurveyRepositoryInterface extends BaseRepositoryInterface
{
    public function getAllWithCounts(): Collection;
    public function getActiveWithCounts(): Collection;
    public function findWithQuestions(int $id): ?Survey;
    public function findActiveWithQuestions(int $id): ?Survey;
    public function createQuestion(array $attributes);
    public function deleteQuestions(int $surveyId);
    public function createResponse(array $attributes);
    public function getResponses(int $surveyId): Collection;
}
