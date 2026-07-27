<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbl_storage_cleanup_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('cleanup_date');
            $table->timestamp('cutoff_date');
            $table->integer('student_logs_photos_deleted')->default(0);
            $table->integer('access_attempts_photos_deleted')->default(0);
            $table->integer('total_photos_deleted')->default(0);
            $table->bigInteger('total_bytes_freed')->default(0);
            $table->string('formatted_bytes_freed', 50)->default('0 B');
            $table->string('trigger_type', 20)->default('MANUAL'); // MANUAL or SCHEDULED
            $table->string('executed_by', 100)->nullable();
            $table->string('status', 20)->default('SUCCESS');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_storage_cleanup_logs');
    }
};
