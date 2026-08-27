<?php

namespace App\Traits;

use App\Models\AuditTrail;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    /**
     * Boot the Auditable trait for a model.
     */
    public static function bootAuditable()
    {
        static::created(function (Model $model) {
            static::audit('created', $model, null, $model->getAttributes());
        });

        static::updated(function (Model $model) {
            // Get only the changed attributes
            $changes = $model->getDirty();
            
            // Reconstruct the original state for changed properties
            $old = [];
            foreach ($changes as $key => $value) {
                $old[$key] = $model->getOriginal($key);
            }

            // Exclude models that had no real changes
            if (empty($changes)) {
                return;
            }

            static::audit('updated', $model, $old, $changes);
        });

        static::deleted(function (Model $model) {
            static::audit('deleted', $model, $model->getAttributes(), null);
        });
    }

    /**
     * Perform the audit logging.
     */
    protected static function audit($event, Model $model, $oldValues = null, $newValues = null)
    {
        // Default to system user if running in console, otherwise Guest
        $userId = null;
        $userName = app()->runningInConsole() ? 'System' : 'Guest';
        
        if (auth()->check()) {
            $userId = auth()->id();
            $userName = auth()->user()->name ?? 'Unknown User';
        }

        // Determine activity string
        $modelName = class_basename($model);
        $activity = ucfirst($event) . ' ' . $modelName;

        AuditTrail::create([
            'user_id' => $userId,
            'user_name' => $userName,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'event' => $event,
            'activity' => $activity,
            'ip_address' => request()->ip() ?: (request()->server('REMOTE_ADDR') ?: '127.0.0.1'),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'created_at' => now(),
        ]);
    }
}
