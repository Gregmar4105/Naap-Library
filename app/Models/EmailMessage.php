<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailMessage extends Model
{
    use \App\Traits\Auditable;
    protected $fillable = [
        'library_id',
        'subject',
        'body',
        'attachments',
        'sent_to',
        'is_read',
    ];
}
