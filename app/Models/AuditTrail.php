<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditTrail extends Model
{
    use HasFactory;

    public $timestamps = false; // We will manually handle created_at, no updated_at

    protected $fillable = [
        'user_id',
        'user_name',
        'auditable_type',
        'auditable_id',
        'event',
        'activity',
        'ip_address',
        'old_values',
        'new_values',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Get the auditable model.
     */
    public function auditable()
    {
        return $this->morphTo();
    }

    /**
     * Prevent updates to the audit trail.
     */
    public function update(array $attributes = [], array $options = [])
    {
        throw new \Exception('Audit trails cannot be modified.');
    }

    /**
     * Prevent deletion of the audit trail.
     */
    public function delete()
    {
        throw new \Exception('Audit trails cannot be deleted.');
    }

    /**
     * Prevent force deletion of the audit trail.
     */
    public function forceDelete()
    {
        throw new \Exception('Audit trails cannot be deleted.');
    }
}
