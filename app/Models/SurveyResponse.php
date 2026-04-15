<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyResponse extends Model
{
    protected $table = 'survey_responses';

    public $timestamps = false;

    protected $fillable = [
        'survey_id',
        'respondent_name',
        'respondent_email',
        'answers',
        'submitted_at',
    ];

    protected $casts = [
        'answers'      => 'array',
        'submitted_at' => 'datetime',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id');
    }
}
