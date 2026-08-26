<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    /**
     * Listar matrículas.
     *
     * Admin:
     * - Puede ver todas las matrículas.
     *
     * Docente:
     * - Solo puede ver matrículas de sus propios cursos.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Enrollment::with([
            'student.user',
            'course.teacher',
        ]);

        /*
         * DOCENTE
         *
         * Solo puede consultar matrículas
         * pertenecientes a sus cursos.
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->whereHas('course', function ($courseQuery) use ($teacher) {
                $courseQuery->where('teacher_id', $teacher->id);
            });
        }

        /*
         * ESTUDIANTE
         *
         * Aunque actualmente la ruta general no está
         * habilitada para estudiantes, mantenemos la
         * protección por seguridad.
         */
        if ($user->role === 'estudiante') {

            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'message' => 'El usuario estudiante no tiene un perfil de estudiante asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->where('student_id', $student->id);
        }

        $enrollments = $query
            ->orderBy('id')
            ->get();

        return response()->json(
            $enrollments,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Listar las matrículas del estudiante autenticado.
     */
    public function myEnrollments(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'El usuario autenticado no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $enrollments = Enrollment::with([
            'student.user',
            'course.teacher',
        ])
            ->where('student_id', $student->id)
            ->orderBy('id')
            ->get();

        return response()->json(
            $enrollments,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Crear una matrícula.
     *
     * Admin:
     * - Puede matricular a cualquier estudiante en cualquier curso.
     *
     * Docente:
     * - Solo puede matricular estudiantes en sus propios cursos.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'student_id' => [
                'required',
                'integer',
                'exists:students,id',
            ],

            'course_id' => [
                'required',
                'integer',
                'exists:courses,id',
            ],

            'academic_period' => [
                'required',
                'string',
                'max:50',
            ],

            'enrollment_date' => [
                'required',
                'date',
            ],

            'status' => [
                'sometimes',
                'string',
                'max:50',
            ],
        ]);

        /*
         * DOCENTE
         *
         * Verificar que el curso pertenezca al docente.
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $course = \App\Models\Course::find($validated['course_id']);

            if (!$course) {
                return response()->json([
                    'message' => 'El curso no existe.',
                ], 404, [], JSON_UNESCAPED_UNICODE);
            }

            if ((int) $course->teacher_id !== (int) $teacher->id) {
                return response()->json([
                    'message' => 'No tienes permisos para matricular estudiantes en este curso.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * Evitar matrícula duplicada:
         *
         * Un estudiante no puede tener dos matrículas
         * en el mismo curso y período académico.
         */
        $alreadyExists = Enrollment::where(
            'student_id',
            $validated['student_id']
        )
            ->where(
                'course_id',
                $validated['course_id']
            )
            ->where(
                'academic_period',
                $validated['academic_period']
            )
            ->exists();

        if ($alreadyExists) {
            return response()->json([
                'message' => 'El estudiante ya está matriculado en este curso durante este período académico.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $enrollment = Enrollment::create($validated);

        return response()->json(
            $enrollment->load([
                'student.user',
                'course.teacher',
            ]),
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Mostrar una matrícula específica.
     *
     * Admin:
     * - Puede consultar cualquiera.
     *
     * Docente:
     * - Solo puede consultar matrículas de sus cursos.
     *
     * Estudiante:
     * - Solo puede consultar su propia matrícula.
     */
    public function show(
        Request $request,
        Enrollment $enrollment
    ): JsonResponse {
        $user = $request->user();

        /*
         * DOCENTE
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $enrollment->load('course');

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar esta matrícula.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * ESTUDIANTE
         */
        if ($user->role === 'estudiante') {

            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'message' => 'El usuario estudiante no tiene un perfil de estudiante asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if ((int) $enrollment->student_id !== (int) $student->id) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar esta matrícula.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        return response()->json(
            $enrollment->load([
                'student.user',
                'course.teacher',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Actualizar una matrícula.
     *
     * Admin:
     * - Puede actualizar cualquier matrícula.
     *
     * Docente:
     * - Solo puede actualizar matrículas de sus propios cursos.
     */
    public function update(
        Request $request,
        Enrollment $enrollment
    ): JsonResponse {
        $user = $request->user();

        /*
         * DOCENTE
         *
         * Verificar que la matrícula pertenezca
         * a uno de sus cursos.
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $enrollment->load('course');

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para modificar esta matrícula.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            /*
             * Si el docente intenta cambiar el curso,
             * verificar que el nuevo curso también sea suyo.
             */
            if ($request->has('course_id')) {

                $newCourse = \App\Models\Course::find(
                    $request->input('course_id')
                );

                if (!$newCourse) {
                    return response()->json([
                        'message' => 'El nuevo curso no existe.',
                    ], 422, [], JSON_UNESCAPED_UNICODE);
                }

                if ((int) $newCourse->teacher_id !== (int) $teacher->id) {
                    return response()->json([
                        'message' => 'No puedes mover una matrícula a un curso que no te pertenece.',
                    ], 403, [], JSON_UNESCAPED_UNICODE);
                }
            }
        }

        /*
         * ESTUDIANTE
         *
         * No debería llegar aquí porque las rutas de update
         * están protegidas para admin/docente.
         *
         * Aun así, agregamos protección adicional.
         */
        if ($user->role === 'estudiante') {

            return response()->json([
                'message' => 'Los estudiantes no pueden modificar matrículas.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $validated = $request->validate([
            'student_id' => [
                'sometimes',
                'integer',
                'exists:students,id',
            ],

            'course_id' => [
                'sometimes',
                'integer',
                'exists:courses,id',
            ],

            'academic_period' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'enrollment_date' => [
                'sometimes',
                'date',
            ],

            'status' => [
                'sometimes',
                'string',
                'max:50',
            ],
        ]);

        /*
         * Verificar duplicados si se cambia:
         * estudiante, curso o período.
         */
        $studentId = $validated['student_id']
            ?? $enrollment->student_id;

        $courseId = $validated['course_id']
            ?? $enrollment->course_id;

        $academicPeriod = $validated['academic_period']
            ?? $enrollment->academic_period;

        $duplicate = Enrollment::where(
            'student_id',
            $studentId
        )
            ->where(
                'course_id',
                $courseId
            )
            ->where(
                'academic_period',
                $academicPeriod
            )
            ->where(
                'id',
                '!=',
                $enrollment->id
            )
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'Ya existe otra matrícula para este estudiante, curso y período académico.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $enrollment->update($validated);

        return response()->json(
            $enrollment->fresh()->load([
                'student.user',
                'course.teacher',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Eliminar una matrícula.
     *
     * Admin:
     * - Puede eliminar cualquiera.
     *
     * Docente:
     * - Solo puede eliminar matrículas de sus cursos.
     */
    public function destroy(
        Request $request,
        Enrollment $enrollment
    ): JsonResponse {
        $user = $request->user();

        /*
         * DOCENTE
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $enrollment->load('course');

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para eliminar esta matrícula.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * ESTUDIANTE
         */
        if ($user->role === 'estudiante') {

            return response()->json([
                'message' => 'Los estudiantes no pueden eliminar matrículas.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $enrollment->delete();

        return response()->json([
            'message' => 'Matrícula eliminada correctamente.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}