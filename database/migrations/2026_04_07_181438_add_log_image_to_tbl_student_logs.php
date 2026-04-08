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
        Schema::table('tbl_student_logs', function (Blueprint $table) {
            $table->string('LOG_IMAGE')->nullable()->after('LOG_SESSION');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_student_logs', function (Blueprint $table) {
            $table->dropColumn('LOG_IMAGE');
        });
    }
};
