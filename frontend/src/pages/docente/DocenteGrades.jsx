import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function DocenteGrades() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [grades, setGrades] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [editingGrade, setEditingGrade] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);

    const [form, setForm] = useState({
        enrollment_id: "",
        assessment_type: "",
        score: "",
        assessment_date: "",
        comments: "",
    });

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

            const [gradesResponse, enrollmentsResponse] =
                await Promise.all([
                    api.get("/grades"),
                    api.get("/enrollments"),
                ]);

            setGrades(getArray(gradesResponse.data));
            setEnrollments(getArray(enrollmentsResponse.data));
        } catch (err) {
            console.error("Error cargando calificaciones:", err);

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar las calificaciones."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm({
            enrollment_id: "",
            assessment_type: "",
            score: "",
            assessment_date: "",
            comments: "",
        });

        setEditingGrade(null);
        setShowForm(false);
    };

    const handleNewGrade = () => {
        resetForm();

        setError("");
        setSuccess("");
        setShowDetails(false);

        setShowForm(true);
    };

    const handleEdit = (grade) => {
        setEditingGrade(grade);

        setForm({
            enrollment_id: grade.enrollment_id || "",
            assessment_type: grade.assessment_type || "",
            score: grade.score ?? "",
            assessment_date: grade.assessment_date
                ? grade.assessment_date.substring(0, 10)
                : "",
            comments: grade.comments || "",
        });

        setError("");
        setSuccess("");
        setShowDetails(false);

        setShowForm(true);
    };

    const handleView = async (grade) => {
        try {
            setError("");
            setSuccess("");

            const response = await api.get(
                `/grades/${grade.id}`
            );

            setSelectedGrade(response.data);
            setShowDetails(true);
            setShowForm(false);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo obtener la calificación."
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const data = {
                enrollment_id: Number(form.enrollment_id),
                assessment_type: form.assessment_type,
                score: Number(form.score),
                assessment_date: form.assessment_date,
                comments: form.comments || null,
            };

            if (editingGrade) {
                await api.put(
                    `/grades/${editingGrade.id}`,
                    data
                );

                setSuccess(
                    "Calificación actualizada correctamente."
                );
            } else {
                await api.post("/grades", data);

                setSuccess(
                    "Calificación creada correctamente."
                );
            }

            resetForm();

            await loadData();
        } catch (err) {
            console.error(
                "Error guardando calificación:",
                err
            );

            if (err.response?.status === 422) {
                const validationErrors =
                    err.response?.data?.errors;

                if (validationErrors) {
                    const messages =
                        Object.values(
                            validationErrors
                        ).flat();

                    setError(messages.join(" "));
                } else {
                    setError(
                        err.response?.data?.message ||
                        "Los datos enviados no son válidos."
                    );
                }
            } else {
                setError(
                    err.response?.data?.message ||
                    "No se pudo guardar la calificación."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (grade) => {
        const studentName =
            grade.enrollment?.student?.user?.name ||
            "este estudiante";

        const courseName =
            grade.enrollment?.course?.name ||
            "este curso";

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar la nota de ${studentName} en ${courseName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(`/grades/${grade.id}`);

            setSuccess(
                "Calificación eliminada correctamente."
            );

            await loadData();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo eliminar la calificación."
            );
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

    const getCourseName = (enrollment) => {
        const course = enrollment?.course;

        if (!course) {
            return "—";
        }

        if (course.code) {
            return `${course.code} — ${course.name}`;
        }

        return course.name || "Curso";
    };

    const getScoreClass = (score) => {
        const value = Number(score);

        if (value >= 14) {
            return "grade-good";
        }

        if (value >= 11) {
            return "grade-medium";
        }

        return "grade-low";
    };

    const getAverage = () => {
        if (grades.length === 0) {
            return 0;
        }

        const total = grades.reduce(
            (sum, grade) =>
                sum + Number(grade.score || 0),
            0
        );

        return (total / grades.length).toFixed(2);
    };

    return (
        <div className="admin-dashboard">

            <header className="admin-header">

                <div>
                    <h1>EduFlow AI</h1>

                    <p>
                        Gestión de calificaciones
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

                <section className="welcome-section">

                    <div>
                        <h2>
                            Calificaciones
                        </h2>

                        <p>
                            Administra las calificaciones
                            de los estudiantes de tus cursos.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={handleNewGrade}
                    >
                        + Nueva nota
                    </button>

                </section>

                <div className="dashboard-actions">

                    <button
                        className="secondary-button"
                        onClick={() =>
                            navigate("/docente")
                        }
                    >
                        ← Volver al dashboard
                    </button>

                </div>

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="dashboard-success">
                        {success}
                    </div>
                )}

                <section className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon">
                            📝
                        </div>

                        <div>
                            <span>
                                Calificaciones
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : grades.length}
                            </strong>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon">
                            📊
                        </div>

                        <div>
                            <span>
                                Promedio general
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : getAverage()}
                            </strong>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon">
                            👨‍🎓
                        </div>

                        <div>
                            <span>
                                Matrículas
                            </span>

                            <strong>
                                {loading
                                    ? "..."
                                    : enrollments.length}
                            </strong>
                        </div>

                    </div>

                </section>

                {showForm && (
                    <section className="student-form-card">

                        <h3>
                            {editingGrade
                                ? "Editar calificación"
                                : "Nueva calificación"}
                        </h3>

                        <form onSubmit={handleSubmit}>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Estudiante / Matrícula
                                    </label>

                                    <select
                                        name="enrollment_id"
                                        value={
                                            form.enrollment_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Selecciona una matrícula
                                        </option>

                                        {enrollments.map(
                                            (enrollment) => (
                                                <option
                                                    key={
                                                        enrollment.id
                                                    }
                                                    value={
                                                        enrollment.id
                                                    }
                                                >
                                                    {getStudentName(
                                                        enrollment
                                                    )}{" "}
                                                    —{" "}
                                                    {getCourseName(
                                                        enrollment
                                                    )}{" "}
                                                    —{" "}
                                                    {
                                                        enrollment.academic_period
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                    {enrollments.length ===
                                        0 && (
                                        <small>
                                            No hay matrículas
                                            disponibles.
                                        </small>
                                    )}

                                </div>

                                <div className="form-group">

                                    <label>
                                        Tipo de evaluación
                                    </label>

                                    <input
                                        type="text"
                                        name="assessment_type"
                                        value={
                                            form.assessment_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ejemplo: Examen Parcial"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Nota
                                    </label>

                                    <input
                                        type="number"
                                        name="score"
                                        value={form.score}
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        max="20"
                                        step="0.01"
                                        placeholder="0 - 20"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Fecha de evaluación
                                    </label>

                                    <input
                                        type="date"
                                        name="assessment_date"
                                        value={
                                            form.assessment_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Comentarios
                                    </label>

                                    <textarea
                                        name="comments"
                                        value={
                                            form.comments
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Comentarios sobre la evaluación"
                                        rows="4"
                                    />

                                </div>

                            </div>

                            <div className="form-actions">

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Guardando..."
                                        : editingGrade
                                            ? "Actualizar nota"
                                            : "Crear nota"}
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={resetForm}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </form>

                    </section>
                )}

                {showDetails &&
                    selectedGrade && (
                        <section className="student-form-card">

                            <div className="table-header">

                                <div>
                                    <h3>
                                        Detalle de calificación
                                    </h3>
                                </div>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        setShowDetails(
                                            false
                                        )
                                    }
                                >
                                    Cerrar
                                </button>

                            </div>

                            <div className="form-grid">

                                <div>
                                    <strong>
                                        Estudiante
                                    </strong>

                                    <p>
                                        {getStudentName(
                                            selectedGrade.enrollment
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Curso
                                    </strong>

                                    <p>
                                        {getCourseName(
                                            selectedGrade.enrollment
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Evaluación
                                    </strong>

                                    <p>
                                        {
                                            selectedGrade.assessment_type
                                        }
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Nota
                                    </strong>

                                    <p
                                        className={
                                            getScoreClass(
                                                selectedGrade.score
                                            )
                                        }
                                    >
                                        {
                                            selectedGrade.score
                                        }
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Fecha
                                    </strong>

                                    <p>
                                        {selectedGrade.assessment_date
                                            ? selectedGrade.assessment_date.substring(
                                                0,
                                                10
                                            )
                                            : "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Comentarios
                                    </strong>

                                    <p>
                                        {
                                            selectedGrade.comments ||
                                            "Sin comentarios"
                                        }
                                    </p>
                                </div>

                            </div>

                        </section>
                    )}

                <section className="table-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Mis calificaciones
                            </h3>

                            <span>
                                {grades.length} calificaciones
                            </span>

                        </div>

                    </div>

                    {loading ? (

                        <div className="loading-message">
                            Cargando calificaciones...
                        </div>

                    ) : grades.length === 0 ? (

                        <div className="empty-message">
                            No hay calificaciones registradas.
                        </div>

                    ) : (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>ID</th>
                                        <th>Estudiante</th>
                                        <th>Curso</th>
                                        <th>Evaluación</th>
                                        <th>Nota</th>
                                        <th>Fecha</th>
                                        <th>Acciones</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {grades.map((grade) => (

                                        <tr key={grade.id}>

                                            <td>
                                                {grade.id}
                                            </td>

                                            <td>
                                                <strong>
                                                    {getStudentName(
                                                        grade.enrollment
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {getCourseName(
                                                    grade.enrollment
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    grade.assessment_type
                                                }
                                            </td>

                                            <td>

                                                <strong
                                                    className={getScoreClass(
                                                        grade.score
                                                    )}
                                                >
                                                    {grade.score}
                                                </strong>

                                            </td>

                                            <td>
                                                {grade.assessment_date
                                                    ? grade.assessment_date.substring(
                                                        0,
                                                        10
                                                    )
                                                    : "—"}
                                            </td>

                                            <td>

                                                <div className="table-actions">

                                                    <button
                                                        className="view-button"
                                                        onClick={() =>
                                                            handleView(
                                                                grade
                                                            )
                                                        }
                                                    >
                                                        Ver
                                                    </button>

                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                grade
                                                            )
                                                        }
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                grade
                                                            )
                                                        }
                                                    >
                                                        Eliminar
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default DocenteGrades;

