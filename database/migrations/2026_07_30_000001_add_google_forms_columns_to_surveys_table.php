<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surveys')) {
            Schema::table('surveys', function (Blueprint $table) {
                if (!Schema::hasColumn('surveys', 'google_form_id')) {
                    $table->string('google_form_id')->nullable()->after('status');
                }
                if (!Schema::hasColumn('surveys', 'responder_uri')) {
                    $table->text('responder_uri')->nullable()->after('google_form_id');
                }
                if (!Schema::hasColumn('surveys', 'edit_uri')) {
                    $table->text('edit_uri')->nullable()->after('responder_uri');
                }
                if (!Schema::hasColumn('surveys', 'is_google_form')) {
                    $table->boolean('is_google_form')->default(true)->after('edit_uri');
                }
            });
        }

        if (Schema::hasTable('survey_questions')) {
            Schema::table('survey_questions', function (Blueprint $table) {
                if (!Schema::hasColumn('survey_questions', 'google_item_id')) {
                    $table->string('google_item_id')->nullable()->after('required');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surveys')) {
            Schema::table('surveys', function (Blueprint $table) {
                $columns = ['google_form_id', 'responder_uri', 'edit_uri', 'is_google_form'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('surveys', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('survey_questions')) {
            Schema::table('survey_questions', function (Blueprint $table) {
                if (Schema::hasColumn('survey_questions', 'google_item_id')) {
                    $table->dropColumn('google_item_id');
                }
            });
        }
    }
};
