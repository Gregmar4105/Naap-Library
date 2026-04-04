<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RfidInfo extends Model
{
    protected $table = 'tbl_rfid_info';

    public $timestamps = false;
    public $incrementing = false;
    protected $primaryKey = 'RFID_NUMBER';
    protected $keyType = 'string';

    protected $fillable = [
        'RFID_NUMBER',
        'LOCKER_NUMBER',
        'IS_AVAILABLE',
    ];
}
