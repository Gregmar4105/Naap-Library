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
        Schema::table('tbl_access_attempts', function (Blueprint $table) {
            $table->string('LIBRARY_ID')->charset('utf8mb4')->collation('utf8mb4_general_ci')->change();
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
