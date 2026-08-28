<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar la migración.
     *
     * Agrega índices en las columnas que más se usan
     * para filtrar (WHERE), unir (JOIN vía whereHas)
     * y ordenar (ORDER BY) en las consultas de notas
     * y matrículas.
     *
     * Sin estos índices, PostgreSQL tiene que recorrer
     * la tabla completa (Seq Scan) cada vez que se
     * busca por nombre de estudiante o se filtra por
     * curso/docente.
     */
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->index('enrollment_id', 'grades_enrollment_id_index');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->index('student_id', 'enrollments_student_id_index');
            $table->index('course_id', 'enrollments_course_id_index');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->index('teacher_id', 'courses_teacher_id_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('name', 'users_name_index');
        });
    }

    /**
     * Revertir la migración.
     */
    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex('grades_enrollment_id_index');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex('enrollments_student_id_index');
            $table->dropIndex('enrollments_course_id_index');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex('courses_teacher_id_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_name_index');
        });
    }
};