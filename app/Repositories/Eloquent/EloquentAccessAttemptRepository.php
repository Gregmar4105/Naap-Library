<?php

namespace App\Repositories\Eloquent;

use App\Models\AccessAttempt;
use App\Models\RfidHistory;
use App\Models\StudentLog;
use App\Repositories\Contracts\AccessAttemptRepositoryInterface;

class EloquentAccessAttemptRepository extends BaseRepository implements AccessAttemptRepositoryInterface
{
    public function __construct(AccessAttempt $model)
    {
        parent::__construct($model);
    }

    public function logAttempt(array $attributes): AccessAttempt
    {
        return $this->model::create($attributes);
    }

    public function getActiveLockerHistory(string $libraryId): ?RfidHistory
    {
        return RfidHistory::where('LIBRARY_ID', $libraryId)
            ->whereNull('RETURN_ON')
            ->first();
    }

    public function getTodayLogsCount(string $libraryId, string $date): int
    {
        return StudentLog::where('LIBRARY_ID', $libraryId)
            ->where('LOG_DATE', $date)
            ->count();
    }

    public function getLatestSessionLog(string $libraryId, string $date): ?StudentLog
    {
        return StudentLog::where('LIBRARY_ID', $libraryId)
            ->where('LOG_DATE', $date)
            ->orderBy('LOG_TIME', 'desc')
            ->first();
    }
}
