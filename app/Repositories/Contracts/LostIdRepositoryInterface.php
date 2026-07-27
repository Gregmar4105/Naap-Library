<?php

namespace App\Repositories\Contracts;

use App\Models\LostIdReport;
use Illuminate\Database\Eloquent\Collection;

interface LostIdRepositoryInterface extends BaseRepositoryInterface
{
    public function searchActiveStudents(string $query, int $limit = 20): Collection;
    public function createReport(array $attributes): LostIdReport;
}
