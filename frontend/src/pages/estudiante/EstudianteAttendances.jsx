import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function EstudianteAttendances() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadAttendances();
    }, []);

    const getArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    };

    const loadAttendances = async () => {
        try {
            setLoading(true);
            setError("");

            // SOLO las asistencias del estudiante autenticado
            const response = await api.get("/my/attendances");

            setAttendances(getArray(response.data));
        } catch (err) {
            console.error("Error cargando asistencias:", err);

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar tus asistencias."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name) => {
        if (!name) return "E";

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase();
    };

    const getCourseName = (attendance) => {
        return (
            attendance?.course?.name ||
            attendance?.course?.course_name ||
            attendance?.course_name ||
            attendance?.course?.nombre ||
            "Curso"
        );
    };

    const getDate = (attendance) => {
        const date =
            attendance?.attendance_date ||
            attendance?.date ||
            attendance?.fecha;

        if (!date) {
            return "Fecha no disponible";
        }

        return new Date(date).toLocaleDateString("es-PE");
    };

    const getStatus = (attendance) => {
        const status = String(
            attendance?.status ||
            attendance?.attendance_status ||
            attendance?.estado ||
            ""
        ).toLowerCase();

        if (
            status.includes("present") ||
            status.includes("presente") ||
            status === "p"
        ) {
            return {
                text: "Presente",
                className: "attendance-present",
            };
        }

        if (
            status.includes("absent") ||
            status.includes("ausente") ||
            status === "a"
        ) {
            return {
                text: "Ausente",
                className: "attendance-absent",
            };
        }

        if (
            status.includes("late") ||
            status.includes("tarde") ||
            status === "t"
        ) {
            return {
                text: "Tardanza",
                className: "attendance-late",
            };
        }

        if (
            status.includes("justif") ||
            status.includes("justificado")
        ) {
            return {
                text: "Justificada",
                className: "attendance-justified",
            };
        }

        return {
            text: attendance?.status || "Registrado",
            className: "attendance-justified",
        };
    };

    return (
        <div className="student-dashboard">

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

            <main className="student-content">

                <section className="student-welcome">

                    <div>

                        <span className="student-welcome-label">
                            MIS ASISTENCIAS
                        </span>

                        <h2>
                            Mis asistencias 📅
                        </h2>

                        <p>
                            Consulta tu registro de asistencia.
                        </p>

                    </div>

                    <div className="student-session">

                        <span>
                            Estado de sesión
                        </span>

                        <strong>
                            <i></i>
                            Sesión activa
                        </strong>

                    </div>

                </section>

                {error && (
                    <div className="student-error">
                        ⚠️ {error}
                    </div>
                )}

                <section className="student-section">

                    <div className="student-section-header">

                        <div>

                            <h3>
                                Registro de asistencias
                            </h3>

                            <span>
                                {loading
                                    ? "Cargando..."
                                    : `${attendances.length} registro${attendances.length !== 1 ? "s" : ""}`}
                            </span>

                        </div>

                        <button
                            className="student-secondary-button"
                            onClick={() => navigate("/estudiante")}
                        >
                            Volver al inicio
                        </button>

                    </div>

                    {loading ? (

                        <div className="student-loading">
                            Cargando tus asistencias...
                        </div>

                    ) : attendances.length === 0 ? (

                        <div className="student-empty">
                            📅 No tienes registros de asistencia actualmente.
                        </div>

                    ) : (

                        <div className="student-attendance-list">

                            {attendances.map((attendance, index) => {

                                const status = getStatus(attendance);

                                return (
                                    <div
                                        className="student-attendance-item"
                                        key={attendance.id || index}
                                    >

                                        <div>

                                            <strong>
                                                {getCourseName(attendance)}
                                            </strong>

                                            <span>
                                                {getDate(attendance)}
                                            </span>

                                        </div>

                                        <span
                                            className={`student-attendance-status ${status.className}`}
                                        >
                                            {status.text}
                                        </span>

                                    </div>
                                );
                            })}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default EstudianteAttendances;