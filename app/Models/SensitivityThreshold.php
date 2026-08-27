<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SensitivityThreshold extends Model
{
    use \App\Traits\Auditable;
    use HasFactory;

    protected $table = 'tbl_sensitivity_thresholds';

    protected $fillable = [
        'key',
        'value',
        'description',
    ];
}
