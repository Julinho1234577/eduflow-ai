<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ADMINISTRADOR
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            [
                'email' => 'admin@eduflow.test',
            ],
            [
                'name' => 'Administrador',
                'password' => Hash::make('Admin12345'),
                'role' => 'admin',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOCENTES
        |--------------------------------------------------------------------------
        */

        $teachersData = [
            [
                'name' => 'Carlos Torres',
                'email' => 'carlos.torres@eduflow.test',
                'teacher_code' => 'DOC-0001',
                'document_number' => '70123456',
                'specialty' => 'Programación',
                'phone' => '987654321',
                'address' => 'Lima, Perú',
            ],
            [
                'name' => 'María González',
                'email' => 'maria.gonzalez@eduflow.test',
                'teacher_code' => 'DOC-0002',
                'document_number' => '70234567',
                'specialty' => 'Matemática',
                'phone' => '986543210',
                'address' => 'San Miguel, Lima',
            ],
            [
                'name' => 'Ana López',
                'email' => 'ana.lopez@eduflow.test',
                'teacher_code' => 'DOC-0003',
                'document_number' => '70345678',
                'specialty' => 'Administración',
                'phone' => '985432109',
                'address' => 'Surco, Lima',
            ],
            [
                'name' => 'Pedro Ramírez',
                'email' => 'pedro.ramirez@eduflow.test',
                'teacher_code' => 'DOC-0004',
                'document_number' => '70456789',
                'specialty' => 'Contabilidad',
                'phone' => '984321098',
                'address' => 'Los Olivos, Lima',
            ],
            [
                'name' => 'Lucía Fernández',
                'email' => 'lucia.fernandez@eduflow.test',
                'teacher_code' => 'DOC-0005',
                'document_number' => '70567890',
                'specialty' => 'Base de Datos',
                'phone' => '983210987',
                'address' => 'Ate, Lima',
            ],
        ];

        $teachers = [];

        foreach ($teachersData as $data) {
            $user = User::updateOrCreate(
                [
                    'email' => $data['email'],
                ],
                [
                    'name' => $data['name'],
                    'role' => 'docente',
                    'password' => Hash::make('Docente123'),
                ]
            );

            $teacher = Teacher::updateOrCreate(
                [
                    'teacher_code' => $data['teacher_code'],
                ],
                [
                    'user_id' => $user->id,
                    'document_number' => $data['document_number'],
                    'specialty' => $data['specialty'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                ]
            );

            $teachers[] = $teacher;
        }

        /*
        |--------------------------------------------------------------------------
        | ESTUDIANTES
        |--------------------------------------------------------------------------
        */

        $studentsData = [
            ['Juan', 'Pérez', 'Mendoza'],
            ['Lucía', 'Ramírez', 'Torres'],
            ['Diego', 'Flores', 'Castillo'],
            ['Sofía', 'Quispe', 'Huamán'],
            ['Andrés', 'Chávez', 'Rojas'],
            ['Valeria', 'Vargas', 'Salazar'],
            ['Miguel', 'Herrera', 'Cruz'],
            ['Camila', 'Morales', 'Paredes'],
            ['Sebastián', 'García', 'Soto'],
            ['Daniela', 'Torres', 'Mendoza'],
            ['Mateo', 'Fernández', 'Luna'],
            ['Alejandra', 'Castro', 'Ponce'],
            ['Gabriel', 'Navarro', 'Díaz'],
            ['Renata', 'Vega', 'Campos'],
            ['Nicolás', 'Medina', 'Flores'],
            ['Andrea', 'Ramos', 'Silva'],
            ['Luis', 'Mendoza', 'Quispe'],
            ['Paula', 'Espinoza', 'Rojas'],
            ['Joaquín', 'Salazar', 'Vargas'],
            ['Mariana', 'Paredes', 'Huerta'],
            ['Álvaro', 'Cabrera', 'Torres'],
            ['Fernanda', 'Fuentes', 'Chávez'],
            ['Rodrigo', 'Peña', 'Gómez'],
            ['Isabella', 'Ríos', 'Mamani'],
            ['Bruno', 'Sánchez', 'Reyes'],
            ['Martina', 'Ortega', 'Flores'],
            ['Emiliano', 'Vásquez', 'Ramírez'],
            ['Nicole', 'Aguilar', 'Pinto'],
            ['Thiago', 'Valdez', 'Morales'],
            ['Nicole', 'Aguilar', 'Pinto'],
        ];

        $careers = [
            'Administración',
            'Contabilidad',
            'Sistemas',
            'Marketing',
            'Negocios Internacionales',
        ];

        $students = [];

        foreach ($studentsData as $index => $studentData) {
            [$firstName, $lastName, $secondLastName] = $studentData;

            $number = str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);

            $email = 'estudiante' . $number . '@eduflow.test';

            $user = User::updateOrCreate(
                [
                    'email' => $email,
                ],
                [
                    'name' => "{$firstName} {$lastName} {$secondLastName}",
                    'role' => 'estudiante',
                    'password' => Hash::make('Estudiante123'),
                ]
            );

            $student = Student::updateOrCreate(
                [
                    'student_code' => "EST-{$number}",
                ],
                [
                    'user_id' => $user->id,
                    'document_number' => (string) (72000000 + $index + 1),
                    'birth_date' => Carbon::create(
                        2004 + ($index % 4),
                        1 + ($index % 12),
                        5 + ($index % 20)
                    )->format('Y-m-d'),
                    'phone' => '9' . str_pad(
                        (string) (80000000 + $index + 1),
                        8,
                        '0',
                        STR_PAD_LEFT
                    ),
                    'address' => [
                        'Lima, Perú',
                        'Callao, Perú',
                        'San Martín de Porres, Lima',
                        'Villa El Salvador, Lima',
                        'Comas, Lima',
                    ][$index % 5],
                    'career' => $careers[$index % count($careers)],
                    'admission_year' => 2024 + ($index % 3),
                ]
            );

            $students[] = $student;
        }

        /*
        |--------------------------------------------------------------------------
        | CURSOS
        |--------------------------------------------------------------------------
        */

        $coursesData = [
            ['MAT101', 'Matemática I', 'Fundamentos de matemática.', 4, 6],
            ['PRO101', 'Programación I', 'Fundamentos de programación.', 4, 6],
            ['BDD101', 'Base de Datos', 'Diseño y gestión de bases de datos.', 4, 6],
            ['ADM101', 'Fundamentos de Administración', 'Principios de administración.', 3, 4],
            ['CON101', 'Contabilidad General', 'Conceptos básicos de contabilidad.', 3, 4],
            ['MKT101', 'Marketing', 'Fundamentos de marketing.', 3, 4],
            ['EST101', 'Estadística', 'Estadística aplicada a la gestión.', 3, 4],
            ['ING101', 'Inglés I', 'Competencias básicas de inglés.', 2, 3],
            ['ECO101', 'Economía', 'Conceptos económicos aplicados.', 3, 4],
            ['GES101', 'Gestión Empresarial', 'Herramientas de gestión empresarial.', 3, 4],
        ];

        $courses = [];

        foreach ($coursesData as $index => $data) {
            $teacher = $teachers[$index % count($teachers)];

            $course = Course::updateOrCreate(
                [
                    'code' => $data[0],
                ],
                [
                    'name' => $data[1],
                    'description' => $data[2],
                    'credits' => $data[3],
                    'hours' => $data[4],
                    'active' => true,
                    'teacher_id' => $teacher->id,
                ]
            );

            $courses[] = $course;
        }

        /*
        |--------------------------------------------------------------------------
        | MATRÍCULAS
        |--------------------------------------------------------------------------
        */

        $academicPeriod = '2026-I';

        $enrollments = [];

        foreach ($students as $studentIndex => $student) {
            for ($courseOffset = 0; $courseOffset < 4; $courseOffset++) {

                $courseIndex = ($studentIndex + $courseOffset) % count($courses);
                $course = $courses[$courseIndex];

                $enrollment = Enrollment::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'academic_period' => $academicPeriod,
                    ],
                    [
                        'enrollment_date' => Carbon::create(2026, 3, 15)
                            ->addDays($studentIndex % 10)
                            ->format('Y-m-d'),
                        'status' => 'active',
                    ]
                );

                $enrollments[] = $enrollment;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | NOTAS
        |--------------------------------------------------------------------------
        */

        foreach ($enrollments as $index => $enrollment) {

            $evaluations = [
                [
                    'type' => 'Práctica calificada',
                    'score' => 11.50 + (($index * 3) % 8),
                    'date' => '2026-04-10',
                ],
                [
                    'type' => 'Examen parcial',
                    'score' => 12.00 + (($index * 5) % 8),
                    'date' => '2026-05-20',
                ],
            ];

            foreach ($evaluations as $evaluation) {

                Grade::updateOrCreate(
                    [
                        'enrollment_id' => $enrollment->id,
                        'assessment_type' => $evaluation['type'],
                        'assessment_date' => $evaluation['date'],
                    ],
                    [
                        'score' => min(20, round($evaluation['score'], 2)),
                        'comments' => $evaluation['type'] === 'Examen parcial'
                            ? 'Evaluación parcial del curso.'
                            : 'Evaluación práctica del curso.',
                    ]
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | ASISTENCIAS
        |--------------------------------------------------------------------------
        */

        foreach ($enrollments as $index => $enrollment) {

            for ($day = 0; $day < 5; $day++) {

                $date = Carbon::create(2026, 4, 6)
                    ->addWeeks($day)
                    ->format('Y-m-d');

                $status = match (($index + $day) % 10) {
                    0 => 'absent',
                    1 => 'late',
                    default => 'present',
                };

                Attendance::updateOrCreate(
                    [
                        'enrollment_id' => $enrollment->id,
                        'attendance_date' => $date,
                    ],
                    [
                        'status' => $status,
                        'justification' => $status === 'absent'
                            ? 'Inasistencia registrada para demostración.'
                            : null,
                    ]
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | MENSAJE FINAL
        |--------------------------------------------------------------------------
        */

        $this->command?->info(
            'Datos demo de EduFlow AI creados/actualizados correctamente.'
        );

        $this->command?->info(
            'Administrador: admin@eduflow.test / Admin12345'
        );

        $this->command?->info(
            'Docentes: *@eduflow.test / Docente123'
        );

        $this->command?->info(
            'Estudiantes: estudiante001@eduflow.test ... / Estudiante123'
        );
    }
}
