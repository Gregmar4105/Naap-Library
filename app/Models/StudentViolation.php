<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class StudentViolation extends Model
{
    use Auditable;

    protected $table = 'tbl_student_violations';

    protected $fillable = [
        'student_library_id',
        'violation_type_id',
        'notes',
        'occurred_at',
        'issued_by',
        'status',
        'resolved_at',
        'resolution_notes',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(StudentInfo::class, 'student_library_id', 'LIBRARY_ID');
    }

    public function violationType()
    {
        return $this->belongsTo(ViolationType::class, 'violation_type_id');
    }
}
