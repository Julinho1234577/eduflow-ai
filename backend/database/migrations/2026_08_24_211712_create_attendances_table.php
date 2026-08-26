<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('enrollment_id')
                ->constrained('enrollments')
                ->cascadeOnDelete();

            $table->date('attendance_date');

            $table->string('status')->default('present');

            $table->text('justification')->nullable();

            $table->timestamps();

            $table->unique(
                ['enrollment_id', 'attendance_date'],
                'unique_enrollment_attendance_date'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};