import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Attendances() {
    const { user, logout } = useAuth();

    const [attendances, setAttendances] = useState([]);
    const [enrollments, setEnrollments] = useState([]);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalAttendances, setTotalAttendances] = useState(0);

    const perPage = 50;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [editingAttendance, setEditingAttendance] = useState(null);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    const [form, setForm] = useState({
        enrollment_id: "",
        attendance_date: "",
        status: "present",
        justification: "",
    });

    /*
     * =====================================================
     * CARGA INICIAL
     * =====================================================
     */

    useEffect(() => {
        loadAttendances(1, "");
    }, []);

    /*
     * =====================================================
     * CARGAR ASISTENCIAS
     * =====================================================
     */

    const loadAttendances = async (
        page = 1,
        searchTerm = ""
    ) => {
        try {
            setLoading(true);
            setError("");

            const cleanSearch = searchTerm.trim();

            console.log("=================================");
            console.log("CARGANDO ASISTENCIAS");
            console.log("Página:", page);
            console.log("Búsqueda:", cleanSearch);
            console.log("=================================");

            const response = await api.get(
                "/attendances",
                {
                    params: {
                        page,
                        search: cleanSearch,
                        per_page: perPage,
                    },
                }
            );

            const pagination = response.data;

            console.log(
                "RESPUESTA ASISTENCIAS:",
                pagination
            );

            /*
             * Si Laravel devuelve paginación.
             */

            if (
                pagination &&
                Array.isArray(pagination.data)
            ) {
                setAttendances(pagination.data);

                setCurrentPage(
                    Number(
                        pagination.current_page
                    ) || 1
                );

                setLastPage(
                    Number(
                        pagination.last_page
                    ) || 1
                );

                setTotalAttendances(
                    Number(
                        pagination.total
                    ) || 0
                );

                return;
            }

            /*
             * Compatibilidad por si el backend
             * devuelve directamente un array.
             */

            if (Array.isArray(pagination)) {
                setAttendances(pagination);
                setCurrentPage(1);
                setLastPage(1);
                setTotalAttendances(
                    pagination.length
                );

                return;
            }

            setAttendances([]);
            setCurrentPage(1);
            setLastPage(1);
            setTotalAttendances(0);

        } catch (err) {
            console.error(
                "Error cargando asistencias:",
                err
            );

            console.error(
                "Respuesta:",
                err.response?.data
            );

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar las asistencias."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * =====================================================
     * CARGAR MATRÍCULAS
     * =====================================================
     *
     * Se cargan para poder registrar una asistencia.
     */

    const loadEnrollments = async () => {
        try {
            const response = await api.get(
                "/enrollments",
                {
                    params: {
                        per_page: 100,
                    },
                }
            );

            const data = response.data;

            if (
                data &&
                Array.isArray(data.data)
            ) {
                setEnrollments(data.data);
            } else if (
                Array.isArray(data)
            ) {
                setEnrollments(data);
            } else {
                setEnrollments([]);
            }

        } catch (err) {
            console.error(
                "Error cargando matrículas:",
                err
            );

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar las matrículas."
            );
        }
    };

    /*
     * =====================================================
     * CAMBIAR PÁGINA
     * =====================================================
     */

    const handlePageChange = (page) => {
        const selectedPage = Number(page);

        console.log(
            "CLICK PAGINACIÓN:",
            selectedPage
        );

        if (
            selectedPage < 1 ||
            selectedPage > lastPage ||
            selectedPage === currentPage
        ) {
            return;
        }

        loadAttendances(
            selectedPage,
            search
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /*
     * =====================================================
     * GENERAR PÁGINAS
     * =====================================================
     */

    const getPaginationPages = () => {
        const pages = [];

        if (lastPage <= 1) {
            return pages;
        }

        if (lastPage <= 7) {
            for (
                let i = 1;
                i <= lastPage;
                i++
            ) {
                pages.push(i);
            }

            return pages;
        }

        if (currentPage <= 4) {
            pages.push(
                1,
                2,
                3,
                4,
                5,
                "...",
                lastPage
            );

            return pages;
        }

        if (
            currentPage >=
            lastPage - 3
        ) {
            pages.push(
                1,
                "...",
                lastPage - 4,
                lastPage - 3,
                lastPage - 2,
                lastPage - 1,
                lastPage
            );

            return pages;
        }

        pages.push(
            1,
            "...",
            currentPage - 1,
            currentPage,
            currentPage + 1,
            "...",
            lastPage
        );

        return pages;
    };

    /*
     * =====================================================
     * FORMULARIO
     * =====================================================
     */

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm({
            enrollment_id: "",
            attendance_date: "",
            status: "present",
            justification: "",
        });

        setEditingAttendance(null);
        setShowForm(false);
    };

    /*
     * =====================================================
     * NUEVA ASISTENCIA
     * =====================================================
     */

    const handleNewAttendance = async () => {
        resetForm();

        setError("");
        setSuccess("");
        setShowDetails(false);

        await loadEnrollments();

        setShowForm(true);
    };

    /*
     * =====================================================
     * EDITAR
     * =====================================================
     */

    const handleEdit = async (attendance) => {
        setEditingAttendance(attendance);

        setForm({
            enrollment_id:
                attendance.enrollment_id || "",

            attendance_date:
                attendance.attendance_date
                    ? attendance.attendance_date.substring(
                          0,
                          10
                      )
                    : "",

            status:
                attendance.status ||
                "present",

            justification:
                attendance.justification ||
                "",
        });

        setError("");
        setSuccess("");
        setShowDetails(false);

        await loadEnrollments();

        setShowForm(true);
    };

    /*
     * =====================================================
     * VER
     * =====================================================
     */

    const handleView = async (
        attendance
    ) => {
        try {
            setError("");
            setSuccess("");

            const response =
                await api.get(
                    `/attendances/${attendance.id}`
                );

            setSelectedAttendance(
                response.data
            );

            setShowDetails(true);
            setShowForm(false);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo obtener la asistencia."
            );
        }
    };

    /*
     * =====================================================
     * GUARDAR
     * =====================================================
     */

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const data = {
                enrollment_id:
                    Number(
                        form.enrollment_id
                    ),

                attendance_date:
                    form.attendance_date,

                status:
                    form.status,

                justification:
                    form.justification?.trim() ||
                    null,
            };

            if (editingAttendance) {
                await api.put(
                    `/attendances/${editingAttendance.id}`,
                    data
                );

                setSuccess(
                    "Asistencia actualizada correctamente."
                );
            } else {
                await api.post(
                    "/attendances",
                    data
                );

                setSuccess(
                    "Asistencia registrada correctamente."
                );
            }

            resetForm();

            await loadAttendances(
                currentPage,
                search
            );

        } catch (err) {
            console.error(
                "Error guardando asistencia:",
                err
            );

            if (
                err.response?.status === 422
            ) {
                const validationErrors =
                    err.response?.data?.errors;

                if (validationErrors) {
                    const messages =
                        Object.values(
                            validationErrors
                        ).flat();

                    setError(
                        messages.join(" ")
                    );
                } else {
                    setError(
                        err.response?.data?.message ||
                        "Los datos enviados no son válidos."
                    );
                }
            } else {
                setError(
                    err.response?.data?.message ||
                    "No se pudo guardar la asistencia."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    /*
     * =====================================================
     * ELIMINAR
     * =====================================================
     */

    const handleDelete = async (
        attendance
    ) => {
        const studentName =
            attendance.enrollment
                ?.student
                ?.user
                ?.name ||
            "este estudiante";

        const courseName =
            attendance.enrollment
                ?.course
                ?.name ||
            "este curso";

        const confirmed =
            window.confirm(
                `¿Estás seguro de eliminar la asistencia de ${studentName} en ${courseName}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/attendances/${attendance.id}`
            );

            setSuccess(
                "Asistencia eliminada correctamente."
            );

            /*
             * Si eliminamos el último registro
             * de la página, retrocedemos.
             */

            if (
                attendances.length === 1 &&
                currentPage > 1
            ) {
                await loadAttendances(
                    currentPage - 1,
                    search
                );
            } else {
                await loadAttendances(
                    currentPage,
                    search
                );
            }

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo eliminar la asistencia."
            );
        }
    };

    /*
     * =====================================================
     * LOGOUT
     * =====================================================
     */

    const handleLogout = async () => {
        await logout();
    };

    /*
     * =====================================================
     * HELPERS
     * =====================================================
     */

    const getStudentName = (
        enrollment
    ) => {
        return (
            enrollment?.student?.user?.name ||
            enrollment?.student?.name ||
            "Estudiante"
        );
    };

    const getStudentEmail = (
        enrollment
    ) => {
        return (
            enrollment?.student?.user?.email ||
            ""
        );
    };

    const getCourseName = (
        enrollment
    ) => {
        const course =
            enrollment?.course;

        if (!course) {
            return "—";
        }

        if (course.code) {
            return `${course.code} — ${course.name}`;
        }

        return (
            course.name ||
            "Curso"
        );
    };

    const getTeacherName = (
        enrollment
    ) => {
        return (
            enrollment?.course?.teacher
                ?.user?.name ||
            enrollment?.course?.teacher
                ?.name ||
            "Sin docente"
        );
    };

    const getStatusLabel = (
        status
    ) => {
        switch (status) {
            case "present":
                return "Presente";

            case "absent":
                return "Falta";

            case "late":
                return "Tardanza";

            case "justified":
                return "Justificada";

            default:
                return status || "—";
        }
    };

    const getStatusClass = (
        status
    ) => {
        switch (status) {
            case "present":
                return "grade-good";

            case "late":
                return "grade-medium";

            case "absent":
                return "grade-low";

            case "justified":
                return "grade-medium";

            default:
                return "";
        }
    };

    const paginationPages =
        getPaginationPages();

    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    return (
        <div className="admin-dashboard">

            {/* HEADER */}

            <header className="admin-header">

                <div>
                    <h1>
                        EduFlow AI
                    </h1>

                    <p>
                        Gestión de asistencias
                    </p>
                </div>

                <div className="admin-user">

                    <span>
                        {user?.name ||
                            "Administrador"}
                    </span>

                    <button
                        onClick={
                            handleLogout
                        }
                    >
                        Cerrar sesión
                    </button>

                </div>

            </header>

            {/* CONTENIDO */}

            <main className="admin-content">

                {/* BIENVENIDA */}

                <section className="welcome-section">

                    <div>

                        <h2>
                            Asistencias
                        </h2>

                        <p>
                            Administra la
                            asistencia de los
                            estudiantes.
                        </p>

                    </div>

                    <button
                        className="primary-button"
                        onClick={
                            handleNewAttendance
                        }
                    >
                        + Nueva asistencia
                    </button>

                </section>

                {/* MENSAJES */}

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

                {/* FORMULARIO */}

                {showForm && (
                    <section className="student-form-card">

                        <h3>
                            {editingAttendance
                                ? "Editar asistencia"
                                : "Nueva asistencia"}
                        </h3>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="form-grid">

                                {/* MATRÍCULA */}

                                <div className="form-group">

                                    <label>
                                        Matrícula
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
                                            (
                                                enrollment
                                            ) => (
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
                                                    )}
                                                    {" — "}
                                                    {getCourseName(
                                                        enrollment
                                                    )}
                                                    {" — "}
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
                                            No hay
                                            matrículas
                                            disponibles.
                                        </small>
                                    )}

                                </div>

                                {/* FECHA */}

                                <div className="form-group">

                                    <label>
                                        Fecha de asistencia
                                    </label>

                                    <input
                                        type="date"
                                        name="attendance_date"
                                        value={
                                            form.attendance_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                                {/* ESTADO */}

                                <div className="form-group">

                                    <label>
                                        Estado
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            form.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="present">
                                            Presente
                                        </option>

                                        <option value="absent">
                                            Falta
                                        </option>

                                        <option value="late">
                                            Tardanza
                                        </option>

                                        <option value="justified">
                                            Justificada
                                        </option>

                                    </select>

                                </div>

                                {/* JUSTIFICACIÓN */}

                                <div className="form-group">

                                    <label>
                                        Justificación
                                    </label>

                                    <textarea
                                        name="justification"
                                        value={
                                            form.justification
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Motivo de la justificación"
                                        rows="4"
                                    />

                                </div>

                            </div>

                            <div className="form-actions">

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Guardando..."
                                        : editingAttendance
                                        ? "Actualizar asistencia"
                                        : "Registrar asistencia"}
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={
                                        resetForm
                                    }
                                >
                                    Cancelar
                                </button>

                            </div>

                        </form>

                    </section>
                )}

                {/* DETALLE */}

                {showDetails &&
                    selectedAttendance && (
                        <section className="student-form-card">

                            <div className="table-header">

                                <h3>
                                    Detalle de asistencia
                                </h3>

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
                                            selectedAttendance.enrollment
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Correo
                                    </strong>

                                    <p>
                                        {getStudentEmail(
                                            selectedAttendance.enrollment
                                        ) ||
                                            "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Curso
                                    </strong>

                                    <p>
                                        {getCourseName(
                                            selectedAttendance.enrollment
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Docente
                                    </strong>

                                    <p>
                                        {getTeacherName(
                                            selectedAttendance.enrollment
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Fecha
                                    </strong>

                                    <p>
                                        {selectedAttendance.attendance_date
                                            ? selectedAttendance.attendance_date.substring(
                                                  0,
                                                  10
                                              )
                                            : "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Estado
                                    </strong>

                                    <p
                                        className={getStatusClass(
                                            selectedAttendance.status
                                        )}
                                    >
                                        {getStatusLabel(
                                            selectedAttendance.status
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Justificación
                                    </strong>

                                    <p>
                                        {selectedAttendance.justification ||
                                            "Sin justificación"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        ID
                                    </strong>

                                    <p>
                                        {
                                            selectedAttendance.id
                                        }
                                    </p>
                                </div>

                            </div>

                        </section>
                    )}

                {/* TABLA */}

                <section className="table-card">

                    {/* BUSCADOR */}

                    <div className="search-container">

                        <input
                            type="text"
                            placeholder="Buscar estudiante, curso, docente o estado..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {

                                if (
                                    e.key ===
                                    "Enter"
                                ) {
                                    e.preventDefault();

                                    const value =
                                        e.currentTarget.value.trim();

                                    setCurrentPage(
                                        1
                                    );

                                    loadAttendances(
                                        1,
                                        value
                                    );
                                }

                            }}
                        />

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {

                                const value =
                                    search.trim();

                                setCurrentPage(
                                    1
                                );

                                loadAttendances(
                                    1,
                                    value
                                );

                            }}
                        >
                            Buscar
                        </button>

                        {search.trim() !==
                            "" && (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {

                                    setSearch(
                                        ""
                                    );

                                    setCurrentPage(
                                        1
                                    );

                                    loadAttendances(
                                        1,
                                        ""
                                    );

                                }}
                            >
                                Limpiar
                            </button>
                        )}

                    </div>

                    {/* HEADER */}

                    <div className="table-header">

                        <div>

                            <h3>
                                Lista de asistencias
                            </h3>

                            <span>
                                {
                                    totalAttendances
                                }{" "}
                                registros en
                                total
                            </span>

                        </div>

                    </div>

                    {/* LOADING */}

                    {loading ? (

                        <div className="loading-message">
                            Cargando asistencias...
                        </div>

                    ) : attendances.length ===
                      0 ? (

                        <div className="empty-message">
                            No hay asistencias
                            registradas.
                        </div>

                    ) : (

                        <>

                            {/* TABLA */}

                            <div className="table-container">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                ID
                                            </th>

                                            <th>
                                                Estudiante
                                            </th>

                                            <th>
                                                Curso
                                            </th>

                                            <th>
                                                Docente
                                            </th>

                                            <th>
                                                Fecha
                                            </th>

                                            <th>
                                                Estado
                                            </th>

                                            <th>
                                                Acciones
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {attendances.map(
                                            (
                                                attendance
                                            ) => (

                                                <tr
                                                    key={
                                                        attendance.id
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            attendance.id
                                                        }
                                                    </td>

                                                    <td>
                                                        {getStudentName(
                                                            attendance.enrollment
                                                        )}
                                                    </td>

                                                    <td>
                                                        {getCourseName(
                                                            attendance.enrollment
                                                        )}
                                                    </td>

                                                    <td>
                                                        {getTeacherName(
                                                            attendance.enrollment
                                                        )}
                                                    </td>

                                                    <td>
                                                        {attendance.attendance_date
                                                            ? attendance.attendance_date.substring(
                                                                  0,
                                                                  10
                                                              )
                                                            : "—"}
                                                    </td>

                                                    <td>

                                                        <strong
                                                            className={getStatusClass(
                                                                attendance.status
                                                            )}
                                                        >
                                                            {getStatusLabel(
                                                                attendance.status
                                                            )}
                                                        </strong>

                                                    </td>

                                                    <td>

                                                        <div className="table-actions">

                                                            <button
                                                                className="view-button"
                                                                onClick={() =>
                                                                    handleView(
                                                                        attendance
                                                                    )
                                                                }
                                                            >
                                                                Ver
                                                            </button>

                                                            <button
                                                                className="edit-button"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        attendance
                                                                    )
                                                                }
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        attendance
                                                                    )
                                                                }
                                                            >
                                                                Eliminar
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* PAGINACIÓN */}

                            {lastPage >
                                1 && (
                                <div className="pagination-wrapper">

                                    <div className="pagination-container">

                                        <button
                                            className="pagination-button"
                                            disabled={
                                                currentPage <=
                                                1
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    currentPage -
                                                        1
                                                )
                                            }
                                        >
                                            ←
                                        </button>

                                        {paginationPages.map(
                                            (
                                                page,
                                                index
                                            ) => {

                                                if (
                                                    page ===
                                                    "..."
                                                ) {
                                                    return (
                                                        <span
                                                            key={`dots-${index}`}
                                                            className="pagination-dots"
                                                        >
                                                            ...
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={`page-${page}`}
                                                        className={`pagination-button ${
                                                            currentPage ===
                                                            page
                                                                ? "active"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handlePageChange(
                                                                page
                                                            )
                                                        }
                                                    >
                                                        {
                                                            page
                                                        }
                                                    </button>
                                                );
                                            }
                                        )}

                                        <button
                                            className="pagination-button"
                                            disabled={
                                                currentPage >=
                                                lastPage
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    currentPage +
                                                        1
                                                )
                                            }
                                        >
                                            →
                                        </button>

                                    </div>

                                    <div className="pagination-info">

                                        Página{" "}
                                        <strong>
                                            {
                                                currentPage
                                            }
                                        </strong>{" "}
                                        de{" "}
                                        <strong>
                                            {
                                                lastPage
                                            }
                                        </strong>

                                        {" · "}

                                        Mostrando{" "}
                                        <strong>
                                            {
                                                attendances.length
                                            }
                                        </strong>{" "}
                                        de{" "}
                                        <strong>
                                            {
                                                totalAttendances
                                            }
                                        </strong>{" "}
                                        asistencias

                                        {" · "}

                                        <strong>
                                            {
                                                perPage
                                            }
                                        </strong>{" "}
                                        por página

                                    </div>

                                </div>
                            )}

                        </>

                    )}

                </section>

            </main>

        </div>
    );
}

export default Attendances;