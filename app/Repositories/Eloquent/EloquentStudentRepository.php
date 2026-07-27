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
        \Illuminate\Support\Facades\Log::info('EloquentStudentRepository::findByLibraryId', [
            'query_id' => $libraryId,
            'is_sha256' => (bool) preg_match('/^[a-f0-9]{64}$/i', $libraryId)
        ]);

        if (preg_match('/^[a-f0-9]{64}$/i', $libraryId)) {
            $lowercaseHash = strtolower($libraryId);
            if (config('database.default') === 'mysql') {
                // Try matching SHA-256 of STUDENT_NUMBER first
                $student = $this->model::whereRaw('SHA2(STUDENT_NUMBER, 256) = ?', [$lowercaseHash])->first();
                if ($student) {
                    \Illuminate\Support\Facades\Log::info('EloquentStudentRepository::findByLibraryId found via MySQL SHA2 (STUDENT_NUMBER)', [
                        'library_id' => $student->LIBRARY_ID
                    ]);
                    return $student;
                }

                // Fallback to SHA-256 of LIBRARY_ID
                $student = $this->model::whereRaw('SHA2(LIBRARY_ID, 256) = ?', [$lowercaseHash])->first();
                if ($student) {
                    \Illuminate\Support\Facades\Log::info('EloquentStudentRepository::findByLibraryId found via MySQL SHA2 (LIBRARY_ID)', [
                        'library_id' => $student->LIBRARY_ID
                    ]);
                    return $student;
                }
            } else {
                // Database-agnostic fallback (e.g. SQLite for testing)
                $students = $this->model::select('STUDENT_NUMBER', 'LIBRARY_ID')->get();
                foreach ($students as $s) {
                    if ($s->STUDENT_NUMBER && hash('sha256', $s->STUDENT_NUMBER) === $lowercaseHash) {
                        $student = $this->model::where('LIBRARY_ID', $s->LIBRARY_ID)->first();
                        \Illuminate\Support\Facades\Log::info('EloquentStudentRepository::findByLibraryId found via SQLite fallback (STUDENT_NUMBER)', [
                            'library_id' => $student ? $student->LIBRARY_ID : null
                        ]);
                        return $student;
                    }
                    if (hash('sha256', $s->LIBRARY_ID) === $lowercaseHash) {
                        $student = $this->model::where('LIBRARY_ID', $s->LIBRARY_ID)->first();
                        \Illuminate\Support\Facades\Log::info('EloquentStudentRepository::findByLibraryId found via SQLite fallback (LIBRARY_ID)', [
                            'library_id' => $student ? $student->LIBRARY_ID : null
                        ]);
                        return $student;
                    }
                }
            }
            \Illuminate\Support\Facades\Log::warning('EloquentStudentRepository::findByLibraryId hash not matched to any student', [
                'hash' => $lowercaseHash
            ]);
            return null;
        }

        // Try exact LIBRARY_ID first
        $student = $this->model::where('LIBRARY_ID', $libraryId)->first();
        if ($student) {
            return $student;
        }

        // Fallback to exact STUDENT_NUMBER
        $student = $this->model::where('STUDENT_NUMBER', $libraryId)->first();
        if ($student) {
            return $student;
        }

        // Handle 13-digit EAN-13 barcode lookup (e.g. 2026000000015 -> 26-00001)
        if (preg_match('/^20(\d{2})(\d{8})\d$/', $libraryId, $matches)) {
            $reconstructedId = $matches[1] . '-' . str_pad((string)intval($matches[2]), 5, '0', STR_PAD_LEFT);
            $student = $this->model::where('LIBRARY_ID', $reconstructedId)
                ->orWhere('STUDENT_NUMBER', $reconstructedId)
                ->first();
            if ($student) {
                return $student;
            }
        }

        // Fallback: Check if any student matches computed EAN-13
        if (preg_match('/^\d{13}$/', $libraryId)) {
            $allStudents = $this->model::select('LIBRARY_ID', 'STUDENT_NUMBER')->get();
            foreach ($allStudents as $s) {
                if (\App\Services\BarcodeService::generateEan13($s->LIBRARY_ID) === $libraryId ||
                    \App\Services\BarcodeService::generateEan13($s->STUDENT_NUMBER) === $libraryId) {
                    return $this->model::where('LIBRARY_ID', $s->LIBRARY_ID)->first();
                }
            }
        }

        return null;
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
