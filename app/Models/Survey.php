<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Survey extends Model
{
    use \App\Traits\Auditable;
    protected $table = 'surveys';

    protected $fillable = [
        'title',
        'description',
        'status',
        'created_by',
        'google_form_id',
        'responder_uri',
        'edit_uri',
        'is_google_form',
    ];

    protected $casts = [
        'is_google_form' => 'boolean',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class, 'survey_id')->orderBy('order');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class, 'survey_id');
    }
}
