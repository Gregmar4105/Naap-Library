<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentLog extends Model
{
    use \App\Traits\Auditable;
    protected $table = 'tbl_student_logs';
    
    // Depending on the table schema, it might have an auto-incrementing 'id' or not.
    // For now we assume standard id exists.
    
    public $timestamps = false; // Disable if created_at/updated_at don't exist
    
    protected $fillable = [
        'LIBRARY_ID',
        'LOG_TIME',
        'LOG_DATE',
        'LOG_SESSION',
        'LOG_IMAGE'
    ];
}
