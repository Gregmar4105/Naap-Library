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
        if (!Schema::hasTable('tbl_violation_types')) {
            Schema::create('tbl_violation_types', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('severity')->default('Minor'); // Minor, Moderate, Major, Critical
                $table->string('status')->default('Active'); // Active, Inactive
                $table->timestamps();
            });

            // Seed initial violation types
            DB::table('tbl_violation_types')->insert([
                [
                    'code' => 'NOISE_DISTURBANCE',
                    'name' => 'Loud Noise & Disturbance',
                    'description' => 'Creating loud noise, playing unheadphoned audio, or disrupting quiet study zones.',
                    'severity' => 'Minor',
                    'status' => 'Active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'OVERDUE_BOOKS',
                    'name' => 'Unreturned / Overdue Library Materials',
                    'description' => 'Failing to return borrowed books, reference items, or equipment beyond the scheduled due date.',
                    'severity' => 'Moderate',
                    'status' => 'Active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'PROPERTY_DAMAGE',
                    'name' => 'Library Property Damage / Defacement',
                    'description' => 'Vandalizing, writing on, or causing physical damage to library facilities, furniture, or book collections.',
                    'severity' => 'Major',
                    'status' => 'Active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'FOOD_DRINKS',
                    'name' => 'Unauthorized Food & Beverages',
                    'description' => 'Bringing or consuming unsealed drinks or food inside non-designated library study areas.',
                    'severity' => 'Minor',
                    'status' => 'Active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'UNAUTHORIZED_ENTRY',
                    'name' => 'Bypassing Attendance Terminal',
                    'description' => 'Entering or exiting the library without scanning student RFID card or digital QR pass.',
                    'severity' => 'Minor',
                    'status' => 'Active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'code' => 'ID_TAMPERING',
                    'name' => 'ID Misuse & Impersonation',
                    'description' => 'Lending or using another student’s library ID credentials, RFID tag, or facial identification.',
                    'severity' => 'Critical',
                    'status' => 'Active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        if (!Schema::hasTable('tbl_student_violations')) {
            Schema::create('tbl_student_violations', function (Blueprint $table) {
                $table->id();
                $table->string('student_library_id');
                $table->unsignedBigInteger('violation_type_id');
                $table->text('notes')->nullable();
                $table->dateTime('occurred_at');
                $table->string('issued_by')->nullable();
                $table->string('status')->default('Active'); // Active, Resolved, Dismissed
                $table->dateTime('resolved_at')->nullable();
                $table->text('resolution_notes')->nullable();
                $table->timestamps();

                $table->foreign('student_library_id')
                      ->references('LIBRARY_ID')
                      ->on('tbl_student_info')
                      ->onDelete('cascade');

                $table->foreign('violation_type_id')
                      ->references('id')
                      ->on('tbl_violation_types')
                      ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_student_violations');
        Schema::dropIfExists('tbl_violation_types');
    }
};
