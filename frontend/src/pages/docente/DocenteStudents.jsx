import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function DocenteStudents() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadStudents();
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

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/enrollments");

            const enrollments = getArray(response.data);

            /*
             * Cada matrícula contiene información del estudiante
             * y del curso.
             *
             * Ejemplo esperado:
             *
             * enrollment.student.user.name
             * enrollment.student.user.email
             * enrollment.student.student_code
             * enrollment.student.career
             * enrollment.course.name
             */

            setStudents(enrollments);

        } catch (err) {
            console.error(
                "Error cargando estudiantes del docente:",
                err
            );

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar los estudiantes."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const getStudentName = (enrollment) => {
        return (
            enrollment?.student?.user?.name ||
            enrollment?.student?.name ||
            "Estudiante"
        );
    };

    const getStudentEmail = (enrollment) => {
        return (
            enrollment?.student?.user?.email ||
            enrollment?.student?.email ||
            "—"
        );
    };

    const getStudentCode = (enrollment) => {
        return (
            enrollment?.student?.student_code ||
            enrollment?.student_code ||
            "—"
        );
    };

    const getCourseName = (enrollment) => {
        return (
            enrollment?.course?.name ||
            "Curso"
        );
    };

    const getCourseCode = (enrollment) => {
        return (
            enrollment?.course?.code ||
            "—"
        );
    };

    const getCareer = (enrollment) => {
        return (
            enrollment?.student?.career ||
            "—"
        );
    };

    const getAcademicPeriod = (enrollment) => {
        return (
            enrollment?.academic_period ||
            enrollment?.period ||
            "—"
        );
    };

    const getStatus = (enrollment) => {
        return (
            enrollment?.status ||
            "Activo"
        );
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

    /*
     * Filtrado por:
     * - nombre
     * - código
     * - correo
     * - curso
     * - código de curso
     */
    const filteredStudents = students.filter((enrollment) => {
        const searchText = search.toLowerCase().trim();

        if (!searchText) {
            return true;
        }

        const name = getStudentName(enrollment).toLowerCase();
        const code = getStudentCode(enrollment).toLowerCase();
        const email = getStudentEmail(enrollment).toLowerCase();
        const course = getCourseName(enrollment).toLowerCase();
        const courseCode = getCourseCode(enrollment).toLowerCase();

        return (
            name.includes(searchText) ||
            code.includes(searchText) ||
            email.includes(searchText) ||
            course.includes(searchText) ||
            courseCode.includes(searchText)
        );
    });

    /*
     * Cantidad de estudiantes únicos
     */
    const uniqueStudentIds = new Set(
        students
            .map(
                (enrollment) =>
                    enrollment?.student_id ||
                    enrollment?.student?.id
            )
            .filter(Boolean)
    );

    const uniqueStudents = uniqueStudentIds.size;

    return (
        <div className="admin-dashboard">

            {/* =========================
                HEADER
            ========================== */}

            <header className="admin-header">

                <div>

                    <h1>
                        EduFlow AI
                    </h1>

                    <p>
                        Mis estudiantes
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

                {/* =========================
                    CABECERA
                ========================== */}

                <section className="welcome-section">

                    <div>

                        <span className="welcome-label">
                            GESTIÓN ACADÉMICA
                        </span>

                        <h2>
                            Mis estudiantes 👨‍🎓
                        </h2>

                        <p>
                            Consulta los estudiantes matriculados
                            en tus cursos y revisa su información
                            académica.
                        </p>

                    </div>

                    <div className="welcome-info">

                        <span>
                            Docente
                        </span>

                        <strong>
                            {user?.name || "Docente"}
                        </strong>

                    </div>

                </section>


                {/* =========================
                    ERROR
                ========================== */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {/* =========================
                    ESTADÍSTICAS
                ========================== */}

                <section className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon">
                            👨‍🎓
                        </div>

                        <div>

                            <span>
                                Estudiantes únicos
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : uniqueStudents}
                            </strong>

                            <small>
                                Estudiantes a tu cargo
                            </small>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            📚
                        </div>

                        <div>

                            <span>
                                Matrículas
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : students.length}
                            </strong>

                            <small>
                                Matrículas en tus cursos
                            </small>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon">
                            🔎
                        </div>

                        <div>

                            <span>
                                Resultados
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : filteredStudents.length}
                            </strong>

                            <small>
                                Coincidencias encontradas
                            </small>

                        </div>

                    </div>

                </section>


                {/* =========================
                    TABLA
                ========================== */}

                <section className="table-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Estudiantes de mis cursos
                            </h3>

                            <span>
                                Lista de estudiantes matriculados
                            </span>

                        </div>

                        <button
                            className="secondary-button"
                            onClick={() =>
                                navigate("/docente")
                            }
                        >
                            ← Volver al panel
                        </button>

                    </div>


                    {/* =========================
                        BUSCADOR
                    ========================== */}

                    <div
                        style={{
                            padding: "20px",
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >

                        <div
                            style={{
                                flex: "1",
                                minWidth: "260px",
                            }}
                        >

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Buscar por nombre, código, correo o curso..."
                                style={{
                                    width: "100%",
                                    padding: "12px 15px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    fontSize: "14px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />

                        </div>

                        {search && (

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                Limpiar
                            </button>

                        )}

                    </div>


                    {/* =========================
                        CONTENIDO
                    ========================== */}

                    {loading ? (

                        <div className="loading-message">
                            Cargando estudiantes...
                        </div>

                    ) : filteredStudents.length === 0 ? (

                        <div className="empty-message">

                            {search
                                ? "No se encontraron estudiantes con esa búsqueda."
                                : "No tienes estudiantes matriculados en tus cursos."}

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
                                            Curso
                                        </th>

                                        <th>
                                            Código curso
                                        </th>

                                        <th>
                                            Periodo
                                        </th>

                                        <th>
                                            Estado
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredStudents.map(
                                        (enrollment) => (

                                            <tr
                                                key={
                                                    enrollment.id
                                                }
                                            >

                                                {/* CÓDIGO */}

                                                <td>
                                                    <strong>
                                                        {getStudentCode(
                                                            enrollment
                                                        )}
                                                    </strong>
                                                </td>


                                                {/* ESTUDIANTE */}

                                                <td>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                        }}
                                                    >

                                                        <div
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                background: "#eef2ff",
                                                                fontWeight: "600",
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {getInitials(
                                                                getStudentName(
                                                                    enrollment
                                                                )
                                                            )}
                                                        </div>

                                                        <strong>
                                                            {
                                                                getStudentName(
                                                                    enrollment
                                                                )
                                                            }
                                                        </strong>

                                                    </div>

                                                </td>


                                                {/* CORREO */}

                                                <td>
                                                    {getStudentEmail(
                                                        enrollment
                                                    )}
                                                </td>


                                                {/* CURSO */}

                                                <td>
                                                    <strong>
                                                        {getCourseName(
                                                            enrollment
                                                        )}
                                                    </strong>
                                                </td>


                                                {/* CÓDIGO CURSO */}

                                                <td>
                                                    {getCourseCode(
                                                        enrollment
                                                    )}
                                                </td>


                                                {/* PERIODO */}

                                                <td>
                                                    {getAcademicPeriod(
                                                        enrollment
                                                    )}
                                                </td>


                                                {/* ESTADO */}

                                                <td>

                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "5px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            background:
                                                                getStatus(
                                                                    enrollment
                                                                )
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        "activo"
                                                                    )
                                                                    ? "#dcfce7"
                                                                    : "#f3f4f6",
                                                            color:
                                                                getStatus(
                                                                    enrollment
                                                                )
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        "activo"
                                                                    )
                                                                    ? "#166534"
                                                                    : "#374151",
                                                        }}
                                                    >
                                                        {getStatus(
                                                            enrollment
                                                        )}
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =========================
                    INFORMACIÓN
                ========================== */}

                <section className="dashboard-footer-card">

                    <div>

                        <strong>
                            EduFlow AI
                        </strong>

                        <span>
                            Gestión inteligente de estudiantes
                        </span>

                    </div>

                    <div className="dashboard-footer-stats">

                        <span>
                            Estudiantes{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : uniqueStudents}
                            </strong>
                        </span>

                        <span>
                            Matrículas{" "}
                            <strong>
                                {loading
                                    ? "..."
                                    : students.length}
                            </strong>
                        </span>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default DocenteStudents;

