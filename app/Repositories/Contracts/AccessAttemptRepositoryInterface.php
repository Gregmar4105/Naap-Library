<?php

namespace App\Repositories\Contracts;

use App\Models\AccessAttempt;
use App\Models\RfidHistory;
use App\Models\StudentLog;

interface AccessAttemptRepositoryInterface extends BaseRepositoryInterface
{
    public function logAttempt(array $attributes): AccessAttempt;
    public function getActiveLockerHistory(string $libraryId): ?RfidHistory;
    public function getTodayLogsCount(string $libraryId, string $date): int;
    public function getLatestSessionLog(string $libraryId, string $date): ?StudentLog;
}
