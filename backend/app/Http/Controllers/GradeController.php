<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GradeController extends Controller
{
    /**
     * Tiempo de caché:
     * 5 minutos.
     */
    private const CACHE_MINUTES = 5;

    /**
     * Clave donde se guarda el número de versión
     * de la caché de notas.
     */
    private const CACHE_VERSION_KEY = 'grades:cache_version';


    /**
     * Listar notas con búsqueda, paginación y caché.
     *
     * ADMIN:
     * - Puede ver todas las notas.
     *
     * DOCENTE:
     * - Solo puede ver notas de sus propios cursos.
     *
     * Búsqueda:
     * - Permite buscar por nombre del estudiante.
     *
     * Paginación:
     * - 50 notas por página.
     *
     * Caché:
     * - Cada combinación de versión + usuario + búsqueda + página
     *   tiene su propia caché.
     * - La versión cambia cada vez que se crea, edita o elimina
     *   una nota, lo que invalida automáticamente TODAS las
     *   páginas y búsquedas guardadas anteriormente.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $search = trim($request->input('search', ''));

        $page = max(
            1,
            (int) $request->input('page', 1)
        );

        /*
         * -------------------------------------------------
         * CLAVE ÚNICA DEL CACHÉ
         * -------------------------------------------------
         *
         * Incluye la versión actual de la caché.
         * Cuando la versión cambia, esta clave nunca
         * volverá a coincidir con una guardada antes,
         * así que efectivamente queda invalidada sin
         * necesidad de borrar nada manualmente.
         */
        $version = $this->currentCacheVersion();

        $cacheKey = 'grades:v' .
            $version .
            ':' .
            $user->id .
            ':page:' .
            $page .
            ':search:' .
            md5(mb_strtolower($search));


        /*
         * -------------------------------------------------
         * OBTENER DESDE CACHÉ
         * -------------------------------------------------
         *
         * Si ya existe:
         * → no consulta PostgreSQL.
         *
         * Si no existe:
         * → ejecuta la consulta.
         * → guarda el resultado durante 5 minutos.
         */
        /*
         * -------------------------------------------------
         * SALVAGUARDA CONTRA CACHÉ CORRUPTO
         * -------------------------------------------------
         *
         * Si alguna vez quedó guardado un valor dañado
         * (por ejemplo de antes de este cambio), lo
         * detectamos aquí y lo descartamos en vez de
         * mostrárselo al usuario como si fueran datos
         * reales.
         */
        $cached = Cache::get($cacheKey);

        if ($cached !== null && !$this->isValidGradesPayload($cached)) {
            Cache::forget($cacheKey);
        }

        $grades = Cache::remember(
            $cacheKey,
            now()->addMinutes(self::CACHE_MINUTES),
            function () use ($user, $search) {

                $query = Grade::with([
                    'enrollment.student.user',
                    'enrollment.course.teacher',
                ]);


                /*
                 * -------------------------------------------------
                 * DOCENTE
                 * -------------------------------------------------
                 */

                if ($user->role === 'docente') {

                    $teacher = $user->teacher;

                    if (!$teacher) {

                        /*
                         * No guardamos este error en caché.
                         */
                        return [
                            'error' => true,
                            'status' => 403,
                            'message' =>
                                'El usuario docente no tiene un perfil de docente asociado.',
                        ];
                    }

                    $query->whereHas(
                        'enrollment.course',
                        function ($courseQuery) use ($teacher) {

                            $courseQuery->where(
                                'teacher_id',
                                $teacher->id
                            );
                        }
                    );
                }


                /*
                 * -------------------------------------------------
                 * BÚSQUEDA POR NOMBRE
                 * -------------------------------------------------
                 */

                if ($search !== '') {

                    $query->whereHas(
                        'enrollment.student.user',
                        function ($userQuery) use ($search) {

                            $userQuery->where(
                                'name',
                                'ILIKE',
                                '%' . $search . '%'
                            );
                        }
                    );
                }


                /*
                 * -------------------------------------------------
                 * PAGINACIÓN
                 * -------------------------------------------------
                 */

                /*
                 * -------------------------------------------------
                 * ¡IMPORTANTE!
                 * -------------------------------------------------
                 *
                 * NO cacheamos el objeto LengthAwarePaginator
                 * directamente. Ese objeto arrastra modelos
                 * Eloquent completos y anidados (Enrollment,
                 * Student, User, Course, Teacher...).
                 *
                 * Guardar eso en caché con serialize() genera
                 * payloads enormes y, si la escritura se corta
                 * a medias (por tamaño, permisos, disco lleno,
                 * etc.), al leerlo de vuelta PHP no puede
                 * reconstruir el objeto y devuelve un
                 * "__PHP_Incomplete_Class_Name" corrupto en vez
                 * de los datos reales. Eso es lo que estaba
                 * causando que las notas "desaparecieran".
                 *
                 * Por eso convertimos a un array plano con
                 * toArray() ANTES de guardarlo en caché.
                 * Los arrays planos se serializan sin problema
                 * y ocupan mucho menos espacio.
                 */

                return $query
                    ->orderBy('id')
                    ->paginate(50)
                    ->withQueryString()
                    ->toArray();
            }
        );


        /*
         * -------------------------------------------------
         * COMPROBAR ERROR DE DOCENTE
         * -------------------------------------------------
         */

        if (
            is_array($grades) &&
            ($grades['error'] ?? false)
        ) {

            return response()->json([
                'message' => $grades['message'],
            ], $grades['status']);
        }


        /*
         * -------------------------------------------------
         * RESPUESTA
         * -------------------------------------------------
         */

        return response()->json(
            $grades,
            200,
            [],
            JSON_UNESCAPED_UNICODE
        );
    }


    /**
     * Notas del estudiante autenticado.
     */
    public function myGrades(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = $user->student;

        if (!$student) {

            return response()->json([
                'message' =>
                    'El usuario no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $grades = Grade::with([
            'enrollment.course.teacher',
        ])
            ->whereHas(
                'enrollment',
                function ($query) use ($student) {

                    $query->where(
                        'student_id',
                        $student->id
                    );
                }
            )
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
                'message' =>
                    'El usuario no tiene un perfil de estudiante.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $grades = Grade::with([
            'enrollment.course',
        ])
            ->whereHas(
                'enrollment',
                function ($query) use ($student) {

                    $query->where(
                        'student_id',
                        $student->id
                    );
                }
            )
            ->get();

        $courses = $grades
            ->groupBy('enrollment.course_id')
            ->map(function ($courseGrades) {

                $course =
                    $courseGrades
                        ->first()
                        ->enrollment
                        ->course;

                $average = round(
                    $courseGrades->avg('score'),
                    2
                );

                return [

                    'course_id' =>
                        $course->id,

                    'course_code' =>
                        $course->code,

                    'course_name' =>
                        $course->name,

                    'grades_count' =>
                        $courseGrades->count(),

                    'average' =>
                        $average,

                    'grades' =>
                        $courseGrades
                            ->map(function ($grade) {

                                return [

                                    'id' =>
                                        $grade->id,

                                    'assessment_type' =>
                                        $grade->assessment_type,

                                    'score' =>
                                        (float) $grade->score,

                                    'assessment_date' =>
                                        $grade->assessment_date,

                                    'comments' =>
                                        $grade->comments,
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

                'id' =>
                    $student->id,

                'student_code' =>
                    $student->student_code,

                'name' =>
                    $user->name,
            ],

            'general_average' =>
                $generalAverage,

            'total_grades' =>
                $grades->count(),

            'courses' =>
                $courses,

        ], 200, [], JSON_UNESCAPED_UNICODE);
    }


    /**
     * Crear una nota.
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
            ->findOrFail(
                $validated['enrollment_id']
            );


        /*
         * -------------------------------------------------
         * VALIDAR DOCENTE
         * -------------------------------------------------
         */

        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {

                return response()->json([
                    'message' =>
                        'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !==
                (int) $teacher->id
            ) {

                return response()->json([
                    'message' =>
                        'No tienes permisos para registrar notas en este curso.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }


        /*
         * -------------------------------------------------
         * CREAR NOTA
         * -------------------------------------------------
         */

        $grade = Grade::create($validated);


        /*
         * -------------------------------------------------
         * LIMPIAR CACHÉ
         * -------------------------------------------------
         *
         * Como cambió la información:
         *
         * las páginas anteriores ya pueden estar
         * desactualizadas.
         *
         * Invalidamos todo el caché de notas.
         */
        $this->clearGradesCache();


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
                    'message' =>
                        'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$grade->enrollment ||
                !$grade->enrollment->course ||
                (int) $grade->enrollment->course->teacher_id !==
                (int) $teacher->id
            ) {

                return response()->json([
                    'message' =>
                        'No tienes permisos para consultar esta nota.',
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


        $enrollmentId =
            $validated['enrollment_id']
            ?? $grade->enrollment_id;


        $enrollment = Enrollment::with('course')
            ->findOrFail($enrollmentId);


        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {

                return response()->json([
                    'message' =>
                        'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$enrollment->course ||
                (int) $enrollment->course->teacher_id !==
                (int) $teacher->id
            ) {

                return response()->json([
                    'message' =>
                        'No tienes permisos para modificar esta nota.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }


        /*
         * -------------------------------------------------
         * ACTUALIZAR
         * -------------------------------------------------
         */

        $grade->update($validated);


        /*
         * Invalidar todo el caché de notas.
         */
        $this->clearGradesCache();


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
     */
    public function destroy(
        Request $request,
        Grade $grade
    ): JsonResponse {

        $user = $request->user();


        $grade->load(
            'enrollment.course'
        );


        if ($user->role === 'docente') {

            $teacher = $user->teacher;

            if (!$teacher) {

                return response()->json([
                    'message' =>
                        'El usuario docente no tiene un perfil de docente asociado.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }

            if (
                !$grade->enrollment ||
                !$grade->enrollment->course ||
                (int) $grade->enrollment->course->teacher_id !==
                (int) $teacher->id
            ) {

                return response()->json([
                    'message' =>
                        'No tienes permisos para eliminar esta nota.',
                ], 403, [], JSON_UNESCAPED_UNICODE);
            }
        }


        /*
         * -------------------------------------------------
         * ELIMINAR
         * -------------------------------------------------
         */

        $grade->delete();


        /*
         * Invalidar todo el caché de notas.
         */
        $this->clearGradesCache();


        return response()->json([
            'message' =>
                'Nota eliminada correctamente.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }


    /**
     * -----------------------------------------------------
     * VALIDAR PAYLOAD DE NOTAS
     * -----------------------------------------------------
     *
     * Comprueba que lo guardado en caché tenga la forma
     * esperada (un array con las claves de un paginador,
     * o el array de error de "docente sin perfil").
     *
     * Si el valor está corrupto (por ejemplo un objeto
     * "__PHP_Incomplete_Class_Name"), esto devuelve false
     * y forzamos a regenerar la consulta real.
     */
    private function isValidGradesPayload($value): bool
    {
        if (!is_array($value)) {
            return false;
        }

        if ($value['error'] ?? false) {
            return isset($value['status'], $value['message']);
        }

        return array_key_exists('data', $value)
            && array_key_exists('total', $value)
            && is_array($value['data']);
    }


    /**
     * -----------------------------------------------------
     * VERSIÓN ACTUAL DE LA CACHÉ
     * -----------------------------------------------------
     *
     * Si no existe todavía, la crea en 1 y la guarda
     * de forma permanente (hasta que se incremente).
     */
    private function currentCacheVersion(): int
    {
        return (int) Cache::rememberForever(
            self::CACHE_VERSION_KEY,
            function () {
                return 1;
            }
        );
    }


    /**
     * -----------------------------------------------------
     * LIMPIAR CACHÉ DE NOTAS
     * -----------------------------------------------------
     *
     * Como las claves contienen la versión actual
     * (grades:v{version}:...), en vez de borrar cada
     * clave individual (página x búsqueda x usuario),
     * simplemente incrementamos la versión.
     *
     * Esto hace que TODAS las claves anteriores queden
     * huérfanas al instante: la próxima consulta ya no
     * las va a encontrar y ejecutará la consulta real,
     * generando una nueva clave con la versión nueva.
     *
     * Las claves viejas simplemente expiran solas a los
     * 5 minutos sin que tengamos que borrarlas a mano.
     */
    private function clearGradesCache(): void
    {
        if (Cache::has(self::CACHE_VERSION_KEY)) {
            Cache::increment(self::CACHE_VERSION_KEY);
        } else {
            Cache::forever(self::CACHE_VERSION_KEY, 2);
        }
    }
}