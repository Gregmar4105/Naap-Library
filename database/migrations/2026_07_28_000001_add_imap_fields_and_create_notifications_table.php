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
        Schema::table('email_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('email_messages', 'message_id')) {
                $table->string('message_id')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('email_messages', 'direction')) {
                $table->string('direction')->default('outgoing')->after('library_id');
            }
            if (!Schema::hasColumn('email_messages', 'from_email')) {
                $table->string('from_email')->nullable()->after('direction');
            }
            if (!Schema::hasColumn('email_messages', 'to_email')) {
                $table->string('to_email')->nullable()->after('from_email');
            }
        });

        if (!Schema::hasTable('system_notifications')) {
            Schema::create('system_notifications', function (Blueprint $table) {
                $table->id();
                $table->string('type')->default('email');
                $table->string('title');
                $table->text('message');
                $table->string('link')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_messages', function (Blueprint $table) {
            $table->dropColumn(['message_id', 'direction', 'from_email', 'to_email']);
        });

        Schema::dropIfExists('system_notifications');
    }
};
