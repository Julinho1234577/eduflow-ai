<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    /**
     * ============================================================
     * LISTAR ASISTENCIAS
     * ============================================================
     *
     * ADMIN:
     * - Puede ver todas.
     *
     * DOCENTE:
     * - Solo asistencias de sus cursos.
     *
     * ESTUDIANTE:
     * - Solo sus propias asistencias.
     *
     * Soporta:
     * - paginación
     * - búsqueda
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        $query = Attendance::with([
            'enrollment.student.user',
            'enrollment.course.teacher.user',
        ]);

        /*
         * ========================================================
         * DOCENTE
         * ========================================================
         */

        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->whereHas(
                'enrollment.course',
                function ($courseQuery) use ($teacher) {
                    $courseQuery->where(
                        'teacher_id',
                        $teacher->id
                    );
                }
            );
        }

        /*
         * ========================================================
         * ESTUDIANTE
         * ========================================================
         */

        if ($user->role === 'estudiante') {

            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'message' => 'El usuario estudiante no tiene un perfil de estudiante asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->whereHas(
                'enrollment',
                function ($enrollmentQuery) use ($student) {
                    $enrollmentQuery->where(
                        'student_id',
                        $student->id
                    );
                }
            );
        }

        /*
         * ========================================================
         * BÚSQUEDA
         * ========================================================
         *
         * Ejemplos:
         *
         * /api/attendances?search=juan
         * /api/attendances?search=matematica
         * /api/attendances?search=2026
         */

        if ($request->filled('search')) {

            $search = trim(
                $request->input('search')
            );

            $query->where(function ($searchQuery) use ($search) {

                /*
                 * Nombre estudiante
                 */
                $searchQuery->whereHas(
                    'enrollment.student.user',
                    function ($userQuery) use ($search) {
                        $userQuery->where(
                            'name',
                            'ILIKE',
                            '%' . $search . '%'
                        );
                    }
                );

                /*
                 * Correo estudiante
                 */
                $searchQuery->orWhereHas(
                    'enrollment.student.user',
                    function ($userQuery) use ($search) {
                        $userQuery->where(
                            'email',
                            'ILIKE',
                            '%' . $search . '%'
                        );
                    }
                );

                /*
                 * Nombre curso
                 */
                $searchQuery->orWhereHas(
                    'enrollment.course',
                    function ($courseQuery) use ($search) {
                        $courseQuery->where(
                            'name',
                            'ILIKE',
                            '%' . $search . '%'
                        );
                    }
                );

                /*
                 * Código curso
                 */
                $searchQuery->orWhereHas(
                    'enrollment.course',
                    function ($courseQuery) use ($search) {
                        $courseQuery->where(
                            'code',
                            'ILIKE',
                            '%' . $search . '%'
                        );
                    }
                );

                /*
                 * Estado
                 */
                $searchQuery->orWhere(
                    'status',
                    'ILIKE',
                    '%' . $search . '%'
                );

                /*
                 * Justificación
                 */
                $searchQuery->orWhere(
                    'justification',
                    'ILIKE',
                    '%' . $search . '%'
                );
            });
        }

        /*
         * ========================================================
         * PAGINACIÓN
         * ========================================================
         */

        $perPage = min(
            max(
                (int) $request->input('per_page', 50),
                1
            ),
            100
        );

        $attendances = $query
            ->orderBy('id')
            ->paginate($perPage);

        return response()->json(
            $attendances,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * ============================================================
     * ASISTENCIAS DEL ESTUDIANTE AUTENTICADO
     * ============================================================
     */
    public function myAttendances(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'El usuario no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $attendances = Attendance::with([
            'enrollment.student.user',
            'enrollment.course.teacher.user',
        ])
            ->whereHas(
                'enrollment',
                function ($query) use ($student) {
                    $query->where(
                        'student_id',
                        $student->id
                    );
                }
            )
            ->orderBy('attendance_date')
            ->get();

        return response()->json(
            $attendances,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * ============================================================
     * CREAR ASISTENCIA
     * ============================================================
     *
     * SOLO DOCENTE
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        if ($user->role !== 'docente') {
            return response()->json([
                'message' => 'Solo un docente puede registrar asistencias.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $teacher = $user->teacher;

        if (!$teacher) {
            return response()->json([
                'message' => 'El usuario docente no tiene un perfil de docente asociado.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $validated = $request->validate([
            'enrollment_id' => [
                'required',
                'integer',
                'exists:enrollments,id',
            ],

            'attendance_date' => [
                'required',
                'date',
            ],

            'status' => [
                'required',
                'string',
                Rule::in([
                    'present',
                    'absent',
                    'late',
                    'justified',
                ]),
            ],

            'justification' => [
                'nullable',
                'string',
            ],
        ]);

        /*
         * Obtener matrícula.
         */
        $enrollment = Enrollment::with('course')
            ->find($validated['enrollment_id']);

        if (!$enrollment) {
            return response()->json([
                'message' => 'La matrícula no existe.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * Verificar curso.
         */
        if (
            !$enrollment->course ||
            (int) $enrollment->course->teacher_id !==
            (int) $teacher->id
        ) {
            return response()->json([
                'message' => 'No puedes registrar asistencia para un curso que no tienes asignado.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * Evitar duplicados.
         */
        $exists = Attendance::where(
            'enrollment_id',
            $enrollment->id
        )
            ->whereDate(
                'attendance_date',
                $validated['attendance_date']
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe una asistencia registrada para este estudiante en esa fecha.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $attendance = Attendance::create(
            $validated
        );

        return response()->json(
            $attendance->load([
                'enrollment.student.user',
                'enrollment.course.teacher.user',
            ]),
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * ============================================================
     * MOSTRAR ASISTENCIA
     * ============================================================
     */
    public function show(
        Request $request,
        Attendance $attendance
    ): JsonResponse {

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * Cargar relaciones necesarias.
         */
        $attendance->load([
            'enrollment.student.user',
            'enrollment.course.teacher.user',
        ]);

        /*
         * ========================================================
         * DOCENTE
         * ========================================================
         */

        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$attendance->enrollment ||
                !$attendance->enrollment->course ||
                (int) $attendance->enrollment->course->teacher_id !==
                (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar esta asistencia.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * ========================================================
         * ESTUDIANTE
         * ========================================================
         */

        if ($user->role === 'estudiante') {

            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'message' => 'El usuario estudiante no tiene un perfil de estudiante asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$attendance->enrollment ||
                (int) $attendance->enrollment->student_id !==
                (int) $student->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar esta asistencia.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        return response()->json(
            $attendance,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * ============================================================
     * ACTUALIZAR ASISTENCIA
     * ============================================================
     *
     * SOLO DOCENTE
     */
    public function update(
        Request $request,
        Attendance $attendance
    ): JsonResponse {

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        if ($user->role !== 'docente') {
            return response()->json([
                'message' => 'Solo un docente puede actualizar asistencias.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $teacher = $user->teacher;

        if (!$teacher) {
            return response()->json([
                'message' => 'El usuario docente no tiene un perfil de docente asociado.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * Verificar asistencia actual.
         */
        $attendance->load('enrollment.course');

        if (
            !$attendance->enrollment ||
            !$attendance->enrollment->course ||
            (int) $attendance->enrollment->course->teacher_id !==
            (int) $teacher->id
        ) {
            return response()->json([
                'message' => 'No tienes permisos para modificar esta asistencia.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $validated = $request->validate([
            'enrollment_id' => [
                'sometimes',
                'integer',
                'exists:enrollments,id',
            ],

            'attendance_date' => [
                'sometimes',
                'date',
            ],

            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'present',
                    'absent',
                    'late',
                    'justified',
                ]),
            ],

            'justification' => [
                'sometimes',
                'nullable',
                'string',
            ],
        ]);

        /*
         * Verificar nueva matrícula si cambió.
         */
        if (isset($validated['enrollment_id'])) {

            $newEnrollment = Enrollment::with('course')
                ->find(
                    $validated['enrollment_id']
                );

            if (
                !$newEnrollment ||
                !$newEnrollment->course ||
                (int) $newEnrollment->course->teacher_id !==
                (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No puedes mover la asistencia a un curso que no tienes asignado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * Valores finales.
         */
        $finalEnrollmentId =
            $validated['enrollment_id']
            ?? $attendance->enrollment_id;

        $finalDate =
            $validated['attendance_date']
            ?? $attendance->attendance_date;

        /*
         * Verificar duplicado.
         */
        $duplicate = Attendance::where(
            'enrollment_id',
            $finalEnrollmentId
        )
            ->whereDate(
                'attendance_date',
                $finalDate
            )
            ->where(
                'id',
                '!=',
                $attendance->id
            )
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'Ya existe otra asistencia para este estudiante en esa fecha.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $attendance->update(
            $validated
        );

        return response()->json(
            $attendance->fresh()->load([
                'enrollment.student.user',
                'enrollment.course.teacher.user',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * ============================================================
     * ELIMINAR ASISTENCIA
     * ============================================================
     *
     * SOLO DOCENTE
     */
    public function destroy(
        Request $request,
        Attendance $attendance
    ): JsonResponse {

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        if ($user->role !== 'docente') {
            return response()->json([
                'message' => 'Solo un docente puede eliminar asistencias.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $teacher = $user->teacher;

        if (!$teacher) {
            return response()->json([
                'message' => 'El usuario docente no tiene un perfil de docente asociado.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $attendance->load('enrollment.course');

        if (
            !$attendance->enrollment ||
            !$attendance->enrollment->course ||
            (int) $attendance->enrollment->course->teacher_id !==
            (int) $teacher->id
        ) {
            return response()->json([
                'message' => 'No tienes permisos para eliminar esta asistencia.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $attendance->delete();

        return response()->json([
            'message' => 'Asistencia eliminada correctamente.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}