<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyQuestion extends Model
{
    protected $table = 'survey_questions';

    protected $fillable = [
        'survey_id',
        'order',
        'type',
        'label',
        'options',
        'required',
    ];

    protected $casts = [
        'options'  => 'array',
        'required' => 'boolean',
    ];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class, 'survey_id');
    }
}
