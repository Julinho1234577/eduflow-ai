<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->string('academic_period');

            $table->date('enrollment_date');

            $table->string('status')
                ->default('active');

            $table->timestamps();

            $table->unique(
                ['student_id', 'course_id', 'academic_period'],
                'unique_student_course_period'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};