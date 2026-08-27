<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorageCleanupLog extends Model
{
    protected $table = 'tbl_storage_cleanup_logs';

    protected $fillable = [
        'cleanup_date',
        'cutoff_date',
        'student_logs_photos_deleted',
        'access_attempts_photos_deleted',
        'total_photos_deleted',
        'total_bytes_freed',
        'formatted_bytes_freed',
        'trigger_type',
        'executed_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'cleanup_date' => 'datetime',
        'cutoff_date' => 'datetime',
        'student_logs_photos_deleted' => 'integer',
        'access_attempts_photos_deleted' => 'integer',
        'total_photos_deleted' => 'integer',
        'total_bytes_freed' => 'integer',
    ];
}
