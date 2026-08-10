<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentInfo extends Model
{
    use \App\Traits\Auditable;
    protected $table = 'tbl_student_info';
    
    protected $primaryKey = 'LIBRARY_ID';
    public $incrementing = false;
    protected $keyType = 'string';
    
    // Disable timestamps if they don't exist in the remote DB
    public $timestamps = false;
    
    protected $fillable = [
        'LIBRARY_ID',
        'STUDENT_RFID_NUMBER',
        'STUDENT_NUMBER',
        'FN',
        'MN',
        'LN',
        'SEX',
        'BIRTHDAY',
        'CONTACT_NUMBER',
        'EMAIL',
        'PIC',
        'FACE_EMBEDDING',
        'COURSE',
        'ADDRESS',
        'REGISTERED_ON',
        'RENEW_ON',
        'ID_STATUS',
        'ID_STATUS_DATE',
        'QR_SENT',
        'DEACTIVATION_NOTE',
        'TWIN_LIBRARY_ID',
        'IS_TWIN'
    ];

    protected $casts = [
        'FACE_EMBEDDING' => 'array',
        'IS_TWIN' => 'boolean',
    ];

    public function twin()
    {
        return $this->belongsTo(StudentInfo::class, 'TWIN_LIBRARY_ID', 'LIBRARY_ID');
    }

    public function violations()
    {
        return $this->hasMany(StudentViolation::class, 'student_library_id', 'LIBRARY_ID');
    }

    public function idCards()
    {
        return $this->hasMany(LibraryIdCard::class, 'student_library_id', 'LIBRARY_ID');
    }

    public function activeIdCard()
    {
        return $this->hasOne(LibraryIdCard::class, 'student_library_id', 'LIBRARY_ID')->where('status', 'ACTIVE')->latestOfMany();
    }
}


