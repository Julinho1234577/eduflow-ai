import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function DocenteAttendances() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [attendances, setAttendances] = useState([]);

    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const getArray = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                coursesResponse,
                enrollmentsResponse,
                attendancesResponse,
            ] = await Promise.all([
                api.get("/courses"),
                api.get("/enrollments"),
                api.get("/attendances"),
            ]);

            const coursesData = getArray(coursesResponse.data);
            const enrollmentsData = getArray(enrollmentsResponse.data);
            const attendancesData = getArray(attendancesResponse.data);

            setCourses(coursesData);
            setEnrollments(enrollmentsData);
            setAttendances(attendancesData);

            if (coursesData.length > 0) {
                setSelectedCourse(String(coursesData[0].id));
            }
        } catch (err) {
            console.error(
                "Error cargando asistencias:",
                err
            );

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar las asistencias."
            );
        } finally {
            setLoading(false);
        }
    };

    const getStudentsByCourse = () => {
        if (!selectedCourse) {
            return [];
        }

        return enrollments.filter(
            (enrollment) =>
                Number(enrollment.course_id) ===
                Number(selectedCourse)
        );
    };

    const getAttendance = (studentId) => {
        return attendances.find(
            (attendance) => {
                const attendanceStudentId =
                    attendance.student_id ??
                    attendance.enrollment?.student_id;

                const attendanceCourseId =
                    attendance.course_id ??
                    attendance.enrollment?.course_id;

                const attendanceDate =
                    attendance.date ??
                    attendance.attendance_date;

                return (
                    Number(attendanceStudentId) ===
                        Number(studentId) &&
                    Number(attendanceCourseId) ===
                        Number(selectedCourse) &&
                    attendanceDate === selectedDate
                );
            }
        );
    };

    const getStatus = (studentId) => {
        const attendance = getAttendance(studentId);

        return attendance?.status || "Pendiente";
    };

    const getStudentName = (enrollment) => {
        return (
            enrollment.student?.user?.name ||
            enrollment.student?.name ||
            "Estudiante"
        );
    };

    const getStudentCode = (enrollment) => {
        return (
            enrollment.student?.student_code ||
            enrollment.student?.code ||
            "—"
        );
    };

    const handleStatusChange = (studentId, status) => {
        setAttendances((current) => {
            const existingIndex = current.findIndex(
                (attendance) => {
                    const attendanceStudentId =
                        attendance.student_id ??
                        attendance.enrollment?.student_id;

                    const attendanceCourseId =
                        attendance.course_id ??
                        attendance.enrollment?.course_id;

                    const attendanceDate =
                        attendance.date ??
                        attendance.attendance_date;

                    return (
                        Number(attendanceStudentId) ===
                            Number(studentId) &&
                        Number(attendanceCourseId) ===
                            Number(selectedCourse) &&
                        attendanceDate === selectedDate
                    );
                }
            );

            if (existingIndex >= 0) {
                const updated = [...current];

                updated[existingIndex] = {
                    ...updated[existingIndex],
                    status,
                };

                return updated;
            }

            return [
                ...current,
                {
                    id: `temp-${studentId}-${selectedDate}`,
                    student_id: studentId,
                    course_id: Number(selectedCourse),
                    date: selectedDate,
                    status,
                    temporary: true,
                },
            ];
        });
    };

    const saveAttendance = async () => {
        const students = getStudentsByCourse();

        if (!selectedCourse) {
            setError("Selecciona un curso.");
            return;
        }

        if (students.length === 0) {
            setError(
                "No hay estudiantes matriculados en este curso."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const requests = students.map(
                async (enrollment) => {
                    const studentId =
                        enrollment.student_id ||
                        enrollment.student?.id;

                    const status =
                        getStatus(studentId);

                    if (status === "Pendiente") {
                        return null;
                    }

                    const existing =
                        getAttendance(studentId);

                    if (
                        existing &&
                        !existing.temporary
                    ) {
                        return api.put(
                            `/attendances/${existing.id}`,
                            {
                                student_id: studentId,
                                course_id:
                                    Number(selectedCourse),
                                date: selectedDate,
                                status,
                            }
                        );
                    }

                    return api.post(
                        "/attendances",
                        {
                            student_id: studentId,
                            course_id:
                                Number(selectedCourse),
                            date: selectedDate,
                            status,
                        }
                    );
                }
            );

            await Promise.all(requests);

            setSuccess(
                "Asistencia guardada correctamente."
            );

            await loadData();
        } catch (err) {
            console.error(
                "Error guardando asistencia:",
                err
            );

            setError(
                err.response?.data?.message ||
                "No se pudo guardar la asistencia."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const selectedCourseData = courses.find(
        (course) =>
            Number(course.id) ===
            Number(selectedCourse)
    );

    const students = getStudentsByCourse();

    const presentCount = students.filter(
        (enrollment) => {
            const studentId =
                enrollment.student_id ||
                enrollment.student?.id;

            return getStatus(studentId) === "Presente";
        }
    ).length;

    const absentCount = students.filter(
        (enrollment) => {
            const studentId =
                enrollment.student_id ||
                enrollment.student?.id;

            return getStatus(studentId) === "Ausente";
        }
    ).length;

    const lateCount = students.filter(
        (enrollment) => {
            const studentId =
                enrollment.student_id ||
                enrollment.student?.id;

            return getStatus(studentId) === "Tardanza";
        }
    ).length;

    return (
        <div className="admin-dashboard">

            {/* HEADER */}

            <header className="admin-header">

                <div>
                    <h1>EduFlow AI</h1>

                    <p>
                        Control de asistencias
                    </p>
                </div>

                <div className="admin-user">

                    <div className="user-avatar">
                        {user?.name
                            ?.split(" ")
                            .slice(0, 2)
                            .map(
                                (word) =>
                                    word.charAt(0)
                            )
                            .join("")
                            .toUpperCase() || "D"}
                    </div>

                    <span>
                        {user?.name || "Docente"}
                    </span>

                    <button onClick={handleLogout}>
                        Cerrar sesión
                    </button>

                </div>

            </header>


            <main className="admin-content">

                {/* VOLVER */}

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                        navigate("/docente")
                    }
                    style={{
                        marginBottom: "20px",
                    }}
                >
                    ← Volver al panel
                </button>


                {/* TITULO */}

                <section className="welcome-section">

                    <div>

                        <span className="welcome-label">
                            ASISTENCIAS
                        </span>

                        <h2>
                            Control de asistencia
                        </h2>

                        <p>
                            Registra y consulta la
                            asistencia de los estudiantes
                            de tus cursos.
                        </p>

                    </div>

                </section>


                {/* ERROR */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {/* EXITO */}

                {success && (
                    <div
                        className="dashboard-success"
                        style={{
                            marginBottom: "20px",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            background:
                                "#dcfce7",
                            color:
                                "#166534",
                            fontWeight:
                                "600",
                        }}
                    >
                        ✓ {success}
                    </div>
                )}


                {/* FILTROS */}

                <section className="table-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Registrar asistencia
                            </h3>

                            <span>
                                Selecciona el curso y la fecha
                            </span>

                        </div>

                    </div>


                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "20px",
                            padding: "20px 0",
                        }}
                    >

                        <div>

                            <label>
                                Curso
                            </label>

                            <select
                                value={selectedCourse}
                                onChange={(event) =>
                                    setSelectedCourse(
                                        event.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    marginTop: "8px",
                                }}
                            >

                                {courses.length === 0 ? (
                                    <option value="">
                                        No hay cursos
                                    </option>
                                ) : (
                                    courses.map(
                                        (course) => (
                                            <option
                                                key={
                                                    course.id
                                                }
                                                value={
                                                    course.id
                                                }
                                            >
                                                {course.code
                                                    ? `${course.code} - `
                                                    : ""}
                                                {course.name}
                                            </option>
                                        )
                                    )
                                )}

                            </select>

                        </div>


                        <div>

                            <label>
                                Fecha
                            </label>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(event) =>
                                    setSelectedDate(
                                        event.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    marginTop: "8px",
                                }}
                            />

                        </div>

                    </div>

                </section>


                {/* ESTADISTICAS */}

                <section className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon">
                            👨‍🎓
                        </div>

                        <div>

                            <span>
                                Estudiantes
                            </span>

                            <strong>
                                {students.length}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            ✅
                        </div>

                        <div>

                            <span>
                                Presentes
                            </span>

                            <strong>
                                {presentCount}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            ❌
                        </div>

                        <div>

                            <span>
                                Ausentes
                            </span>

                            <strong>
                                {absentCount}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            ⏰
                        </div>

                        <div>

                            <span>
                                Tardanzas
                            </span>

                            <strong>
                                {lateCount}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* LISTA */}

                <section className="table-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                {selectedCourseData?.name ||
                                    "Estudiantes"}
                            </h3>

                            <span>
                                {selectedDate} ·{" "}
                                {students.length} estudiantes
                            </span>

                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={saveAttendance}
                            disabled={
                                saving ||
                                students.length === 0
                            }
                        >
                            {saving
                                ? "Guardando..."
                                : "Guardar asistencia"}
                        </button>

                    </div>


                    {loading ? (

                        <div className="loading-message">
                            Cargando estudiantes...
                        </div>

                    ) : students.length === 0 ? (

                        <div className="empty-message">
                            No hay estudiantes matriculados
                            en este curso.
                        </div>

                    ) : (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Código
                                        </th>

                                        <th>
                                            Estudiante
                                        </th>

                                        <th>
                                            Correo
                                        </th>

                                        <th>
                                            Estado
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {students.map(
                                        (enrollment) => {

                                            const studentId =
                                                enrollment.student_id ||
                                                enrollment.student?.id;

                                            return (
                                                <tr
                                                    key={
                                                        enrollment.id
                                                    }
                                                >

                                                    <td>
                                                        {getStudentCode(
                                                            enrollment
                                                        )}
                                                    </td>

                                                    <td>

                                                        <strong>
                                                            {getStudentName(
                                                                enrollment
                                                            )}
                                                        </strong>

                                                    </td>

                                                    <td>
                                                        {enrollment
                                                            .student
                                                            ?.user
                                                            ?.email ||
                                                            "—"}
                                                    </td>

                                                    <td>

                                                        <select
                                                            value={getStatus(
                                                                studentId
                                                            )}
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleStatusChange(
                                                                    studentId,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        >

                                                            <option value="Pendiente">
                                                                Pendiente
                                                            </option>

                                                            <option value="Presente">
                                                                Presente
                                                            </option>

                                                            <option value="Ausente">
                                                                Ausente
                                                            </option>

                                                            <option value="Tardanza">
                                                                Tardanza
                                                            </option>

                                                        </select>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default DocenteAttendances;

