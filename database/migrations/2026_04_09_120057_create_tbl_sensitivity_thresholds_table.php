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
        Schema::create('tbl_sensitivity_thresholds', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('key')->unique();
            $blueprint->decimal('value', 3, 2);
            $blueprint->string('description')->nullable();
            $blueprint->timestamps();
        });

        // Seed default thresholds
        DB::table('tbl_sensitivity_thresholds')->insert([
            [
                'key' => 'face_recognition',
                'value' => 0.45,
                'description' => 'Threshold for Face Recognition (Lower is stricter)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fingerprint',
                'value' => 0.60,
                'description' => 'Threshold for Fingerprint Recognition (Future module)',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_sensitivity_thresholds');
    }
};
