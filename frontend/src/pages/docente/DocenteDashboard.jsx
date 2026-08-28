import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function DocenteDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        courses: 0,
        students: 0,
        grades: 0,
        attendances: 0,
    });

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

            const [
                coursesResponse,
                enrollmentsResponse,
                gradesResponse,
                attendancesResponse,
            ] = await Promise.all([
                api.get("/courses"),
                api.get("/enrollments"),
                api.get("/grades"),
                api.get("/attendances"),
            ]);

            const coursesData = getArray(coursesResponse.data);
            const enrollmentsData = getArray(enrollmentsResponse.data);
            const gradesData = getArray(gradesResponse.data);
            const attendancesData = getArray(
                attendancesResponse.data
            );

            /*
             * Obtener estudiantes únicos
             * pertenecientes a las matrículas.
             */
            const studentIds = new Set(
                enrollmentsData
                    .map(
                        (enrollment) =>
                            enrollment.student_id
                    )
                    .filter(Boolean)
            );

            setStats({
                courses: coursesData.length,
                students: studentIds.size,
                grades: gradesData.length,
                attendances: attendancesData.length,
            });

        } catch (err) {
            console.error(
                "Error cargando dashboard docente:",
                err
            );

            /*
             * Si asistencias todavía no está disponible,
             * intentamos cargar el resto de información.
             */
            try {
                const [
                    coursesResponse,
                    enrollmentsResponse,
                    gradesResponse,
                ] = await Promise.all([
                    api.get("/courses"),
                    api.get("/enrollments"),
                    api.get("/grades"),
                ]);

                const coursesData = getArray(
                    coursesResponse.data
                );

                const enrollmentsData = getArray(
                    enrollmentsResponse.data
                );

                const gradesData = getArray(
                    gradesResponse.data
                );

                const studentIds = new Set(
                    enrollmentsData
                        .map(
                            (enrollment) =>
                                enrollment.student_id
                        )
                        .filter(Boolean)
                );

                setStats({
                    courses: coursesData.length,
                    students: studentIds.size,
                    grades: gradesData.length,
                    attendances: 0,
                });

                setError("");

            } catch (secondError) {
                console.error(
                    "Error cargando datos básicos:",
                    secondError
                );

                setError(
                    secondError.response?.data?.message ||
                    "No se pudieron cargar los datos del docente."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name) => {
        if (!name) {
            return "D";
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

    return (
        <div className="admin-dashboard">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="admin-header">

                <div>
                    <h1>
                        EduFlow AI
                    </h1>

                    <p>
                        Panel del Docente
                    </p>
                </div>

                <div className="admin-user">

                    <div className="user-avatar">
                        {getInitials(user?.name)}
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

                {/* ==================================================
                    BIENVENIDA
                ================================================== */}

                <section className="welcome-section">

                    <div>

                        <span className="welcome-label">
                            PANEL DEL DOCENTE
                        </span>

                        <h2>
                            {getGreeting()},{" "}
                            {user?.name || "Docente"} 👋
                        </h2>

                        <p>
                            Gestiona tus cursos, estudiantes,
                            calificaciones y asistencias desde
                            un solo lugar.
                        </p>

                    </div>

                </section>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {/* ==================================================
                    TARJETAS PRINCIPALES
                ================================================== */}

                <section className="stats-grid">

                    {/* ================= MIS CURSOS ================= */}

                    <button
                        type="button"
                        className="stat-card"
                        onClick={() =>
                            navigate("/docente/courses")
                        }
                    >

                        <div className="stat-icon">
                            📚
                        </div>

                        <div>

                            <span>
                                Mis cursos
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.courses}
                            </strong>

                            <small>
                                Cursos asignados
                            </small>

                        </div>

                    </button>


                    {/* ================= ESTUDIANTES ================= */}

                    <button
                        type="button"
                        className="stat-card"
                        onClick={() =>
                            navigate("/docente/students")
                        }
                    >

                        <div className="stat-icon">
                            👨‍🎓
                        </div>

                        <div>

                            <span>
                                Mis estudiantes
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.students}
                            </strong>

                            <small>
                                Estudiantes de mis cursos
                            </small>

                        </div>

                    </button>


                    {/* ================= CALIFICACIONES ================= */}

                    <button
                        type="button"
                        className="stat-card"
                        onClick={() =>
                            navigate("/docente/grades")
                        }
                    >

                        <div className="stat-icon">
                            📊
                        </div>

                        <div>

                            <span>
                                Calificaciones
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.grades}
                            </strong>

                            <small>
                                Notas registradas
                            </small>

                        </div>

                    </button>


                    {/* ================= ASISTENCIAS ================= */}

                    <button
                        type="button"
                        className="stat-card"
                        onClick={() =>
                            navigate("/admin/attendances")
                        }
                    >

                        <div className="stat-icon">
                            📅
                        </div>

                        <div>

                            <span>
                                Asistencias
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.attendances}
                            </strong>

                            <small>
                                Registros de asistencia
                            </small>

                        </div>

                    </button>

                </section>


                {/* ==================================================
                    PANEL INFORMATIVO
                ================================================== */}

                <section className="table-card">

                    <div
                        style={{
                            padding: "30px",
                            textAlign: "center",
                        }}
                    >

                        <div
                            style={{
                                fontSize: "42px",
                                marginBottom: "10px",
                            }}
                        >
                            🎓
                        </div>

                        <h3
                            style={{
                                marginBottom: "8px",
                            }}
                        >
                            Gestión académica
                        </h3>

                        <p
                            style={{
                                margin: 0,
                                opacity: 0.7,
                            }}
                        >
                            Selecciona una de las opciones
                            anteriores para comenzar a gestionar
                            tu actividad docente.
                        </p>

                    </div>

                </section>


                {/* ==================================================
                    RESUMEN INFERIOR
                ================================================== */}

                <section
                    className="dashboard-footer-card"
                    style={{
                        marginTop: "24px",
                    }}
                >

                    <div>

                        <strong>
                            EduFlow AI
                        </strong>

                        <span>
                            Plataforma inteligente de gestión educativa
                        </span>

                    </div>

                    <div className="dashboard-footer-stats">

                        <span>
                            Cursos{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : stats.courses}
                            </strong>
                        </span>

                        <span>
                            Estudiantes{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : stats.students}
                            </strong>
                        </span>

                        <span>
                            Notas{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : stats.grades}
                            </strong>
                        </span>

                        <span>
                            Asistencias{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : stats.attendances}
                            </strong>
                        </span>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default DocenteDashboard;

