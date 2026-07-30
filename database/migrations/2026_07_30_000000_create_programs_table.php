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
        if (!Schema::hasTable('tbl_programs')) {
            Schema::create('tbl_programs', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('department')->nullable();
                $table->decimal('duration_years', 4, 1)->default(4.0);
                $table->integer('duration_months')->default(48);
                $table->integer('semester_duration_months')->default(5);
                $table->date('semester_expiration_date')->nullable();
                $table->string('duration_display')->nullable();
                $table->text('description')->nullable();
                $table->string('status')->default('Active');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_programs');
    }
};
