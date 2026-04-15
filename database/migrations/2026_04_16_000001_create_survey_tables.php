<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Surveys master table
        if (!Schema::hasTable('surveys')) {
            Schema::create('surveys', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        // 2. Survey questions
        if (!Schema::hasTable('survey_questions')) {
            Schema::create('survey_questions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('survey_id');
                $table->integer('order')->default(0);
                $table->enum('type', [
                    'short_text',
                    'paragraph',
                    'multiple_choice',
                    'checkboxes',
                    'dropdown',
                    'rating',
                    'date',
                ])->default('short_text');
                $table->text('label');
                $table->json('options')->nullable(); // For choice-based types
                $table->boolean('required')->default(false);
                $table->timestamps();

                $table->foreign('survey_id')->references('id')->on('surveys')->onDelete('cascade');
            });
        }

        // 3. Survey responses
        if (!Schema::hasTable('survey_responses')) {
            Schema::create('survey_responses', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('survey_id');
                $table->string('respondent_name')->nullable();
                $table->string('respondent_email')->nullable();
                $table->json('answers'); // { question_id: answer }
                $table->timestamp('submitted_at')->useCurrent();

                $table->foreign('survey_id')->references('id')->on('surveys')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
    }
};
