<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // utf8mb4 charset and collation are MySQL/MariaDB-specific.
        // SQLite does not support them, so we skip on non-MySQL drivers.
        $driver = DB::getDriverName();

        Schema::table('tbl_access_attempts', function (Blueprint $table) use ($driver) {
            if (in_array($driver, ['mysql', 'mariadb'])) {
                $table->string('LIBRARY_ID')
                      ->charset('utf8mb4')
                      ->collation('utf8mb4_unicode_ci')
                      ->nullable()
                      ->change();
            } else {
                $table->string('LIBRARY_ID')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_access_attempts', function (Blueprint $table) {
            $table->string('LIBRARY_ID')->nullable()->change();
        });
    }
};
