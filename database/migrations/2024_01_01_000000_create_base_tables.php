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
        Schema::create('tbl_student_info', function (Blueprint $table) {
            $table->string('LIBRARY_ID')->primary();
            $table->string('STUDENT_NUMBER')->nullable();
            $table->string('FN')->nullable();
            $table->string('MN')->nullable();
            $table->string('LN')->nullable();
            $table->string('SEX')->nullable();
            $table->date('BIRTHDAY')->nullable();
            $table->string('CONTACT_NUMBER')->nullable();
            $table->string('EMAIL')->nullable();
            $table->text('PIC')->nullable();
            $table->string('COURSE')->nullable();
            $table->text('ADDRESS')->nullable();
            $table->dateTime('REGISTERED_ON')->nullable();
            $table->dateTime('RENEW_ON')->nullable();
            $table->string('ID_STATUS')->nullable();
            $table->dateTime('ID_STATUS_DATE')->nullable();
        });

        Schema::create('tbl_rfid_info', function (Blueprint $table) {
            $table->string('RFID_NUMBER')->primary();
            $table->string('LOCKER_NUMBER')->nullable();
            $table->boolean('IS_AVAILABLE')->default(true);
        });

        Schema::create('tbl_rfidhistory', function (Blueprint $table) {
            $table->id();
            $table->string('RFID_CARD_NUMBER')->nullable();
            $table->string('LIBRARY_ID')->nullable();
            $table->dateTime('BORROW_ON')->nullable();
            $table->dateTime('RETURN_ON')->nullable();
            $table->string('LOCKER_NUMBER')->nullable();
            $table->string('EMP_ID')->nullable();
        });

        Schema::create('tbl_student_logs', function (Blueprint $table) {
            $table->id();
            $table->string('LIBRARY_ID')->nullable();
            $table->string('LOG_TIME')->nullable();
            $table->string('LOG_DATE')->nullable();
            $table->string('LOG_SESSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_student_logs');
        Schema::dropIfExists('tbl_rfidhistory');
        Schema::dropIfExists('tbl_rfid_info');
        Schema::dropIfExists('tbl_student_info');
    }
};
