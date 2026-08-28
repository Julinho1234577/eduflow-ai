import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Courses() {
    const { user, logout } = useAuth();

    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);
    const [perPage, setPerPage] = useState(20);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const [form, setForm] = useState({
        code: "",
        name: "",
        description: "",
        credits: "",
        hours: "",
        active: true,
        teacher_id: "",
    });

    useEffect(() => {
        loadCourses(1, "");
        loadTeachers();
    }, []);

    // ============================================================
    // CARGAR CURSOS
    // ============================================================

    const loadCourses = async (page = 1, searchTerm = search) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/courses", {
                params: {
                    page,
                    search: searchTerm,
                },
            });

            const pagination = response.data;

            console.log("COURSES:", pagination);

            setCourses(
                Array.isArray(pagination.data)
                    ? pagination.data
                    : []
            );

            setCurrentPage(
                pagination.current_page || 1
            );

            setLastPage(
                pagination.last_page || 1
            );

            setTotalCourses(
                pagination.total || 0
            );

            if (pagination.per_page) {
                setPerPage(pagination.per_page);
            }

        } catch (err) {
            console.error(
                "Error cargando cursos:",
                err
            );

            console.error(
                "Respuesta:",
                err.response?.data
            );

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar los cursos."
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // CARGAR DOCENTES
    // ============================================================

    const loadTeachers = async () => {
        try {
            const response = await api.get("/teachers");

            const teachersData = Array.isArray(
                response.data
            )
                ? response.data
                : response.data?.data || [];

            setTeachers(teachersData);

        } catch (err) {
            console.error(
                "Error cargando docentes:",
                err
            );

            setTeachers([]);
        }
    };

    // ============================================================
    // CAMBIAR PÁGINA
    // ============================================================

    const handlePageChange = (page) => {
        const selectedPage = Number(page);

        if (
            selectedPage < 1 ||
            selectedPage > lastPage ||
            selectedPage === currentPage
        ) {
            return;
        }

        loadCourses(
            selectedPage,
            search
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ============================================================
    // BÚSQUEDA
    // ============================================================

    const handleSearch = () => {
        setCurrentPage(1);

        loadCourses(
            1,
            search
        );
    };

    const handleClearSearch = () => {
        setSearch("");
        setCurrentPage(1);

        loadCourses(
            1,
            ""
        );
    };

    // ============================================================
    // CAMBIO FORMULARIO
    // ============================================================

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // ============================================================
    // REINICIAR FORMULARIO
    // ============================================================

    const resetForm = () => {
        setForm({
            code: "",
            name: "",
            description: "",
            credits: "",
            hours: "",
            active: true,
            teacher_id: "",
        });

        setEditingCourse(null);
        setShowForm(false);
    };

    // ============================================================
    // NUEVO CURSO
    // ============================================================

    const handleNewCourse = () => {
        resetForm();

        setError("");
        setSuccess("");

        setSelectedCourse(null);
        setShowDetails(false);

        setShowForm(true);
    };

    // ============================================================
    // EDITAR
    // ============================================================

    const handleEdit = (course) => {
        setEditingCourse(course);

        setForm({
            code: course.code || "",
            name: course.name || "",
            description: course.description || "",
            credits: course.credits ?? "",
            hours: course.hours ?? "",
            active: course.active ?? true,
            teacher_id: course.teacher_id || "",
        });

        setError("");
        setSuccess("");

        setShowDetails(false);
        setShowForm(true);
    };

    // ============================================================
    // VER DETALLE
    // ============================================================

    const handleView = async (course) => {
        try {
            setError("");
            setSuccess("");

            const response = await api.get(
                `/courses/${course.id}`
            );

            setSelectedCourse(
                response.data
            );

            setShowDetails(true);
            setShowForm(false);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo obtener el curso."
            );
        }
    };

    // ============================================================
    // GUARDAR
    // ============================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const data = {
                code: form.code,
                name: form.name,
                description:
                    form.description || null,
                credits:
                    Number(form.credits),
                hours:
                    Number(form.hours),
                active:
                    form.active,
                teacher_id:
                    form.teacher_id
                        ? Number(form.teacher_id)
                        : null,
            };

            if (editingCourse) {
                await api.put(
                    `/courses/${editingCourse.id}`,
                    data
                );

                setSuccess(
                    "Curso actualizado correctamente."
                );

            } else {
                await api.post(
                    "/courses",
                    data
                );

                setSuccess(
                    "Curso creado correctamente."
                );
            }

            resetForm();

            await loadCourses(
                currentPage,
                search
            );

        } catch (err) {
            console.error(err);

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
                    "No se pudo guardar el curso."
                );
            }

        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // ELIMINAR
    // ============================================================

    const handleDelete = async (course) => {
        const confirmed =
            window.confirm(
                `¿Estás seguro de eliminar el curso "${course.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/courses/${course.id}`
            );

            setSuccess(
                "Curso eliminado correctamente."
            );

            if (
                courses.length === 1 &&
                currentPage > 1
            ) {
                await loadCourses(
                    currentPage - 1,
                    search
                );
            } else {
                await loadCourses(
                    currentPage,
                    search
                );
            }

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo eliminar el curso."
            );
        }
    };

    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = async () => {
        await logout();
    };

    // ============================================================
    // DOCENTE
    // ============================================================

    const getTeacherName = (course) => {
        if (
            course.teacher?.user?.name
        ) {
            return course.teacher.user.name;
        }

        if (
            course.teacher?.name
        ) {
            return course.teacher.name;
        }

        return "Sin docente";
    };

    // ============================================================
    // PAGINACIÓN
    // ============================================================

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

    const paginationPages =
        getPaginationPages();

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="admin-dashboard">

            {/* HEADER */}

            <header className="admin-header">

                <div>
                    <h1>
                        EduFlow AI
                    </h1>

                    <p>
                        Gestión de cursos
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

            <main className="admin-content">

                {/* TÍTULO */}

                <section className="welcome-section">

                    <div>
                        <h2>
                            Cursos
                        </h2>

                        <p>
                            Administra los cursos
                            de la plataforma educativa.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={
                            handleNewCourse
                        }
                    >
                        + Nuevo curso
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
                            {editingCourse
                                ? "Editar curso"
                                : "Nuevo curso"}
                        </h3>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Código del curso
                                    </label>

                                    <input
                                        type="text"
                                        name="code"
                                        value={
                                            form.code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ej. MAT101"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Nombre del curso
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={
                                            form.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ej. Matemática I"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Créditos
                                    </label>

                                    <input
                                        type="number"
                                        name="credits"
                                        value={
                                            form.credits
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="1"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Horas semanales
                                    </label>

                                    <input
                                        type="number"
                                        name="hours"
                                        value={
                                            form.hours
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="1"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Docente responsable
                                    </label>

                                    <select
                                        name="teacher_id"
                                        value={
                                            form.teacher_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="">
                                            Sin docente asignado
                                        </option>

                                        {teachers.map(
                                            (teacher) => (
                                                <option
                                                    key={
                                                        teacher.id
                                                    }
                                                    value={
                                                        teacher.id
                                                    }
                                                >
                                                    {teacher.user?.name ||
                                                        teacher.name ||
                                                        `Docente #${teacher.id}`}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Estado
                                    </label>

                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginTop: "10px",
                                        }}
                                    >

                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={
                                                form.active
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        Curso activo

                                    </label>

                                </div>

                                <div className="form-group form-full">

                                    <label>
                                        Descripción
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            form.description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="4"
                                        placeholder="Descripción del curso..."
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
                                        : editingCourse
                                            ? "Actualizar curso"
                                            : "Crear curso"}
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
                    selectedCourse && (
                        <section className="student-form-card">

                            <div className="table-header">

                                <h3>
                                    Detalle del curso
                                </h3>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        setShowDetails(false)
                                    }
                                >
                                    Cerrar
                                </button>

                            </div>

                            <div className="form-grid">

                                <div>
                                    <strong>
                                        Código
                                    </strong>

                                    <p>
                                        {selectedCourse.code ||
                                            "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Nombre
                                    </strong>

                                    <p>
                                        {selectedCourse.name ||
                                            "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Créditos
                                    </strong>

                                    <p>
                                        {selectedCourse.credits ??
                                            "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Horas
                                    </strong>

                                    <p>
                                        {selectedCourse.hours ??
                                            "—"}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Docente
                                    </strong>

                                    <p>
                                        {getTeacherName(
                                            selectedCourse
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        Estado
                                    </strong>

                                    <p>
                                        {selectedCourse.active
                                            ? "Activo"
                                            : "Inactivo"}
                                    </p>
                                </div>

                                <div className="form-full">

                                    <strong>
                                        Descripción
                                    </strong>

                                    <p>
                                        {selectedCourse.description ||
                                            "Sin descripción"}
                                    </p>

                                </div>

                            </div>

                        </section>
                    )
                }

                {/* TABLA */}

                <section className="table-card">

                    {/* BUSCADOR */}

                    <div className="search-container">

                        <input
                            type="text"
                            placeholder="Buscar curso por nombre o código..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter"
                                ) {
                                    handleSearch();
                                }
                            }}
                        />

                        <button
                            className="primary-button"
                            onClick={
                                handleSearch
                            }
                        >
                            Buscar
                        </button>

                        {search && (
                            <button
                                className="secondary-button"
                                onClick={
                                    handleClearSearch
                                }
                            >
                                Limpiar
                            </button>
                        )}

                    </div>

                    {/* CABECERA */}

                    <div className="table-header">

                        <div>

                            <h3>
                                Lista de cursos
                            </h3>

                            <span>
                                {totalCourses} cursos
                                en total
                            </span>

                        </div>

                    </div>

                    {/* CONTENIDO */}

                    {loading ? (
                        <div className="loading-message">
                            Cargando cursos...
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="empty-message">
                            No hay cursos registrados.
                        </div>
                    ) : (
                        <>

                            <div className="table-container">

                                <table>

                                    <thead>

                                        <tr>
                                            <th>ID</th>
                                            <th>Código</th>
                                            <th>Curso</th>
                                            <th>Docente</th>
                                            <th>Créditos</th>
                                            <th>Horas</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {courses.map(
                                            (course) => (
                                                <tr
                                                    key={
                                                        course.id
                                                    }
                                                >

                                                    <td>
                                                        {course.id}
                                                    </td>

                                                    <td>
                                                        {course.code}
                                                    </td>

                                                    <td>
                                                        {course.name}
                                                    </td>

                                                    <td>
                                                        {getTeacherName(
                                                            course
                                                        )}
                                                    </td>

                                                    <td>
                                                        {course.credits}
                                                    </td>

                                                    <td>
                                                        {course.hours}
                                                    </td>

                                                    <td>
                                                        {course.active
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </td>

                                                    <td>

                                                        <div className="table-actions">

                                                            <button
                                                                className="view-button"
                                                                onClick={() =>
                                                                    handleView(
                                                                        course
                                                                    )
                                                                }
                                                            >
                                                                Ver
                                                            </button>

                                                            <button
                                                                className="edit-button"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        course
                                                                    )
                                                                }
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        course
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

                            {lastPage > 1 && (
                                <div className="pagination-wrapper">

                                    <div className="pagination-container">

                                        <button
                                            className="pagination-button"
                                            disabled={
                                                currentPage <= 1
                                            }
                                            onClick={() =>
                                                handlePageChange(
                                                    currentPage - 1
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
                                                        {page}
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
                                                    currentPage + 1
                                                )
                                            }
                                        >
                                            →
                                        </button>

                                    </div>

                                    <div className="pagination-info">

                                        Página{" "}
                                        <strong>
                                            {currentPage}
                                        </strong>{" "}
                                        de{" "}
                                        <strong>
                                            {lastPage}
                                        </strong>

                                        {" · "}

                                        Mostrando{" "}
                                        <strong>
                                            {courses.length}
                                        </strong>{" "}
                                        de{" "}
                                        <strong>
                                            {totalCourses}
                                        </strong>{" "}
                                        cursos

                                        {" · "}

                                        <strong>
                                            {perPage}
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

export default Courses;

