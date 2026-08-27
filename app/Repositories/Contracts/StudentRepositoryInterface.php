<?php

namespace App\Repositories\Contracts;

use App\Models\StudentInfo;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface StudentRepositoryInterface extends BaseRepositoryInterface
{
    public function searchActive(string $query, int $limit = 20): Collection;
    public function searchAll(string $query, int $limit = 20): Collection;
    public function findByStudentNumber(string $studentNumber): ?StudentInfo;
    public function findByLibraryId(string $libraryId): ?StudentInfo;
    public function generateNextLibraryId(): string;
    public function paginateWithSearch(?string $search, int $perPage = 20): LengthAwarePaginator;
    public function createStudentLog(array $attributes);
}
