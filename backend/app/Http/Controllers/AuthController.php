<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        return response()->json([
            'content_type' => $request->header('Content-Type'),
            'all' => $request->all(),
            'raw' => $request->getContent(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}