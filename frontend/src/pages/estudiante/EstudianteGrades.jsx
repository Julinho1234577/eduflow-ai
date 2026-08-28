import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function EstudianteGrades() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadGrades();
    }, []);

    const getArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    };

    const loadGrades = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/my/grades");

            setGrades(getArray(response.data));
        } catch (err) {
            console.error("Error cargando calificaciones:", err);

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar tus calificaciones."
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

    const getCourseName = (grade) => {
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
            grade?.grade ??
            grade?.score ??
            grade?.nota ??
            grade?.calification ??
            0;

        return Number(value);
    };

    const getGradeClass = (value) => {
        if (value >= 14) return "grade-good";
        if (value >= 11) return "grade-medium";
        return "grade-low";
    };

    const getEvaluationName = (grade) => {
        return (
            grade?.evaluation ||
            grade?.evaluation_name ||
            grade?.type ||
            grade?.description ||
            "Evaluación"
        );
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
                            MIS CALIFICACIONES
                        </span>

                        <h2>
                            Mis calificaciones 📊
                        </h2>

                        <p>
                            Consulta tus notas y rendimiento académico.
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
                                Mis calificaciones
                            </h3>

                            <span>
                                {loading
                                    ? "Cargando..."
                                    : `${grades.length} calificación${grades.length !== 1 ? "es" : ""}`}
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
                            Cargando tus calificaciones...
                        </div>

                    ) : grades.length === 0 ? (

                        <div className="student-empty">
                            📝 No tienes calificaciones registradas actualmente.
                        </div>

                    ) : (

                        <div className="student-grade-list">

                            {grades.map((grade, index) => {

                                const value = getGradeValue(grade);

                                return (
                                    <div
                                        className="student-grade-item"
                                        key={grade.id || index}
                                    >

                                        <div>

                                            <strong>
                                                {getCourseName(grade)}
                                            </strong>

                                            <span>
                                                {getEvaluationName(grade)}
                                            </span>

                                        </div>

                                        <div
                                            className={`student-grade-value ${getGradeClass(value)}`}
                                        >
                                            {value.toFixed(1)}
                                        </div>

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

export default EstudianteGrades;