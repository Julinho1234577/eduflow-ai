<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Estadísticas generales del panel de administrador.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'students' => Student::count(),
            'teachers' => Teacher::count(),
            'courses' => Course::count(),
            'enrollments' => Enrollment::count(),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}