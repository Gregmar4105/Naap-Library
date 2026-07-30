<?php

use App\Models\Program;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

uses(Tests\TestCase::class);

test('calculateRenewalDate returns Carbon instance when semester_expiration_date is present', function () {
    $program = new Program([
        'semester_expiration_date' => CarbonImmutable::now()->addMonths(6),
        'semester_duration_months' => 5,
    ]);

    $renewalDate = $program->calculateRenewalDate();

    expect($renewalDate)->toBeInstanceOf(Carbon::class);
});

test('calculateRenewalDate returns Carbon instance when fromDate is passed', function () {
    $program = new Program([
        'semester_duration_months' => 5,
    ]);

    $fromDate = CarbonImmutable::now();
    $renewalDate = $program->calculateRenewalDate($fromDate);

    expect($renewalDate)->toBeInstanceOf(Carbon::class);
    expect($renewalDate->format('Y-m-d'))->toBe($fromDate->copy()->addMonths(5)->format('Y-m-d'));
});
