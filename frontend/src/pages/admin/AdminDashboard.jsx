import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        courses: 0,
        enrollments: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    studentsResponse,
                    teachersResponse,
                    coursesResponse,
                    enrollmentsResponse,
                ] = await Promise.all([
                    api.get("/students"),
                    api.get("/teachers"),
                    api.get("/courses"),
                    api.get("/enrollments"),
                ]);

                setStats({
                    students: getCount(studentsResponse.data),
                    teachers: getCount(teachersResponse.data),
                    courses: getCount(coursesResponse.data),
                    enrollments: getCount(enrollmentsResponse.data),
                });
            } catch (err) {
                console.error("Error cargando dashboard:", err);

                setError(
                    err.response?.data?.message ||
                    "No se pudieron cargar los datos del dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const getCount = (data) => {
        if (Array.isArray(data)) {
            return data.length;
        }

        if (Array.isArray(data?.data)) {
            return data.data.length;
        }

        return 0;
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>EduFlow AI</h1>
                    <p>Panel de Administrador</p>
                </div>

                <div className="admin-user">
                    <span>
                        {user?.name || "Administrador"}
                    </span>

                    <button onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main className="admin-content">
                <section className="welcome-section">
                    <h2>
                        Bienvenido,{" "}
                        {user?.name || "Administrador"}
                    </h2>

                    <p>
                        Desde este panel puedes administrar la
                        plataforma educativa.
                    </p>
                </section>

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🎓</div>

                        <div>
                            <span>Estudiantes</span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.students}
                            </strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">👨‍🏫</div>

                        <div>
                            <span>Docentes</span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.teachers}
                            </strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📚</div>

                        <div>
                            <span>Cursos</span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.courses}
                            </strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📝</div>

                        <div>
                            <span>Matrículas</span>

                            <strong>
                                {loading
                                    ? "..."
                                    : stats.enrollments}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="admin-modules">
                    <h2>Administración</h2>

                    <div className="modules-grid">
                        <button
                            className="module-card"
                            onClick={() =>
                                navigate("/admin/students")
                            }
                        >
                            <span>🎓</span>

                            <strong>
                                Estudiantes
                            </strong>

                            <small>
                                Gestionar estudiantes
                            </small>
                        </button>

                        <button className="module-card">
                            <span>👨‍🏫</span>

                            <strong>
                                Docentes
                            </strong>

                            <small>
                                Gestionar docentes
                            </small>
                        </button>

                        <button className="module-card">
                            <span>📚</span>

                            <strong>
                                Cursos
                            </strong>

                            <small>
                                Gestionar cursos
                            </small>
                        </button>

                        <button className="module-card">
                            <span>📝</span>

                            <strong>
                                Matrículas
                            </strong>

                            <small>
                                Gestionar matrículas
                            </small>
                        </button>

                        <button className="module-card">
                            <span>📊</span>

                            <strong>
                                Notas
                            </strong>

                            <small>
                                Gestionar calificaciones
                            </small>
                        </button>

                        <button className="module-card">
                            <span>📅</span>

                            <strong>
                                Asistencias
                            </strong>

                            <small>
                                Gestionar asistencias
                            </small>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;