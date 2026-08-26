<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Listar usuarios con rol estudiante
     * que todavía no tienen un registro en students.
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
}