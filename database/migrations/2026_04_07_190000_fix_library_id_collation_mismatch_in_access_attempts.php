<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix the collation mismatch between tbl_access_attempts.LIBRARY_ID
     * (utf8mb4_general_ci) and tbl_student_info.LIBRARY_ID (utf8mb4_unicode_ci).
     *
     * The mismatch causes MySQL to throw error 1267 on any JOIN between the
     * two tables. We align tbl_access_attempts.LIBRARY_ID to utf8mb4_unicode_ci
     * so both columns share the same collation.
     *
     * SQLite has no collation concept, so we skip it there.
     */
    public function up(): void
    {
        if (!in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            return;
        }

        Schema::table('tbl_access_attempts', function (Blueprint $table) {
            $table->string('LIBRARY_ID')
                  ->charset('utf8mb4')
                  ->collation('utf8mb4_unicode_ci')
                  ->nullable()
                  ->change();
        });
    }

    /**
     * Revert to the collation that the earlier fix_collation migration set.
     */
    public function down(): void
    {
        if (!in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            return;
        }

        Schema::table('tbl_access_attempts', function (Blueprint $table) {
            $table->string('LIBRARY_ID')
                  ->charset('utf8mb4')
                  ->collation('utf8mb4_general_ci')
                  ->nullable()
                  ->change();
        });
    }
};
