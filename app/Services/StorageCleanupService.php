<?php

namespace App\Services;

use App\Models\AccessAttempt;
use App\Models\StudentLog;
use App\Models\StorageCleanupLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class StorageCleanupService
{
    /**
     * Get detailed analytics regarding disk storage, application files, and database table sizes.
     */
    public function getStorageAnalytics(): array
    {
        $storagePath = storage_path();
        $publicDiskPath = storage_path('app/public');
        $logCapturesPath = storage_path('app/public/log_captures');
        $avatarsPath = storage_path('app/public/avatars');

        // Disk metrics
        $diskTotal = @disk_total_space($storagePath) ?: 0;
        $diskFree = @disk_free_space($storagePath) ?: 0;
        $diskUsed = max(0, $diskTotal - $diskFree);
        $diskUsedPercent = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        // Directory sizes
        $appStorageBytes = $this->getDirectorySize($storagePath);
        $logCapturesBytes = $this->getDirectorySize($logCapturesPath);
        $avatarsBytes = $this->getDirectorySize($avatarsPath);

        // Database sizes
        $dbName = config('database.connections.mysql.database', 'naap_db_from_web');
        $dbTables = [];
        $dbTotalBytes = 0;

        try {
            $tableStats = DB::select("
                SELECT 
                    TABLE_NAME as table_name,
                    TABLE_ROWS as table_rows,
                    (DATA_LENGTH + INDEX_LENGTH) as table_bytes
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = ?
                ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
            ", [$dbName]);

            foreach ($tableStats as $stat) {
                $bytes = (int)$stat->table_bytes;
                $dbTotalBytes += $bytes;
                $dbTables[] = [
                    'name' => $stat->table_name,
                    'rows' => (int)$stat->table_rows,
                    'size_bytes' => $bytes,
                    'formatted_size' => $this->formatBytes($bytes),
                ];
            }
        } catch (\Exception $e) {
            Log::error('StorageAnalytics DB size query failed: ' . $e->getMessage());
        }

        // Photo log stats
        $studentLogsPhotoCount = StudentLog::whereNotNull('LOG_IMAGE')->where('LOG_IMAGE', '!=', '')->count();
        $accessAttemptsPhotoCount = AccessAttempt::whereNotNull('IMAGE_PATH')->where('IMAGE_PATH', '!=', '')->count();

        // Oldest log date with image
        $oldestStudentLogPhoto = StudentLog::whereNotNull('LOG_IMAGE')->where('LOG_IMAGE', '!=', '')->orderBy('LOG_DATE', 'asc')->value('LOG_DATE');
        $oldestAttemptPhoto = AccessAttempt::whereNotNull('IMAGE_PATH')->where('IMAGE_PATH', '!=', '')->orderBy('created_at', 'asc')->value('created_at');

        $oldestPhotoDate = null;
        if ($oldestStudentLogPhoto && $oldestAttemptPhoto) {
            $oldestPhotoDate = min($oldestStudentLogPhoto, Carbon::parse($oldestAttemptPhoto)->format('Y-m-d'));
        } else {
            $oldestPhotoDate = $oldestStudentLogPhoto ?: ($oldestAttemptPhoto ? Carbon::parse($oldestAttemptPhoto)->format('Y-m-d') : null);
        }

        // Calculate total log photos footprint
        $logPhotosTotalBytes = $logCapturesBytes;

        return [
            'disk' => [
                'total_bytes' => $diskTotal,
                'free_bytes' => $diskFree,
                'used_bytes' => $diskUsed,
                'used_percent' => $diskUsedPercent,
                'formatted_total' => $this->formatBytes($diskTotal),
                'formatted_free' => $this->formatBytes($diskFree),
                'formatted_used' => $this->formatBytes($diskUsed),
            ],
            'storage' => [
                'app_storage_bytes' => $appStorageBytes,
                'formatted_app_storage' => $this->formatBytes($appStorageBytes),
                'log_captures_bytes' => $logCapturesBytes,
                'formatted_log_captures' => $this->formatBytes($logCapturesBytes),
                'avatars_bytes' => $avatarsBytes,
                'formatted_avatars' => $this->formatBytes($avatarsBytes),
            ],
            'database' => [
                'name' => $dbName,
                'total_size_bytes' => $dbTotalBytes,
                'formatted_total_size' => $this->formatBytes($dbTotalBytes),
                'tables' => array_slice($dbTables, 0, 10), // Top 10 tables
            ],
            'log_photos' => [
                'student_logs_count' => $studentLogsPhotoCount,
                'access_attempts_count' => $accessAttemptsPhotoCount,
                'total_count' => $studentLogsPhotoCount + $accessAttemptsPhotoCount,
                'total_bytes' => $logPhotosTotalBytes,
                'formatted_total_bytes' => $this->formatBytes($logPhotosTotalBytes),
                'oldest_photo_date' => $oldestPhotoDate,
            ],
        ];
    }

    /**
     * Perform date-based cleanup of student log and access attempt photos on host disk & database.
     */
    public function cleanupPhotos(?Carbon $cutoffDate = null, string $triggerType = 'MANUAL', ?string $executedBy = null): array
    {
        // Default cutoff: End of previous month
        if (!$cutoffDate) {
            $cutoffDate = Carbon::now('Asia/Manila')->subMonth()->endOfMonth();
        }

        $now = Carbon::now('Asia/Manila');
        $bytesFreed = 0;
        $studentLogPhotosDeleted = 0;
        $accessAttemptPhotosDeleted = 0;

        $cutoffDateStr = $cutoffDate->format('Y-m-d H:i:s');
        $cutoffDateOnly = $cutoffDate->format('Y-m-d');

        try {
            // 1. Process Student Logs
            $studentLogs = StudentLog::whereNotNull('LOG_IMAGE')
                ->where('LOG_IMAGE', '!=', '')
                ->where('LOG_DATE', '<=', $cutoffDateOnly)
                ->get();

            foreach ($studentLogs as $log) {
                $path = $log->LOG_IMAGE;
                if ($path && Storage::disk('public')->exists($path)) {
                    $fileSize = Storage::disk('public')->size($path);
                    if (Storage::disk('public')->delete($path)) {
                        $bytesFreed += $fileSize;
                        $studentLogPhotosDeleted++;
                    }
                } else if ($path && file_exists(public_path('storage/' . $path))) {
                    $fileSize = @filesize(public_path('storage/' . $path)) ?: 0;
                    if (@unlink(public_path('storage/' . $path))) {
                        $bytesFreed += $fileSize;
                        $studentLogPhotosDeleted++;
                    }
                } else {
                    // Even if physical file was missing, count reference cleanup
                    $studentLogPhotosDeleted++;
                }

                $log->update(['LOG_IMAGE' => null]);
            }

            // 2. Process Access Attempts
            $accessAttempts = AccessAttempt::whereNotNull('IMAGE_PATH')
                ->where('IMAGE_PATH', '!=', '')
                ->where('created_at', '<=', $cutoffDateStr)
                ->get();

            foreach ($accessAttempts as $attempt) {
                $path = $attempt->IMAGE_PATH;
                if ($path && Storage::disk('public')->exists($path)) {
                    $fileSize = Storage::disk('public')->size($path);
                    if (Storage::disk('public')->delete($path)) {
                        $bytesFreed += $fileSize;
                        $accessAttemptPhotosDeleted++;
                    }
                } else if ($path && file_exists(public_path('storage/' . $path))) {
                    $fileSize = @filesize(public_path('storage/' . $path)) ?: 0;
                    if (@unlink(public_path('storage/' . $path))) {
                        $bytesFreed += $fileSize;
                        $accessAttemptPhotosDeleted++;
                    }
                } else {
                    $accessAttemptPhotosDeleted++;
                }

                $attempt->update(['IMAGE_PATH' => null]);
            }

            $totalPhotosDeleted = $studentLogPhotosDeleted + $accessAttemptPhotosDeleted;
            $formattedBytesFreed = $this->formatBytes($bytesFreed);

            // Record cleanup audit log
            $cleanupLog = StorageCleanupLog::create([
                'cleanup_date' => $now,
                'cutoff_date' => $cutoffDate,
                'student_logs_photos_deleted' => $studentLogPhotosDeleted,
                'access_attempts_photos_deleted' => $accessAttemptPhotosDeleted,
                'total_photos_deleted' => $totalPhotosDeleted,
                'total_bytes_freed' => $bytesFreed,
                'formatted_bytes_freed' => $formattedBytesFreed,
                'trigger_type' => strtoupper($triggerType),
                'executed_by' => $executedBy ?: 'SYSTEM',
                'status' => 'SUCCESS',
                'notes' => "Successfully cleaned {$totalPhotosDeleted} photos up to {$cutoffDateOnly}. Freed {$formattedBytesFreed}.",
            ]);

            return [
                'success' => true,
                'cleanup_id' => $cleanupLog->id,
                'cutoff_date' => $cutoffDateOnly,
                'student_logs_photos_deleted' => $studentLogPhotosDeleted,
                'access_attempts_photos_deleted' => $accessAttemptPhotosDeleted,
                'total_photos_deleted' => $totalPhotosDeleted,
                'total_bytes_freed' => $bytesFreed,
                'formatted_bytes_freed' => $formattedBytesFreed,
                'message' => "Photo cleanup completed! Deleted {$totalPhotosDeleted} host photos and freed {$formattedBytesFreed} of storage.",
            ];

        } catch (\Exception $e) {
            Log::error('StorageCleanupService error: ' . $e->getMessage());

            StorageCleanupLog::create([
                'cleanup_date' => $now,
                'cutoff_date' => $cutoffDate,
                'student_logs_photos_deleted' => $studentLogPhotosDeleted,
                'access_attempts_photos_deleted' => $accessAttemptPhotosDeleted,
                'total_photos_deleted' => $studentLogPhotosDeleted + $accessAttemptPhotosDeleted,
                'total_bytes_freed' => $bytesFreed,
                'formatted_bytes_freed' => $this->formatBytes($bytesFreed),
                'trigger_type' => strtoupper($triggerType),
                'executed_by' => $executedBy ?: 'SYSTEM',
                'status' => 'FAILED',
                'notes' => 'Cleanup failed: ' . $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to execute photo cleanup: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Recursively calculate directory size in bytes.
     */
    private function getDirectorySize(string $path): int
    {
        if (!file_exists($path) || !is_dir($path)) {
            return 0;
        }

        $size = 0;
        try {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::SELF_FIRST
            );

            foreach ($files as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }
        } catch (\Exception $e) {
            // Ignore unreadable directories
        }

        return $size;
    }

    /**
     * Format byte values into human-readable strings.
     */
    public function formatBytes(int $bytes, int $precision = 2): string
    {
        if ($bytes <= 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $base = log($bytes, 1024);
        $floor = floor($base);

        return round(pow(1024, $base - $floor), $precision) . ' ' . $units[$floor];
    }
}
