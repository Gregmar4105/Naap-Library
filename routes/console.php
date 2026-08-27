<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('storage:cleanup-photos --type=SCHEDULED')
    ->monthlyOn(31, '23:59')
    ->timezone('Asia/Manila')
    ->description('Date-based automatic cleanup of log photos from host disk at end of month');

