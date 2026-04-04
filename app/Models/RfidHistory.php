<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RfidHistory extends Model
{
    protected $table = 'tbl_rfidhistory';

    public $timestamps = false;

    protected $fillable = [
        'RFID_CARD_NUMBER',
        'LIBRARY_ID',
        'BORROW_ON',
        'RETURN_ON',
        'LOCKER_NUMBER',
        'EMP_ID',
    ];

    protected $casts = [
        'BORROW_ON' => 'datetime',
        'RETURN_ON' => 'datetime',
    ];
}
