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
        Schema::create('tbl_access_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('LIBRARY_ID')->nullable();
            $table->enum('STATUS', ['success', 'failed']);
            $table->string('IMAGE_PATH')->nullable();
            $table->string('ATTEMPT_TYPE'); // login or logout
            $table->date('LOG_DATE');
            $table->time('LOG_TIME');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_access_attempts');
    }
};
