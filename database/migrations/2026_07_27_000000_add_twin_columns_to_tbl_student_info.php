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
        if (Schema::hasTable('tbl_student_info')) {
            Schema::table('tbl_student_info', function (Blueprint $table) {
                if (!Schema::hasColumn('tbl_student_info', 'TWIN_LIBRARY_ID')) {
                    $table->string('TWIN_LIBRARY_ID')->nullable()->after('FACE_EMBEDDING');
                }
                if (!Schema::hasColumn('tbl_student_info', 'IS_TWIN')) {
                    $table->boolean('IS_TWIN')->default(false)->after('TWIN_LIBRARY_ID');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tbl_student_info')) {
            Schema::table('tbl_student_info', function (Blueprint $table) {
                if (Schema::hasColumn('tbl_student_info', 'TWIN_LIBRARY_ID')) {
                    $table->dropColumn('TWIN_LIBRARY_ID');
                }
                if (Schema::hasColumn('tbl_student_info', 'IS_TWIN')) {
                    $table->dropColumn('IS_TWIN');
                }
            });
        }
    }
};
