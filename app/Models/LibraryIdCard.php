<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LibraryIdCard extends Model
{
    use HasFactory, \App\Traits\Auditable;

    protected $table = 'library_id_cards';

    protected $fillable = [
        'student_library_id',
        'library_id_number',
        'barcode_value',
        'created_year',
        'status',
        'issued_at',
        'printed_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'printed_at' => 'datetime',
        'created_year' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(StudentInfo::class, 'student_library_id', 'LIBRARY_ID');
    }
}
