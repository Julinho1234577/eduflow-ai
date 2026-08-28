<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    /**
     * Listar estudiantes con búsqueda y paginación.
     */
    /**
     * Listar estudiantes con búsqueda y paginación.
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim($request->input('search', ''));

        $students = Student::with('user')
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'ILIKE', '%' . $search . '%');
                });
            })
            ->orderBy('id', 'asc')
            ->paginate(20);

        return response()->json(
            $students,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }
    /**
     * Crear un estudiante.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->json()->all();

        if (!is_array($data)) {
            return response()->json([
                'message' => 'El cuerpo de la petición no contiene un JSON válido.'
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $validator = Validator::make($data, [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                'unique:students,user_id',
            ],

            'student_code' => [
                'required',
                'string',
                'max:255',
                'unique:students,student_code',
            ],

            'document_number' => [
                'required',
                'string',
                'max:255',
                'unique:students,document_number',
            ],

            'birth_date' => [
                'nullable',
                'date',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'career' => [
                'nullable',
                'string',
                'max:255',
            ],

            'admission_year' => [
                'nullable',
                'integer',
                'min:2000',
                'max:2100',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Los datos enviados no son válidos.',
                'errors' => $validator->errors(),
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $student = Student::create(
            $validator->validated()
        );

        $student->load('user');

        return response()->json(
            $student,
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Mostrar un estudiante específico.
     */
    public function show(Student $student): JsonResponse
    {
        $student->load('user');

        return response()->json(
            $student,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Actualizar un estudiante.
     */
    public function update(
        Request $request,
        Student $student
    ): JsonResponse {
        $data = $request->json()->all();

        if (!is_array($data)) {
            return response()->json([
                'message' => 'El cuerpo de la petición no contiene un JSON válido.'
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $validator = Validator::make($data, [
            'student_code' => [
                'sometimes',
                'string',
                'max:255',
                'unique:students,student_code,' . $student->id,
            ],

            'document_number' => [
                'sometimes',
                'string',
                'max:255',
                'unique:students,document_number,' . $student->id,
            ],

            'birth_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'career' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'admission_year' => [
                'sometimes',
                'nullable',
                'integer',
                'min:2000',
                'max:2100',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Los datos enviados no son válidos.',
                'errors' => $validator->errors(),
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $student->update(
            $validator->validated()
        );

        $student->refresh();
        $student->load('user');

        return response()->json(
            $student,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Eliminar un estudiante.
     */
    public function destroy(Student $student): JsonResponse
    {
        $student->delete();

        return response()->json([
            'message' => 'Estudiante eliminado correctamente.'
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
