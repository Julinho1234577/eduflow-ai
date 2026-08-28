import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function DocenteCourses() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/courses");

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];

            setCourses(data);
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

    return (
        <div className="admin-dashboard">

            {/* HEADER */}

            <header className="admin-header">

                <div>
                    <h1>EduFlow AI</h1>

                    <p>
                        Mis cursos
                    </p>
                </div>

                <div className="admin-user">

                    <span>
                        {user?.name || "Docente"}
                    </span>

                    <button onClick={handleLogout}>
                        Cerrar sesión
                    </button>

                </div>

            </header>


            <main className="admin-content">

                {/* CABECERA */}

                <section className="welcome-section">

                    <div>

                        <h2>
                            Mis cursos 📚
                        </h2>

                        <p>
                            Consulta los cursos que tienes
                            asignados actualmente.
                        </p>

                    </div>

                    <button
                        className="secondary-button"
                        onClick={() => navigate("/docente")}
                    >
                        ← Volver al panel
                    </button>

                </section>


                {/* ERROR */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {/* ESTADÍSTICAS */}

                {!loading && !error && (

                    <section className="stats-grid">

                        <div className="stat-card">

                            <div className="stat-icon">
                                📚
                            </div>

                            <div>
                                <span>
                                    Cursos asignados
                                </span>

                                <strong>
                                    {courses.length}
                                </strong>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                🎓
                            </div>

                            <div>
                                <span>
                                    Estado
                                </span>

                                <strong>
                                    Activos
                                </strong>
                            </div>

                        </div>

                    </section>

                )}


                {/* TABLA */}

                <section className="table-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Cursos asignados
                            </h3>

                            <span>
                                {loading
                                    ? "Cargando..."
                                    : `${courses.length} cursos`}
                            </span>

                        </div>

                    </div>


                    {loading ? (

                        <div className="loading-message">
                            Cargando tus cursos...
                        </div>

                    ) : courses.length === 0 ? (

                        <div className="empty-message">
                            No tienes cursos asignados.
                        </div>

                    ) : (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>ID</th>
                                        <th>Código</th>
                                        <th>Curso</th>
                                        <th>Créditos</th>
                                        <th>Horas</th>
                                        <th>Estado</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {courses.map((course) => (

                                        <tr key={course.id}>

                                            <td>
                                                {course.id}
                                            </td>

                                            <td>
                                                <strong>
                                                    {course.code || "—"}
                                                </strong>
                                            </td>

                                            <td>
                                                {course.name || "—"}
                                            </td>

                                            <td>
                                                {course.credits ?? "—"}
                                            </td>

                                            <td>
                                                {course.hours ?? "—"}
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        course.active
                                                            ? "status-active"
                                                            : "status-inactive"
                                                    }
                                                >
                                                    {course.active
                                                        ? "Activo"
                                                        : "Inactivo"}
                                                </span>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* INFORMACIÓN */}

                {!loading && courses.length > 0 && (

                    <section className="table-card">

                        <div className="table-header">

                            <div>

                                <h3>
                                    Información
                                </h3>

                                <span>
                                    Resumen de tu actividad docente
                                </span>

                            </div>

                        </div>

                        <div
                            style={{
                                padding: "24px",
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "16px",
                            }}
                        >

                            <div className="stat-card">

                                <div className="stat-icon">
                                    📖
                                </div>

                                <div>
                                    <span>
                                        Cursos
                                    </span>

                                    <strong>
                                        {courses.length}
                                    </strong>
                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    🕐
                                </div>

                                <div>
                                    <span>
                                        Horas académicas
                                    </span>

                                    <strong>
                                        {courses.reduce(
                                            (total, course) =>
                                                total +
                                                Number(course.hours || 0),
                                            0
                                        )}
                                    </strong>
                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    🎓
                                </div>

                                <div>
                                    <span>
                                        Créditos
                                    </span>

                                    <strong>
                                        {courses.reduce(
                                            (total, course) =>
                                                total +
                                                Number(course.credits || 0),
                                            0
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </section>

                )}

            </main>

        </div>
    );
}

export default DocenteCourses;

