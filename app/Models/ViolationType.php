<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class ViolationType extends Model
{
    use Auditable;

    protected $table = 'tbl_violation_types';

    protected $fillable = [
        'code',
        'name',
        'description',
        'severity',
        'status',
    ];

    public function studentViolations()
    {
        return $this->hasMany(StudentViolation::class, 'violation_type_id');
    }
}
