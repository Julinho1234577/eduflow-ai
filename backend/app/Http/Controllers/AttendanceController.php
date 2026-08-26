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
     * Listar asistencias.
     *
     * ADMIN:
     * - Puede ver todas las asistencias.
     *
     * DOCENTE:
     * - Solo puede ver asistencias de sus propios cursos.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Attendance::with([
            'enrollment.student.user',
            'enrollment.course.teacher',
        ]);

        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->whereHas('enrollment.course', function ($courseQuery) use ($teacher) {
                $courseQuery->where('teacher_id', $teacher->id);
            });
        }

        $attendances = $query
            ->orderBy('id')
            ->get();

        return response()->json(
            $attendances,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Listar las asistencias del estudiante autenticado.
     */
    public function myAttendances(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'El usuario no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $attendances = Attendance::with([
            'enrollment.course.teacher',
        ])
            ->whereHas('enrollment', function ($query) use ($student) {
                $query->where('student_id', $student->id);
            })
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
     * Crear una asistencia.
     *
     * SOLO DOCENTE.
     *
     * El docente únicamente puede registrar asistencia
     * para estudiantes matriculados en sus propios cursos.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

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
                'nullable',
                'string',
            ],
        ]);

        /*
         * Verificar que la matrícula pertenezca
         * a un curso del docente autenticado.
         */
        $enrollment = Enrollment::with('course')
            ->find($validated['enrollment_id']);

        if (!$enrollment) {
            return response()->json([
                'message' => 'La matrícula no existe.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        if ((int) $enrollment->course->teacher_id !== (int) $teacher->id) {
            return response()->json([
                'message' => 'No puedes registrar asistencia para un curso que no tienes asignado.',
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * Evitar dos asistencias para el mismo estudiante
         * en la misma fecha.
         */
        $exists = Attendance::where('enrollment_id', $enrollment->id)
            ->whereDate('attendance_date', $validated['attendance_date'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ya existe una asistencia registrada para este estudiante en esa fecha.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $attendance = Attendance::create($validated);

        return response()->json(
            $attendance->load([
                'enrollment.student.user',
                'enrollment.course.teacher',
            ]),
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Mostrar una asistencia.
     *
     * ADMIN:
     * - Puede consultar cualquiera.
     *
     * DOCENTE:
     * - Solo puede consultar asistencias de sus cursos.
     */
    public function show(
        Request $request,
        Attendance $attendance
    ): JsonResponse {
        $user = $request->user();

        if ($user->role === 'docente') {

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
                (int) $attendance->enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar esta asistencia.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        return response()->json(
            $attendance->load([
                'enrollment.student.user',
                'enrollment.course.teacher',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Actualizar una asistencia.
     *
     * SOLO DOCENTE.
     *
     * El docente únicamente puede modificar asistencias
     * pertenecientes a sus propios cursos.
     */
    public function update(
        Request $request,
        Attendance $attendance
    ): JsonResponse {
        $user = $request->user();

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
         * Verificar la asistencia actual.
         */
        $attendance->load('enrollment.course');

        if (
            !$attendance->enrollment ||
            !$attendance->enrollment->course ||
            (int) $attendance->enrollment->course->teacher_id !== (int) $teacher->id
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
         * Si se intenta cambiar la matrícula,
         * verificar que la nueva matrícula también
         * pertenezca al docente.
         */
        if (isset($validated['enrollment_id'])) {

            $newEnrollment = Enrollment::with('course')
                ->find($validated['enrollment_id']);

            if (
                !$newEnrollment ||
                !$newEnrollment->course ||
                (int) $newEnrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No puedes mover la asistencia a un curso que no tienes asignado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        /*
         * Determinar matrícula y fecha finales
         * para validar duplicados.
         */
        $finalEnrollmentId =
            $validated['enrollment_id']
            ?? $attendance->enrollment_id;

        $finalDate =
            $validated['attendance_date']
            ?? $attendance->attendance_date;

        $duplicate = Attendance::where('enrollment_id', $finalEnrollmentId)
            ->whereDate('attendance_date', $finalDate)
            ->where('id', '!=', $attendance->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'Ya existe otra asistencia para este estudiante en esa fecha.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $attendance->update($validated);

        return response()->json(
            $attendance->fresh()->load([
                'enrollment.student.user',
                'enrollment.course.teacher',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Eliminar una asistencia.
     *
     * SOLO DOCENTE.
     *
     * El docente únicamente puede eliminar asistencias
     * de sus propios cursos.
     */
    public function destroy(
        Request $request,
        Attendance $attendance
    ): JsonResponse {
        $user = $request->user();

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
            (int) $attendance->enrollment->course->teacher_id !== (int) $teacher->id
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

