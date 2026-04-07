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
        if (!Schema::hasColumn('tbl_student_info', 'STUDENT_RFID_NUMBER')) {
            Schema::table('tbl_student_info', function (Blueprint $table) {
                $table->string('STUDENT_RFID_NUMBER')->nullable()->after('LIBRARY_ID');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tbl_student_info', 'STUDENT_RFID_NUMBER')) {
            Schema::table('tbl_student_info', function (Blueprint $table) {
                $table->dropColumn('STUDENT_RFID_NUMBER');
            });
        }
    }
};
