<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessAttempt extends Model
{
    use \App\Traits\Auditable;
    protected $table = 'tbl_access_attempts';

    protected $fillable = [
        'LIBRARY_ID',
        'STATUS',
        'IMAGE_PATH',
        'ATTEMPT_TYPE',
        'LOG_DATE',
        'LOG_TIME'
    ];
}
