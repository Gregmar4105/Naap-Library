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
        // 1. tbl_student_info
        if (!Schema::hasTable('tbl_student_info')) {
            Schema::create('tbl_student_info', function (Blueprint $table) {
                $table->string('LIBRARY_ID')->primary();
                $table->string('STUDENT_NUMBER')->nullable();
                $table->string('FN')->nullable();
                $table->string('MN')->nullable();
                $table->string('LN')->nullable();
                $table->string('SEX')->nullable();
                $table->string('BIRTHDAY')->nullable();
                $table->string('CONTACT_NUMBER')->nullable();
                $table->string('EMAIL')->nullable();
                $table->string('PIC')->nullable();
                $table->string('COURSE')->nullable();
                $table->string('ADDRESS')->nullable();
                $table->date('REGISTERED_ON')->nullable();
                $table->date('RENEW_ON')->nullable();
                $table->string('ID_STATUS')->nullable();
                $table->date('ID_STATUS_DATE')->nullable();
                // Note: STUDENT_RFID_NUMBER and FACE_EMBEDDING are added by later migrations
            });
        }

        // 2. tbl_student_logs
        if (!Schema::hasTable('tbl_student_logs')) {
            Schema::create('tbl_student_logs', function (Blueprint $table) {
                $table->id();
                $table->string('LIBRARY_ID');
                $table->time('LOG_TIME');
                $table->date('LOG_DATE');
                $table->string('LOG_SESSION');
                // Note: LOG_IMAGE is added by a later migration
            });
        }

        // 3. tbl_rfid_info
        if (!Schema::hasTable('tbl_rfid_info')) {
            Schema::create('tbl_rfid_info', function (Blueprint $table) {
                $table->string('RFID_NUMBER')->primary();
                $table->integer('LOCKER_NUMBER')->nullable();
                $table->boolean('IS_AVAILABLE')->default(true);
            });
        }

        // 4. tbl_rfidhistory
        if (!Schema::hasTable('tbl_rfidhistory')) {
            Schema::create('tbl_rfidhistory', function (Blueprint $table) {
                $table->id();
                $table->string('RFID_CARD_NUMBER');
                $table->string('LIBRARY_ID');
                $table->datetime('BORROW_ON');
                $table->datetime('RETURN_ON')->nullable();
                $table->string('LOCKER_NUMBER')->nullable();
                $table->string('EMP_ID')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_rfidhistory');
        Schema::dropIfExists('tbl_rfid_info');
        Schema::dropIfExists('tbl_student_logs');
        Schema::dropIfExists('tbl_student_info');
    }
};
