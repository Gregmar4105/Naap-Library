<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Program extends Model
{
    use \App\Traits\Auditable;

    protected $table = 'tbl_programs';

    protected $fillable = [
        'code',
        'name',
        'department',
        'duration_years',
        'duration_months',
        'semester_duration_months',
        'semester_expiration_date',
        'duration_display',
        'description',
        'status',
    ];

    protected $casts = [
        'duration_years' => 'float',
        'duration_months' => 'integer',
        'semester_duration_months' => 'integer',
        'semester_expiration_date' => 'date',
    ];

    /**
     * Calculate renewal/expiration date for a student registering under this program.
     */
    public function calculateRenewalDate(?\DateTimeInterface $fromDate = null): Carbon
    {
        $startDate = $fromDate ? Carbon::instance($fromDate) : Carbon::now('Asia/Manila');

        if ($this->semester_expiration_date && $this->semester_expiration_date->isFuture()) {
            return Carbon::instance($this->semester_expiration_date);
        }

        $months = $this->semester_duration_months > 0 ? $this->semester_duration_months : 5;
        return $startDate->addMonths($months);
    }
}
