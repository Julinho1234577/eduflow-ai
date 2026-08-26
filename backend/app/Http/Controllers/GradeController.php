<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Listar notas.
     *
     * ADMIN:
     * - Puede ver todas las notas.
     *
     * DOCENTE:
     * - Solo puede ver notas de sus propios cursos.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Grade::with([
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

        $grades = $query
            ->orderBy('id')
            ->get();

        return response()->json(
            $grades,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Notas del estudiante autenticado.
     *
     * ACCESO:
     * - Estudiante.
     */
    public function myGrades(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'El usuario no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $grades = Grade::with([
            'enrollment.course.teacher',
        ])
            ->whereHas('enrollment', function ($query) use ($student) {
                $query->where('student_id', $student->id);
            })
            ->orderBy('id')
            ->get();

        return response()->json(
            $grades,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Resumen de notas del estudiante autenticado.
     */
    public function myGradesSummary(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'El usuario no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $grades = Grade::with([
            'enrollment.course',
        ])
            ->whereHas('enrollment', function ($query) use ($student) {
                $query->where('student_id', $student->id);
            })
            ->get();

        $courses = $grades
            ->groupBy('enrollment.course_id')
            ->map(function ($courseGrades) {

                $course = $courseGrades->first()->enrollment->course;

                $average = round(
                    $courseGrades->avg('score'),
                    2
                );

                return [
                    'course_id' => $course->id,
                    'course_code' => $course->code,
                    'course_name' => $course->name,
                    'grades_count' => $courseGrades->count(),

                    'average' => $average,

                    'grades' => $courseGrades
                        ->map(function ($grade) {
                            return [
                                'id' => $grade->id,
                                'assessment_type' => $grade->assessment_type,
                                'score' => (float) $grade->score,
                                'assessment_date' => $grade->assessment_date,
                                'comments' => $grade->comments,
                            ];
                        })
                        ->values(),
                ];
            })
            ->values();

        $generalAverage = round(
            $grades->avg('score') ?? 0,
            2
        );

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_code' => $student->student_code,
                'name' => $user->name,
            ],

            'general_average' => $generalAverage,

            'total_grades' => $grades->count(),

            'courses' => $courses,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }


    /**
     * Crear una nota.
     *
     * ADMIN:
     * - Puede crear cualquier nota.
     *
     * DOCENTE:
     * - Solo puede crear notas de sus propios cursos.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enrollment_id' => [
                'required',
                'integer',
                'exists:enrollments,id',
            ],

            'assessment_type' => [
                'required',
                'string',
                'max:255',
            ],

            'score' => [
                'required',
                'numeric',
                'min:0',
                'max:20',
            ],

            'assessment_date' => [
                'required',
                'date',
            ],

            'comments' => [
                'nullable',
                'string',
            ],
        ]);

        $user = $request->user();

        $enrollment = Enrollment::with('course')
            ->findOrFail($validated['enrollment_id']);

        /*
         * DOCENTE:
         *
         * Verificar que el curso de la matrícula
         * pertenezca al docente autenticado.
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para registrar notas en este curso.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $grade = Grade::create($validated);

        return response()->json(
            $grade->load([
                'enrollment.student.user',
                'enrollment.course.teacher',
            ]),
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Mostrar una nota.
     *
     * ADMIN:
     * - Puede consultar cualquier nota.
     *
     * DOCENTE:
     * - Solo puede consultar notas de sus cursos.
     */
    public function show(
        Request $request,
        Grade $grade
    ): JsonResponse {
        $user = $request->user();

        $grade->load([
            'enrollment.course',
        ]);

        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$grade->enrollment ||
                !$grade->enrollment->course ||
                (int) $grade->enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar esta nota.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        return response()->json(
            $grade->load([
                'enrollment.student.user',
                'enrollment.course.teacher',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Actualizar una nota.
     *
     * ADMIN:
     * - Puede modificar cualquier nota.
     *
     * DOCENTE:
     * - Solo puede modificar notas de sus cursos.
     */
    public function update(
        Request $request,
        Grade $grade
    ): JsonResponse {
        $validated = $request->validate([
            'enrollment_id' => [
                'sometimes',
                'integer',
                'exists:enrollments,id',
            ],

            'assessment_type' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'score' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:20',
            ],

            'assessment_date' => [
                'sometimes',
                'date',
            ],

            'comments' => [
                'sometimes',
                'nullable',
                'string',
            ],
        ]);

        $user = $request->user();

        /*
         * Si se intenta cambiar enrollment_id,
         * verificar la nueva matrícula.
         *
         * Si no se cambia, utilizar la matrícula actual.
         */
        $enrollmentId = $validated['enrollment_id']
            ?? $grade->enrollment_id;

        $enrollment = Enrollment::with('course')
            ->findOrFail($enrollmentId);

        /*
         * DOCENTE:
         *
         * Solo puede modificar notas de sus cursos.
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para modificar esta nota.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $grade->update($validated);

        return response()->json(
            $grade->fresh()->load([
                'enrollment.student.user',
                'enrollment.course.teacher',
            ]),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Eliminar una nota.
     *
     * ADMIN:
     * - Puede eliminar cualquier nota.
     *
     * DOCENTE:
     * - Solo puede eliminar notas de sus cursos.
     */
    public function destroy(
        Request $request,
        Grade $grade
    ): JsonResponse {
        $user = $request->user();

        $grade->load('enrollment.course');

        /*
         * DOCENTE:
         *
         * Verificar que la nota pertenezca
         * a uno de sus cursos.
         */
        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$grade->enrollment ||
                !$grade->enrollment->course ||
                (int) $grade->enrollment->course->teacher_id !== (int) $teacher->id
            ) {
                return response()->json([
                    'message' => 'No tienes permisos para eliminar esta nota.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $grade->delete();

        return response()->json([
            'message' => 'Nota eliminada correctamente.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
