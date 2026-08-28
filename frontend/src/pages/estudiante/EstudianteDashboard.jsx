import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function EstudianteDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [grades, setGrades] = useState([]);
    const [attendances, setAttendances] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboard();
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

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            /*
             * IMPORTANTE:
             * Estas son las rutas que SÍ existen en Laravel.
             *
             * /my/courses NO existe.
             * Para cursos usamos /my/enrollments.
             */

            const [
                enrollmentsResponse,
                gradesResponse,
                attendancesResponse,
            ] = await Promise.all([
                api.get("/my/enrollments"),
                api.get("/my/grades"),
                api.get("/my/attendances"),
            ]);

            /*
             * Las matrículas contienen la información
             * del curso. Extraemos únicamente los cursos.
             */

            const enrollments = getArray(
                enrollmentsResponse.data
            );

            const studentCourses = enrollments
                .map((enrollment) => enrollment?.course)
                .filter(Boolean);

            setCourses(studentCourses);

            /*
             * Las notas y asistencias ya vienen filtradas
             * por el estudiante autenticado desde Laravel.
             */

            setGrades(
                getArray(gradesResponse.data)
            );

            setAttendances(
                getArray(attendancesResponse.data)
            );

        } catch (err) {
            console.error(
                "Error cargando información del estudiante:",
                err
            );

            setError(
                err.response?.data?.message ||
                "No se pudo cargar tu información académica."
            );
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) {
            return "E";
        }

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return "Buenos días";
        }

        if (hour < 18) {
            return "Buenas tardes";
        }

        return "Buenas noches";
    };

    const getCourseName = (course) => {
        return (
            course?.name ||
            course?.course?.name ||
            course?.course_name ||
            course?.nombre ||
            "Curso"
        );
    };

    const getCourseCode = (course) => {
        return (
            course?.code ||
            course?.course?.code ||
            course?.course_code ||
            course?.codigo ||
            ""
        );
    };

    const getGradeCourseName = (grade) => {
        return (
            grade?.course?.name ||
            grade?.course?.course_name ||
            grade?.course_name ||
            grade?.course?.nombre ||
            "Curso"
        );
    };

    const getGradeValue = (grade) => {
        const value =
            grade?.score ??
            grade?.grade ??
            grade?.value ??
            grade?.nota ??
            0;

        return Number(value);
    };

    const getAttendanceCourseName = (attendance) => {
        return (
            attendance?.course?.name ||
            attendance?.course?.course_name ||
            attendance?.course_name ||
            attendance?.course?.nombre ||
            "Curso"
        );
    };

    const getAttendanceStatus = (status) => {
        const statuses = {
            present: "Presente",
            absent: "Ausente",
            late: "Tardanza",
            justified: "Justificada",
        };

        return (
            statuses[status] ||
            status ||
            "Sin registro"
        );
    };

    const getAttendanceClass = (status) => {
        return `attendance-${status || "unknown"}`;
    };

    const getAverage = () => {
        if (grades.length === 0) {
            return 0;
        }

        const total = grades.reduce(
            (sum, grade) =>
                sum + getGradeValue(grade),
            0
        );

        return total / grades.length;
    };

    const getAttendancePercentage = () => {
        if (attendances.length === 0) {
            return 0;
        }

        const present = attendances.filter(
            (attendance) =>
                attendance?.status === "present"
        ).length;

        return Math.round(
            (present / attendances.length) * 100
        );
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="student-dashboard">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="student-header">

                <div className="student-brand">

                    <div className="student-brand-icon">
                        🎓
                    </div>

                    <div>
                        <h1>EduFlow AI</h1>
                        <p>Portal del estudiante</p>
                    </div>

                </div>

                <div className="student-user">

                    <div className="student-avatar">
                        {getInitials(user?.name)}
                    </div>

                    <div className="student-user-info">

                        <strong>
                            {user?.name || "Estudiante"}
                        </strong>

                        <span>
                            Estudiante
                        </span>

                    </div>

                    <button
                        className="student-logout-button"
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </button>

                </div>

            </header>


            {/* =====================================================
                CONTENIDO
            ===================================================== */}

            <main className="student-content">


                {/* =================================================
                    BIENVENIDA
                ================================================= */}

                <section className="student-welcome">

                    <div>

                        <span className="student-welcome-label">
                            MI PANEL
                        </span>

                        <h2>
                            {getGreeting()},{" "}
                            {user?.name?.split(" ")[0] ||
                                "Estudiante"}{" "}
                            👋
                        </h2>

                        <p>
                            Consulta tus cursos,
                            calificaciones y asistencias.
                        </p>

                    </div>

                    <div className="student-session">

                        <span>
                            Estado
                        </span>

                        <strong>
                            <i></i>
                            Sesión activa
                        </strong>

                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="student-error">
                        ⚠️ {error}
                    </div>
                )}


                {/* =================================================
                    ESTADÍSTICAS
                ================================================= */}

                <section className="student-stats-grid">


                    {/* CURSOS */}

                    <button
                        className="student-stat-card"
                        onClick={() =>
                            navigate(
                                "/estudiante/courses"
                            )
                        }
                    >

                        <div className="student-stat-icon blue">
                            📚
                        </div>

                        <div>

                            <span>
                                Mis cursos
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : courses.length}
                            </strong>

                            <small>
                                Cursos matriculados
                            </small>

                        </div>

                    </button>


                    {/* CALIFICACIONES */}

                    <button
                        className="student-stat-card"
                        onClick={() =>
                            navigate(
                                "/estudiante/grades"
                            )
                        }
                    >

                        <div className="student-stat-icon purple">
                            📝
                        </div>

                        <div>

                            <span>
                                Mis calificaciones
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : grades.length}
                            </strong>

                            <small>
                                Notas registradas
                            </small>

                        </div>

                    </button>


                    {/* ASISTENCIA */}

                    <button
                        className="student-stat-card"
                        onClick={() =>
                            navigate(
                                "/estudiante/attendances"
                            )
                        }
                    >

                        <div className="student-stat-icon green">
                            📅
                        </div>

                        <div>

                            <span>
                                Mi asistencia
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : `${getAttendancePercentage()}%`}
                            </strong>

                            <small>
                                Porcentaje de asistencia
                            </small>

                        </div>

                    </button>


                    {/* PROMEDIO */}

                    <div className="student-stat-card">

                        <div className="student-stat-icon orange">
                            ⭐
                        </div>

                        <div>

                            <span>
                                Mi promedio
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : getAverage().toFixed(2)}
                            </strong>

                            <small>
                                Promedio de mis notas
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    MIS CURSOS
                ================================================= */}

                <section className="student-section">

                    <div className="student-section-header">

                        <div>

                            <h3>
                                Mis cursos
                            </h3>

                            <span>
                                Cursos en los que estás matriculado.
                            </span>

                        </div>

                        <button
                            className="student-secondary-button"
                            onClick={() =>
                                navigate(
                                    "/estudiante/courses"
                                )
                            }
                        >
                            Ver todos
                        </button>

                    </div>


                    {loading ? (

                        <div className="student-loading">
                            Cargando cursos...
                        </div>

                    ) : courses.length === 0 ? (

                        <div className="student-empty">
                            📚 No tienes cursos matriculados.
                        </div>

                    ) : (

                        <div className="student-course-list">

                            {courses
                                .slice(0, 5)
                                .map((course, index) => (

                                    <div
                                        className="student-course-item"
                                        key={
                                            course?.id ||
                                            index
                                        }
                                    >

                                        <div className="student-course-icon">
                                            📘
                                        </div>

                                        <div className="student-course-info">

                                            <strong>
                                                {getCourseName(
                                                    course
                                                )}
                                            </strong>

                                            <span>
                                                {getCourseCode(
                                                    course
                                                )}
                                            </span>

                                        </div>

                                        <span className="student-status">
                                            Matriculado
                                        </span>

                                    </div>

                                ))}

                        </div>

                    )}

                </section>


                {/* =================================================
                    MIS CALIFICACIONES
                ================================================= */}

                <section className="student-section">

                    <div className="student-section-header">

                        <div>

                            <h3>
                                Mis calificaciones
                            </h3>

                            <span>
                                Consulta tus últimas notas.
                            </span>

                        </div>

                        <button
                            className="student-secondary-button"
                            onClick={() =>
                                navigate(
                                    "/estudiante/grades"
                                )
                            }
                        >
                            Ver todas
                        </button>

                    </div>


                    {loading ? (

                        <div className="student-loading">
                            Cargando calificaciones...
                        </div>

                    ) : grades.length === 0 ? (

                        <div className="student-empty">
                            📝 Todavía no tienes calificaciones.
                        </div>

                    ) : (

                        <div className="student-grade-list">

                            {grades
                                .slice()
                                .reverse()
                                .slice(0, 5)
                                .map((grade, index) => {

                                    const score =
                                        getGradeValue(
                                            grade
                                        );

                                    return (

                                        <div
                                            className="student-grade-item"
                                            key={
                                                grade?.id ||
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {getGradeCourseName(
                                                        grade
                                                    )}
                                                </strong>

                                                <span>
                                                    {grade?.name ||
                                                        grade?.description ||
                                                        grade?.evaluation ||
                                                        "Calificación"}
                                                </span>

                                            </div>

                                            <strong>
                                                {score.toFixed(2)}
                                            </strong>

                                        </div>

                                    );

                                })}

                        </div>

                    )}

                </section>


                {/* =================================================
                    MIS ASISTENCIAS
                ================================================= */}

                <section className="student-section">

                    <div className="student-section-header">

                        <div>

                            <h3>
                                Mis asistencias
                            </h3>

                            <span>
                                Consulta tus últimos registros.
                            </span>

                        </div>

                        <button
                            className="student-secondary-button"
                            onClick={() =>
                                navigate(
                                    "/estudiante/attendances"
                                )
                            }
                        >
                            Ver todas
                        </button>

                    </div>


                    {loading ? (

                        <div className="student-loading">
                            Cargando asistencias...
                        </div>

                    ) : attendances.length === 0 ? (

                        <div className="student-empty">
                            📅 Todavía no tienes registros de asistencia.
                        </div>

                    ) : (

                        <div className="student-attendance-list">

                            {attendances
                                .slice()
                                .reverse()
                                .slice(0, 5)
                                .map(
                                    (
                                        attendance,
                                        index
                                    ) => (

                                        <div
                                            className="student-attendance-item"
                                            key={
                                                attendance?.id ||
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {getAttendanceCourseName(
                                                        attendance
                                                    )}
                                                </strong>

                                                <span>
                                                    {attendance?.attendance_date
                                                        ? new Date(
                                                            attendance.attendance_date
                                                        ).toLocaleDateString(
                                                            "es-PE"
                                                        )
                                                        : attendance?.date
                                                            ? new Date(
                                                                attendance.date
                                                            ).toLocaleDateString(
                                                                "es-PE"
                                                            )
                                                            : "Fecha no disponible"}
                                                </span>

                                            </div>

                                            <span
                                                className={`student-attendance-status ${getAttendanceClass(
                                                    attendance?.status
                                                )}`}
                                            >
                                                {getAttendanceStatus(
                                                    attendance?.status
                                                )}
                                            </span>

                                        </div>

                                    )
                                )}

                        </div>

                    )}

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="student-footer">

                    <div>

                        <strong>
                            EduFlow AI
                        </strong>

                        <span>
                            Plataforma inteligente de gestión educativa
                        </span>

                    </div>

                    <div className="student-footer-stats">

                        <span>
                            Cursos{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : courses.length}
                            </strong>
                        </span>

                        <span>
                            Notas{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : grades.length}
                            </strong>
                        </span>

                        <span>
                            Asistencia{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : `${getAttendancePercentage()}%`}
                            </strong>
                        </span>

                    </div>

                </footer>

            </main>

        </div>
    );
}

export default EstudianteDashboard;