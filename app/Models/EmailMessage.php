<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailMessage extends Model
{
    protected $fillable = [
        'library_id',
        'subject',
        'body',
        'attachments',
        'sent_to',
        'is_read',
    ];
}
