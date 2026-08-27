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
        if (!Schema::hasTable('library_id_cards')) {
            Schema::create('library_id_cards', function (Blueprint $table) {
                $table->id();
                $table->string('student_library_id'); // References tbl_student_info.LIBRARY_ID
                $table->string('library_id_number')->unique(); // e.g. 26-0289
                $table->string('barcode_value'); // e.g. 26-0289
                $table->integer('created_year'); // e.g. 2026
                $table->string('status')->default('ACTIVE'); // ACTIVE, REVOKED, REPLACED, EXPIRED
                $table->timestamp('issued_at')->nullable();
                $table->timestamp('printed_at')->nullable();
                $table->timestamps();

                $table->index('student_library_id');
                $table->index('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('library_id_cards');
    }
};
