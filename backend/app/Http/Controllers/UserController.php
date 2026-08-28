<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Usuarios con rol estudiante
     * que todavía no tienen registro en students.
     */
    public function availableStudents(): JsonResponse
    {
        $users = User::where('role', 'estudiante')
            ->whereDoesntHave('student')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
                'role',
            ]);

        return response()->json(
            $users,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Usuarios con rol docente
     * que todavía no tienen registro en teachers.
     */
    public function availableTeachers(): JsonResponse
    {
        $users = User::where('role', 'docente')
            ->whereDoesntHave('teacher')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
                'role',
            ]);

        return response()->json(
            $users,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }
}