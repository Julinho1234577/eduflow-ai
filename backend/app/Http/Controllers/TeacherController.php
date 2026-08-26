<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherController extends Controller
{
    /**
     * Listar todos los docentes.
     */
    public function index(): JsonResponse
    {
        $teachers = Teacher::with('user')->get();

        return response()->json(
            $teachers,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Crear un docente.
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
                'unique:teachers,user_id',
            ],

            'teacher_code' => [
                'required',
                'string',
                'max:255',
                'unique:teachers,teacher_code',
            ],

            'document_number' => [
                'required',
                'string',
                'max:255',
                'unique:teachers,document_number',
            ],

            'specialty' => [
                'nullable',
                'string',
                'max:255',
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Los datos enviados no son válidos.',
                'errors' => $validator->errors(),
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $teacher = Teacher::create(
            $validator->validated()
        );

        return response()->json(
            $teacher->load('user'),
            201,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Mostrar un docente específico.
     */
    public function show(Teacher $teacher): JsonResponse
    {
        return response()->json(
            $teacher->load('user'),
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Actualizar un docente.
     */
    public function update(
        Request $request,
        Teacher $teacher
    ): JsonResponse {
        /*
         * Para PUT/PATCH leemos directamente
         * el JSON recibido.
         */
        $data = $request->json()->all();

        if (!is_array($data)) {
            return response()->json([
                'message' => 'El cuerpo de la petición no contiene un JSON válido.'
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $validator = Validator::make($data, [
            'teacher_code' => [
                'sometimes',
                'string',
                'max:255',
                'unique:teachers,teacher_code,' . $teacher->id,
            ],

            'document_number' => [
                'sometimes',
                'string',
                'max:255',
                'unique:teachers,document_number,' . $teacher->id,
            ],

            'specialty' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Los datos enviados no son válidos.',
                'errors' => $validator->errors(),
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        /*
         * Actualizar solamente los campos enviados.
         */
        $teacher->update(
            $validator->validated()
        );

        /*
         * Volver a consultar el registro desde la base de datos.
         */
        $teacher->refresh();

        /*
         * Cargar nuevamente el usuario relacionado.
         */
        $teacher->load('user');

        return response()->json(
            $teacher,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Eliminar un docente.
     */
    public function destroy(Teacher $teacher): JsonResponse
    {
        $teacher->delete();

        return response()->json([
            'message' => 'Docente eliminado correctamente.'
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}

