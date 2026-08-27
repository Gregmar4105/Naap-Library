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
        Schema::create('tbl_lost_id_reports', function (Blueprint $table) {
            $table->id();
            $table->string('old_library_id');
            $table->string('new_library_id')->nullable();
            $table->string('student_number');
            $table->string('location_lost');
            $table->text('description')->nullable();
            $table->string('affidavit_path');
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_lost_id_reports');
    }
};
