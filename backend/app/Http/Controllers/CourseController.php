<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * Listar cursos.
     *
     * Admin:
     * - Puede ver todos los cursos.
     *
     * Docente:
     * - Solo puede ver los cursos que tiene asignados.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Course::with('teacher');

        if ($user->role === 'docente') {
            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            $query->where('teacher_id', $teacher->id);
        }

        $courses = $query
            ->orderBy('id')
            ->get();

        return response()->json(
            $courses,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Crear un curso.
     *
     * Esta operación debe estar protegida para admin
     * desde routes/api.php.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:courses,code',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'credits' => [
                'required',
                'integer',
                'min:1',
            ],

            'hours' => [
                'required',
                'integer',
                'min:1',
            ],

            'active' => [
                'sometimes',
                'boolean',
            ],

            'teacher_id' => [
                'nullable',
                'integer',
                'exists:teachers,id',
            ],
        ]);

        $course = Course::create($validated);

        return response()->json(
            $course->load('teacher'),
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Mostrar un curso.
     */
    public function show(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'docente') {
            $teacher = $user->teacher;

            if (!$teacher) {
                return response()->json([
                    'message' => 'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if ((int) $course->teacher_id !== (int) $teacher->id) {
                return response()->json([
                    'message' => 'No tienes permisos para consultar este curso.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }

        return response()->json(
            $course->load('teacher'),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Actualizar un curso.
     *
     * Esta operación está protegida para admin
     * desde routes/api.php.
     */
    public function update(
        Request $request,
        Course $course
    ): JsonResponse {
        $validated = $request->validate([
            'code' => [
                'sometimes',
                'string',
                'max:50',
                'unique:courses,code,' . $course->id,
            ],

            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'credits' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'hours' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'active' => [
                'sometimes',
                'boolean',
            ],

            'teacher_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:teachers,id',
            ],
        ]);

        $course->update($validated);

        $course->refresh();

        $course->load('teacher');

        return response()->json(
            $course,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Eliminar un curso.
     *
     * Esta operación está protegida para admin
     * desde routes/api.php.
     */
    public function destroy(Course $course): JsonResponse
    {
        $course->delete();

        return response()->json([
            'message' => 'Curso eliminado correctamente.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}