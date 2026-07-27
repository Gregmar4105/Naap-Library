<?php

namespace App\Repositories\Eloquent;

use App\Models\LostIdReport;
use App\Models\StudentInfo;
use App\Repositories\Contracts\LostIdRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentLostIdRepository extends BaseRepository implements LostIdRepositoryInterface
{
    public function __construct(LostIdReport $model)
    {
        parent::__construct($model);
    }

    public function searchActiveStudents(string $query, int $limit = 20): Collection
    {
        return StudentInfo::where('ID_STATUS', 'Active')
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

    public function createReport(array $attributes): LostIdReport
    {
        return $this->model::create($attributes);
    }
}
