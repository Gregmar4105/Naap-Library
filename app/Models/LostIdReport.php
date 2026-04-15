<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LostIdReport extends Model
{
    protected $table = 'tbl_lost_id_reports';

    protected $fillable = [
        'old_library_id',
        'new_library_id',
        'student_number',
        'location_lost',
        'description',
        'affidavit_path',
        'processed_by',
    ];

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
