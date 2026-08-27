<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalendarNote extends Model
{
    use HasFactory;

    protected $fillable = ['date', 'time', 'note'];

    protected $casts = [
        'date' => 'date',
    ];
}
