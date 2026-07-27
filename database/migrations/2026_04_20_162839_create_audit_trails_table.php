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
        Schema::create('audit_trails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            
            // Polymorphic relation
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');
            
            $table->string('event'); // created, updated, deleted
            $table->text('activity')->nullable(); // description
            $table->string('ip_address', 45)->nullable();
            
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            
            $table->timestamp('created_at')->useCurrent();
        });

        if (config('database.default') === 'mysql') {
            // Add a trigger to prevent deleting any rows from the audit_trails table
            DB::unprepared('
                CREATE TRIGGER prevent_audit_trails_deletion
                BEFORE DELETE ON audit_trails
                FOR EACH ROW
                BEGIN
                    SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Deletions from the audit_trails table are strictly prohibited.";
                END
            ');

            // Add a trigger to prevent updating any rows in the audit_trails table
            DB::unprepared('
                CREATE TRIGGER prevent_audit_trails_update
                BEFORE UPDATE ON audit_trails
                FOR EACH ROW
                BEGIN
                    SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Updates to the audit_trails table are strictly prohibited.";
                END
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS prevent_audit_trails_deletion');
            DB::unprepared('DROP TRIGGER IF EXISTS prevent_audit_trails_update');
        }
        Schema::dropIfExists('audit_trails');
    }
};
