<?php

namespace App\Repositories\Eloquent;

use App\Models\StudentInfo;
use App\Models\StudentLog;
use App\Repositories\Contracts\StudentRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentStudentRepository extends BaseRepository implements StudentRepositoryInterface
{
    public function __construct(StudentInfo $model)
    {
        parent::__construct($model);
    }

    public function searchActive(string $query, int $limit = 20): Collection
    {
        return $this->model::where('ID_STATUS', 'Active')
            ->where(function ($q) use ($query) {
                $q->where('STUDENT_NUMBER', 'LIKE', "%{$query}%")
                  ->orWhere('FN', 'LIKE', "%{$query}%")
                  ->orWhere('LN', 'LIKE', "%{$query}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$query}%"]);
            })
            ->select('LIBRARY_ID', 'STUDENT_NUMBER', 'FN', 'MN', 'LN', 'COURSE', 'PIC', 'ID_STATUS', 'EMAIL', 'CONTACT_NUMBER', 'SEX', 'BIRTHDAY', 'ADDRESS')
            ->limit($limit)
            ->get();
    }

    public function searchAll(string $query, int $limit = 20): Collection
    {
        return $this->model::where(function ($q) use ($query) {
                $q->where('STUDENT_NUMBER', 'LIKE', "%{$query}%")
                  ->orWhere('FN', 'LIKE', "%{$query}%")
                  ->orWhere('LN', 'LIKE', "%{$query}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$query}%"]);
            })
            ->select('LIBRARY_ID', 'STUDENT_RFID_NUMBER', 'STUDENT_NUMBER', 'FN', 'MN', 'LN', 'COURSE', 'PIC', 'ID_STATUS', 'SEX', 'EMAIL', 'CONTACT_NUMBER')
            ->limit($limit)
            ->get();
    }

    public function findByStudentNumber(string $studentNumber): ?StudentInfo
    {
        return $this->model::where('STUDENT_NUMBER', $studentNumber)->first();
    }

    public function findByLibraryId(string $libraryId): ?StudentInfo
    {
        return $this->model::where('LIBRARY_ID', $libraryId)->first();
    }

    public function generateNextLibraryId(): string
    {
        $yearPrefix = Carbon::now('Asia/Manila')->format('y');

        $latest = $this->model::where('LIBRARY_ID', 'LIKE', $yearPrefix . '-%')
            ->orderByRaw("CAST(SUBSTRING_INDEX(LIBRARY_ID, '-', -1) AS UNSIGNED) DESC")
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->LIBRARY_ID);
            $nextCount = intval(end($parts)) + 1;
        } else {
            $nextCount = 1;
        }

        return $yearPrefix . '-' . str_pad($nextCount, 5, '0', STR_PAD_LEFT);
    }

    public function paginateWithSearch(?string $search, int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->model::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('LIBRARY_ID', 'LIKE', "%{$search}%")
                  ->orWhere('STUDENT_NUMBER', 'LIKE', "%{$search}%")
                  ->orWhere('FN', 'LIKE', "%{$search}%")
                  ->orWhere('MN', 'LIKE', "%{$search}%")
                  ->orWhere('LN', 'LIKE', "%{$search}%")
                  ->orWhere('EMAIL', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(FN, ' ', LN) LIKE ?", ["%{$search}%"])
                  ->orWhereRaw("CONCAT(FN, ' ', MN, ' ', LN) LIKE ?", ["%{$search}%"]);
            });
        }

        return $query->orderBy('REGISTERED_ON', 'desc')
                     ->orderBy('LIBRARY_ID', 'desc')
                     ->paginate($perPage);
    }

    public function createStudentLog(array $attributes)
    {
        return StudentLog::create($attributes);
    }
}
