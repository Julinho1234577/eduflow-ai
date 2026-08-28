<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class TeacherController extends Controller
{
    /**
     * Listar todos los docentes.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');

        $teachers = Teacher::with('user')
            ->when($search, function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'ILIKE', '%' . $search . '%');
                });
            })
            ->orderBy('id', 'desc')
            ->paginate(20);

        return response()->json($teachers);
    }

    /**
     * Crear un docente y su usuario.
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

            // DATOS DEL USUARIO
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:6',
            ],

            // DATOS DEL DOCENTE
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

        $validated = $validator->validated();

        try {

            $teacher = DB::transaction(function () use ($validated) {

                /*
                 * Crear usuario
                 */
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'docente',
                ]);

                /*
                 * Crear docente
                 */
                return Teacher::create([
                    'user_id' => $user->id,
                    'teacher_code' => $validated['teacher_code'],
                    'document_number' => $validated['document_number'],
                    'specialty' => $validated['specialty'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]);
            });

            return response()->json(
                $teacher->load('user'),
                201,
                [],
                JSON_UNESCAPED_UNICODE
            );
        } catch (\Throwable $e) {

            return response()->json([
                'message' => 'No se pudo crear el docente.',
                'error' => $e->getMessage(),
            ], 500, [], JSON_UNESCAPED_UNICODE);
        }
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

        $data = $request->json()->all();

        if (!is_array($data)) {
            return response()->json([
                'message' => 'El cuerpo de la petición no contiene un JSON válido.'
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $validator = Validator::make($data, [

            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'email',
                'max:255',
                'unique:users,email,' . $teacher->user_id,
            ],

            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:6',
            ],

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

        $validated = $validator->validated();

        try {

            DB::transaction(function () use ($teacher, $validated) {

                /*
                 * Actualizar datos del docente
                 */
                $teacherData = collect($validated)
                    ->only([
                        'teacher_code',
                        'document_number',
                        'specialty',
                        'phone',
                        'address',
                    ])
                    ->toArray();

                if (!empty($teacherData)) {
                    $teacher->update($teacherData);
                }

                /*
                 * Actualizar datos del usuario
                 */
                $userData = [];

                if (isset($validated['name'])) {
                    $userData['name'] = $validated['name'];
                }

                if (isset($validated['email'])) {
                    $userData['email'] = $validated['email'];
                }

                if (!empty($validated['password'])) {
                    $userData['password'] = Hash::make(
                        $validated['password']
                    );
                }

                if (!empty($userData)) {
                    $teacher->user->update($userData);
                }
            });

            $teacher->refresh();
            $teacher->load('user');

            return response()->json(
                $teacher,
                200,
                [],
                JSON_UNESCAPED_UNICODE
            );
        } catch (\Throwable $e) {

            return response()->json([
                'message' => 'No se pudo actualizar el docente.',
                'error' => $e->getMessage(),
            ], 500, [], JSON_UNESCAPED_UNICODE);
        }
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
