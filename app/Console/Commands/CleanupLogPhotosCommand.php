<?php

namespace App\Console\Commands;

use App\Services\StorageCleanupService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CleanupLogPhotosCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:cleanup-photos {--cutoff= : Cutoff date in YYYY-MM-DD format (defaults to end of previous month)} {--type=SCHEDULED : Trigger type}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete student log and access attempt photos from host disk up to the specified end of month date';

    /**
     * Execute the console command.
     */
    public function handle(StorageCleanupService $cleanupService): int
    {
        $cutoffInput = $this->option('cutoff');
        $triggerType = $this->option('type') ?: 'SCHEDULED';

        $cutoffDate = null;
        if ($cutoffInput) {
            try {
                $cutoffDate = Carbon::parse($cutoffInput)->endOfDay();
            } catch (\Exception $e) {
                $this->error("Invalid date format for --cutoff option: {$cutoffInput}");
                return Command::FAILURE;
            }
        } else {
            // Default to end of previous month
            $cutoffDate = Carbon::now('Asia/Manila')->subMonth()->endOfMonth();
        }

        $this->info("Starting date-based photo cleanup up to cutoff date: {$cutoffDate->format('Y-m-d')}...");

        $result = $cleanupService->cleanupPhotos($cutoffDate, $triggerType, 'SYSTEM_CRON');

        if ($result['success']) {
            $this->info("✓ Cleanup completed successfully!");
            $this->line("  - Student Log Photos Cleared: {$result['student_logs_photos_deleted']}");
            $this->line("  - Access Attempt Photos Cleared: {$result['access_attempts_photos_deleted']}");
            $this->line("  - Total Host Photos Cleared: {$result['total_photos_deleted']}");
            $this->line("  - Total Storage Space Freed: {$result['formatted_bytes_freed']}");
            return Command::SUCCESS;
        } else {
            $this->error("✗ Cleanup failed: {$result['message']}");
            return Command::FAILURE;
        }
    }
}
