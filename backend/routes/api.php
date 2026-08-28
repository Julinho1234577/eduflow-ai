<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| EduFlow AI
|
| Roles:
| - admin
| - docente
| - estudiante
|
*/


// ============================================================================
// AUTENTICACIÓN
// ============================================================================

Route::post('/login', [AuthController::class, 'login']);


// ============================================================================
// RUTAS PROTEGIDAS
// ============================================================================

Route::middleware('auth:sanctum')->group(function () {

    // =========================================================================
    // USUARIO AUTENTICADO
    // =========================================================================

    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/logout', [AuthController::class, 'logout']);


    // =========================================================================
    // DASHBOARD
    // =========================================================================
    //
    // Solo usuarios autenticados con rol admin o docente.
    //

    Route::middleware('role:admin,docente')->group(function () {

        Route::get(
            '/dashboard/stats',
            [DashboardController::class, 'stats']
        );
    });


    // =========================================================================
    // USUARIOS DISPONIBLES PARA CREAR DOCENTES
    // =========================================================================

    Route::middleware('role:admin')->group(function () {

        Route::get(
            '/users/teachers/available',
            [UserController::class, 'availableTeachers']
        );
    });


    // =========================================================================
    // USUARIOS DISPONIBLES PARA CREAR ESTUDIANTES
    // =========================================================================

    Route::middleware('role:admin')->group(function () {

        Route::get(
            '/users/students/available',
            [UserController::class, 'availableStudents']
        );
    });


    // =========================================================================
    // ESTUDIANTE AUTENTICADO
    // =========================================================================

    Route::middleware('role:estudiante')->group(function () {

        // ---------------------------------------------------------------------
        // Matrículas propias
        // ---------------------------------------------------------------------

        Route::get(
            '/my/enrollments',
            [EnrollmentController::class, 'myEnrollments']
        );


        // ---------------------------------------------------------------------
        // Notas propias
        // ---------------------------------------------------------------------

        Route::get(
            '/my/grades',
            [GradeController::class, 'myGrades']
        );


        // ---------------------------------------------------------------------
        // Resumen de notas propio
        // ---------------------------------------------------------------------

        Route::get(
            '/my/grades/summary',
            [GradeController::class, 'myGradesSummary']
        );


        // ---------------------------------------------------------------------
        // Asistencias propias
        // ---------------------------------------------------------------------

        Route::get(
            '/my/attendances',
            [AttendanceController::class, 'myAttendances']
        );
    });


    // =========================================================================
    // ESTUDIANTES
    // =========================================================================

    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Solo consulta
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::get(
            '/students',
            [StudentController::class, 'index']
        );

        Route::get(
            '/students/{student}',
            [StudentController::class, 'show']
        );
    });


    // -------------------------------------------------------------------------
    // ADMIN
    // CRUD completo
    // -------------------------------------------------------------------------

    Route::middleware('role:admin')->group(function () {

        Route::post(
            '/students',
            [StudentController::class, 'store']
        );

        Route::put(
            '/students/{student}',
            [StudentController::class, 'update']
        );

        Route::patch(
            '/students/{student}',
            [StudentController::class, 'update']
        );

        Route::delete(
            '/students/{student}',
            [StudentController::class, 'destroy']
        );
    });


    // =========================================================================
    // DOCENTES
    // =========================================================================

    // -------------------------------------------------------------------------
    // SOLO ADMIN
    // CRUD completo
    // -------------------------------------------------------------------------

    Route::middleware('role:admin')->group(function () {

        Route::get(
            '/teachers',
            [TeacherController::class, 'index']
        );

        Route::get(
            '/teachers/{teacher}',
            [TeacherController::class, 'show']
        );

        Route::post(
            '/teachers',
            [TeacherController::class, 'store']
        );

        Route::put(
            '/teachers/{teacher}',
            [TeacherController::class, 'update']
        );

        Route::patch(
            '/teachers/{teacher}',
            [TeacherController::class, 'update']
        );

        Route::delete(
            '/teachers/{teacher}',
            [TeacherController::class, 'destroy']
        );
    });


    // =========================================================================
    // CURSOS
    // =========================================================================

    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Consulta
    //
    // Admin:
    //   Puede consultar todos los cursos.
    //
    // Docente:
    //   Puede consultar solamente sus propios cursos.
    //
    // CourseController realiza la validación correspondiente.
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::get(
            '/courses',
            [CourseController::class, 'index']
        );

        Route::get(
            '/courses/{course}',
            [CourseController::class, 'show']
        );
    });


    // -------------------------------------------------------------------------
    // ADMIN
    // CRUD completo
    // -------------------------------------------------------------------------

    Route::middleware('role:admin')->group(function () {

        Route::post(
            '/courses',
            [CourseController::class, 'store']
        );

        Route::put(
            '/courses/{course}',
            [CourseController::class, 'update']
        );

        Route::patch(
            '/courses/{course}',
            [CourseController::class, 'update']
        );

        Route::delete(
            '/courses/{course}',
            [CourseController::class, 'destroy']
        );
    });


    // =========================================================================
    // MATRÍCULAS
    // =========================================================================

    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Solo consulta
    //
    // Admin:
    //   Puede consultar todas las matrículas.
    //
    // Docente:
    //   Puede consultar solamente las matrículas relacionadas
    //   con sus propios cursos.
    //
    // EnrollmentController realiza la validación.
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::get(
            '/enrollments',
            [EnrollmentController::class, 'index']
        );

        Route::get(
            '/enrollments/{enrollment}',
            [EnrollmentController::class, 'show']
        );
    });


    // -------------------------------------------------------------------------
    // ADMIN
    // CRUD completo
    // -------------------------------------------------------------------------

    Route::middleware('role:admin')->group(function () {

        Route::post(
            '/enrollments',
            [EnrollmentController::class, 'store']
        );

        Route::put(
            '/enrollments/{enrollment}',
            [EnrollmentController::class, 'update']
        );

        Route::patch(
            '/enrollments/{enrollment}',
            [EnrollmentController::class, 'update']
        );

        Route::delete(
            '/enrollments/{enrollment}',
            [EnrollmentController::class, 'destroy']
        );
    });


    // =========================================================================
    // NOTAS
    // =========================================================================

    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Consulta
    //
    // Admin:
    //   Puede consultar todas las notas.
    //
    // Docente:
    //   Puede consultar solamente las notas de sus propios cursos.
    //
    // GradeController realiza la validación.
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::get(
            '/grades',
            [GradeController::class, 'index']
        );

        Route::get(
            '/grades/{grade}',
            [GradeController::class, 'show']
        );
    });


    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Gestión
    //
    // Admin:
    //   Puede crear, modificar y eliminar cualquier nota.
    //
    // Docente:
    //   Puede crear, modificar y eliminar notas solamente
    //   de sus propios cursos.
    //
    // GradeController realiza la validación.
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::post(
            '/grades',
            [GradeController::class, 'store']
        );

        Route::put(
            '/grades/{grade}',
            [GradeController::class, 'update']
        );

        Route::patch(
            '/grades/{grade}',
            [GradeController::class, 'update']
        );

        Route::delete(
            '/grades/{grade}',
            [GradeController::class, 'destroy']
        );
    });


    // =========================================================================
    // ASISTENCIAS
    // =========================================================================

    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Consulta
    //
    // Admin:
    //   Puede consultar todas las asistencias.
    //
    // Docente:
    //   Puede consultar solamente las asistencias de sus propios cursos.
    //
    // AttendanceController realiza la validación.
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::get(
            '/attendances',
            [AttendanceController::class, 'index']
        );

        Route::get(
            '/attendances/{attendance}',
            [AttendanceController::class, 'show']
        );
    });


    // -------------------------------------------------------------------------
    // ADMIN + DOCENTE
    // Gestión
    //
    // Admin:
    //   Puede crear, modificar y eliminar cualquier asistencia.
    //
    // Docente:
    //   Puede crear, modificar y eliminar asistencias solamente
    //   de sus propios cursos.
    //
    // AttendanceController realiza la validación.
    // -------------------------------------------------------------------------

    Route::middleware('role:admin,docente')->group(function () {

        Route::post(
            '/attendances',
            [AttendanceController::class, 'store']
        );

        Route::put(
            '/attendances/{attendance}',
            [AttendanceController::class, 'update']
        );

        Route::patch(
            '/attendances/{attendance}',
            [AttendanceController::class, 'update']
        );

        Route::delete(
            '/attendances/{attendance}',
            [AttendanceController::class, 'destroy']
        );
    });

});

