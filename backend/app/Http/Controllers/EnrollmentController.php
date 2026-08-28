<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     *
     * Soporta:
     * - Paginación
     * - Búsqueda por estudiante
     * - Búsqueda por correo
     * - Búsqueda por curso
     * - Búsqueda por código de curso
     * - Búsqueda por período académico
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Enrollment::with([
            'student.user',
            'course.teacher',
        ]);

        /*
         * =====================================================
         * FILTRO POR ROL
         * =====================================================
         */

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
                $courseQuery->where(
                    'teacher_id',
                    $teacher->id
                );
            });
        }

        /*
         * ESTUDIANTE
         *
         * Solo puede consultar sus propias matrículas.
         */
        if ($user->role === 'estudiante') {

            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'message' => 'El usuario estudiante no tiene un perfil de estudiante asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->where(
                'student_id',
                $student->id
            );
        }

        /*
         /*
 * =====================================================
 * BÚSQUEDA
 * =====================================================
 *
 * Permite buscar por:
 *
 * - Nombre del estudiante
 * - Correo del estudiante
 * - Nombre del curso
 * - Código del curso
 * - Período académico
 */

        if ($request->filled('search')) {

            $search = trim(
                $request->input('search')
            );

            if ($search !== '') {

                $query->where(function ($searchQuery) use ($search) {

                    /*
             * ESTUDIANTE
             */
                    $searchQuery->whereHas(
                        'student.user',
                        function ($userQuery) use ($search) {

                            $userQuery
                                ->where('name', 'ILIKE', "%{$search}%")
                                ->orWhere('email', 'ILIKE', "%{$search}%");
                        }
                    )

                        /*
             * CURSO
             */
                        ->orWhereHas(
                            'course',
                            function ($courseQuery) use ($search) {

                                $courseQuery
                                    ->where('name', 'ILIKE', "%{$search}%")
                                    ->orWhere('code', 'ILIKE', "%{$search}%");
                            }
                        )

                        /*
             * PERÍODO ACADÉMICO
             */
                        ->orWhere(
                            'academic_period',
                            'ILIKE',
                            "%{$search}%"
                        );
                });
            }
        }
        /*
         * =====================================================
         * PAGINACIÓN
         * =====================================================
         *
         * Antes:
         *
         * ->get()
         *
         * Eso devolvía TODAS las matrículas.
         *
         * Ahora:
         *
         * ->paginate(50)
         *
         * Solo devuelve 50 registros por página.
         */

        $perPage = min(
            max(
                (int) $request->input('per_page', 50),
                1
            ),
            100
        );

        $enrollments = $query
            ->orderBy('id')
            ->paginate($perPage);
        /*
         * Laravel devuelve automáticamente:
         *
         * current_page
         * data
         * last_page
         * per_page
         * total
         *
         * Esto coincide con lo que espera
         * nuestro frontend React.
         */

        return response()->json(
            $enrollments,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Listar las matrículas del estudiante autenticado.
     *
     * Esta función se mantiene sin paginación porque
     * corresponde a las matrículas personales del estudiante.
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
            ->where(
                'student_id',
                $student->id
            )
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
         * =====================================================
         * DOCENTE
         * =====================================================
         */

        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $course = \App\Models\Course::find(
                $validated['course_id']
            );

            if (!$course) {
                return response()->json([
                    'message' => 'El curso no existe.',
                ], 404, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                (int) $course->teacher_id !==
                (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para matricular estudiantes en este curso.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * =====================================================
         * EVITAR MATRÍCULA DUPLICADA
         * =====================================================
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

        $enrollment = Enrollment::create(
            $validated
        );

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
                (int) $enrollment->course->teacher_id !==
                (int) $teacher->id
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

            if (
                (int) $enrollment->student_id !==
                (int) $student->id
            ) {
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
     */
    public function update(
        Request $request,
        Enrollment $enrollment
    ): JsonResponse {

        $user = $request->user();

        /*
         * =====================================================
         * DOCENTE
         * =====================================================
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
                (int) $enrollment->course->teacher_id !==
                (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para modificar esta matrícula.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            /*
             * Si cambia el curso, comprobar
             * que el nuevo curso también sea suyo.
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

                if (
                    (int) $newCourse->teacher_id !==
                    (int) $teacher->id
                ) {
                    return response()->json([
                        'message' => 'No puedes mover una matrícula a un curso que no te pertenece.',
                    ], 403, [], JSON_UNESCAPED_UNICODE);
                }
            }
        }

        /*
         * =====================================================
         * ESTUDIANTE
         * =====================================================
         */

        if ($user->role === 'estudiante') {

            return response()->json([
                'message' => 'Los estudiantes no pueden modificar matrículas.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * =====================================================
         * VALIDACIÓN
         * =====================================================
         */

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
         * =====================================================
         * VERIFICAR DUPLICADOS
         * =====================================================
         */

        $studentId =
            $validated['student_id']
            ?? $enrollment->student_id;

        $courseId =
            $validated['course_id']
            ?? $enrollment->course_id;

        $academicPeriod =
            $validated['academic_period']
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

        $enrollment->update(
            $validated
        );

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
                (int) $enrollment->course->teacher_id !==
                (int) $teacher->id
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
