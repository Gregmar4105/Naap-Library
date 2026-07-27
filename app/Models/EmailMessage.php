<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailMessage extends Model
{
    use \App\Traits\Auditable;
    protected $fillable = [
        'message_id',
        'library_id',
        'direction',
        'from_email',
        'to_email',
        'subject',
        'body',
        'attachments',
        'sent_to',
        'is_read',
    ];
}
