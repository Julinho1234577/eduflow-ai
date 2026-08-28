import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function EstudianteCourses() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCourses();
    }, []);

    const getArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    };

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");

            // IMPORTANTE:
            // Esta es la ruta que realmente existe en Laravel.
            const response = await api.get("/my/enrollments");

            const enrollments = getArray(response.data);

            const coursesData = enrollments
                .map((enrollment) => enrollment.course)
                .filter(Boolean);

            setCourses(coursesData);
        } catch (err) {
            console.error("Error cargando cursos:", err);

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar tus cursos."
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

    const getCourseName = (course) => {
        return (
            course?.name ||
            course?.course_name ||
            course?.nombre ||
            "Curso sin nombre"
        );
    };

    const getCourseCode = (course) => {
        return (
            course?.code ||
            course?.course_code ||
            course?.codigo ||
            "Sin código"
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
                            MIS CURSOS
                        </span>

                        <h2>
                            Mis cursos 📚
                        </h2>

                        <p>
                            Consulta los cursos en los que estás matriculado.
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
                                Cursos matriculados
                            </h3>

                            <span>
                                {loading
                                    ? "Cargando cursos..."
                                    : `${courses.length} curso${courses.length !== 1 ? "s" : ""} registrado${courses.length !== 1 ? "s" : ""}`}
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
                            Cargando tus cursos...
                        </div>

                    ) : courses.length === 0 ? (

                        <div className="student-empty">
                            📚 No tienes cursos matriculados actualmente.
                        </div>

                    ) : (

                        <div className="student-course-list">

                            {courses.map((course, index) => (

                                <div
                                    className="student-course-item"
                                    key={course.id || index}
                                >

                                    <div className="student-course-icon">
                                        📚
                                    </div>

                                    <div className="student-course-info">

                                        <strong>
                                            {getCourseName(course)}
                                        </strong>

                                        <span>
                                            Código: {getCourseCode(course)}
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

            </main>

        </div>
    );
}

export default EstudianteCourses;