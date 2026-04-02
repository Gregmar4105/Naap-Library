<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentInfo extends Model
{
    protected $table = 'tbl_student_info';
    
    protected $primaryKey = 'LIBRARY_ID';
    public $incrementing = false;
    protected $keyType = 'string';
    
    // Disable timestamps if they don't exist in the remote DB
    public $timestamps = false;
    
    protected $fillable = [
        'LIBRARY_ID',
        'STUDENT_NUMBER',
        'FN',
        'MN',
        'LN',
        'PIC',
        'COURSE',
        'ID_STATUS'
    ];
}
