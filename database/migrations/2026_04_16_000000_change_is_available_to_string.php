<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. First, we need to make sure the data is compatible with the new type
        // If it's a tinyint, 1 -> 'Yes', 0 -> 'No'
        // We'll do this after changing the column type if possible, or before if we use a temp column.
        // However, Laravel's change() method for string might struggle if strict mode is on.
        
        Schema::table('tbl_rfid_info', function (Blueprint $table) {
            $table->string('IS_AVAILABLE')->default('Yes')->change();
        });

        // Update existing numeric data to strings
        DB::table('tbl_rfid_info')->where('IS_AVAILABLE', '1')->update(['IS_AVAILABLE' => 'Yes']);
        DB::table('tbl_rfid_info')->where('IS_AVAILABLE', '0')->update(['IS_AVAILABLE' => 'No']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_rfid_info', function (Blueprint $table) {
            $table->boolean('IS_AVAILABLE')->default(true)->change();
        });
        
        // Convert back
        DB::table('tbl_rfid_info')->where('IS_AVAILABLE', 'Yes')->update(['IS_AVAILABLE' => '1']);
        DB::table('tbl_rfid_info')->where('IS_AVAILABLE', 'No')->update(['IS_AVAILABLE' => '0']);
    }
};
