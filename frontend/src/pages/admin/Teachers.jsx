import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Teachers() {
    const { user, logout } = useAuth();

    const [teachers, setTeachers] = useState([]);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalTeachers, setTotalTeachers] = useState(0);
    const [perPage, setPerPage] = useState(20);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [editingTeacher, setEditingTeacher] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        teacher_code: "",
        document_number: "",
        specialty: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        loadData(1, "");
    }, []);

    // ============================================================
    // CARGAR DOCENTES
    // ============================================================

    const loadData = async (page = 1, searchTerm = search) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/teachers", {
                params: {
                    page: page,
                    search: searchTerm,
                },
            });

            console.log("TEACHERS:", response.data);

            const pagination = response.data;

            setTeachers(
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

            setTotalTeachers(
                pagination.total || 0
            );

            if (pagination.per_page) {
                setPerPage(pagination.per_page);
            }

        } catch (err) {
            console.error(
                "Error cargando docentes:",
                err
            );

            console.error(
                "Respuesta:",
                err.response?.data
            );

            setError(
                err.response?.data?.message ||
                "No se pudieron cargar los docentes."
            );
        } finally {
            setLoading(false);
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

        loadData(selectedPage, search);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ============================================================
    // PÁGINAS
    // ============================================================

    const getPaginationPages = () => {
        const pages = [];

        if (lastPage <= 1) {
            return pages;
        }

        if (lastPage <= 7) {
            for (let i = 1; i <= lastPage; i++) {
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

        if (currentPage >= lastPage - 3) {
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

    const paginationPages = getPaginationPages();

    // ============================================================
    // CAMBIAR FORMULARIO
    // ============================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ============================================================
    // REINICIAR FORMULARIO
    // ============================================================

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            password: "",
            teacher_code: "",
            document_number: "",
            specialty: "",
            phone: "",
            address: "",
        });

        setEditingTeacher(null);
        setShowForm(false);
    };

    // ============================================================
    // NUEVO DOCENTE
    // ============================================================

    const handleNewTeacher = () => {
        resetForm();

        setError("");
        setSuccess("");
        setShowDetails(false);

        setShowForm(true);
    };

    // ============================================================
    // EDITAR
    // ============================================================

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);

        setForm({
            name: teacher.user?.name || "",
            email: teacher.user?.email || "",
            password: "",
            teacher_code:
                teacher.teacher_code || "",
            document_number:
                teacher.document_number || "",
            specialty:
                teacher.specialty || "",
            phone:
                teacher.phone || "",
            address:
                teacher.address || "",
        });

        setError("");
        setSuccess("");

        setShowDetails(false);
        setShowForm(true);
    };

    // ============================================================
    // VER
    // ============================================================

    const handleView = async (teacher) => {
        try {
            setError("");
            setSuccess("");

            const response = await api.get(
                `/teachers/${teacher.id}`
            );

            setSelectedTeacher(response.data);

            setShowDetails(true);
            setShowForm(false);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo obtener el docente."
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

            if (editingTeacher) {

                const data = {
                    name: form.name,
                    email: form.email,
                    teacher_code:
                        form.teacher_code,
                    document_number:
                        form.document_number,
                    specialty:
                        form.specialty || null,
                    phone:
                        form.phone || null,
                    address:
                        form.address || null,
                };

                if (form.password.trim() !== "") {
                    data.password =
                        form.password;
                }

                await api.put(
                    `/teachers/${editingTeacher.id}`,
                    data
                );

                setSuccess(
                    "Docente actualizado correctamente."
                );

            } else {

                const data = {
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    teacher_code:
                        form.teacher_code,
                    document_number:
                        form.document_number,
                    specialty:
                        form.specialty || null,
                    phone:
                        form.phone || null,
                    address:
                        form.address || null,
                };

                await api.post(
                    "/teachers",
                    data
                );

                setSuccess(
                    "Docente creado correctamente."
                );
            }

            resetForm();

            await loadData(
                currentPage,
                search
            );

        } catch (err) {
            console.error(err);

            if (err.response?.status === 422) {

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
                    "No se pudo guardar el docente."
                );
            }

        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // ELIMINAR
    // ============================================================

    const handleDelete = async (teacher) => {

        const name =
            teacher.user?.name ||
            `docente #${teacher.id}`;

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar a ${name}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/teachers/${teacher.id}`
            );

            setSuccess(
                "Docente eliminado correctamente."
            );

            if (
                teachers.length === 1 &&
                currentPage > 1
            ) {
                await loadData(
                    currentPage - 1,
                    search
                );
            } else {
                await loadData(
                    currentPage,
                    search
                );
            }

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "No se pudo eliminar el docente."
            );
        }
    };

    // ============================================================
    // CERRAR SESIÓN
    // ============================================================

    const handleLogout = async () => {
        await logout();
    };

    // ============================================================
    // OBTENER NOMBRE DOCENTE
    // ============================================================

    const getTeacherName = (teacher) => {
        return (
            teacher.user?.name ||
            teacher.name ||
            "Sin nombre"
        );
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="admin-dashboard">

            {/* HEADER */}

            <header className="admin-header">

                <div>
                    <h1>EduFlow AI</h1>

                    <p>
                        Gestión de docentes
                    </p>
                </div>

                <div className="admin-user">

                    <span>
                        {user?.name ||
                            "Administrador"}
                    </span>

                    <button
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </button>

                </div>

            </header>

            <main className="admin-content">

                {/* ENCABEZADO */}

                <section className="welcome-section">

                    <div>

                        <h2>
                            Docentes
                        </h2>

                        <p>
                            Administra la información
                            de los docentes.
                        </p>

                    </div>

                    <button
                        className="primary-button"
                        onClick={handleNewTeacher}
                    >
                        + Nuevo docente
                    </button>

                </section>

                {/* ERROR */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* ÉXITO */}

                {success && (
                    <div className="dashboard-success">
                        {success}
                    </div>
                )}

                {/* FORMULARIO */}

                {showForm && (
                    <section className="student-form-card">

                        <h3>
                            {editingTeacher
                                ? "Editar docente"
                                : "Nuevo docente"}
                        </h3>

                        <form
                            onSubmit={handleSubmit}
                        >

                            <div className="form-grid">

                                <div className="form-group">
                                    <label>
                                        Nombre completo
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ej. María González"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Correo electrónico
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="docente@eduflow.test"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Contraseña
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={
                                            form.password
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder={
                                            editingTeacher
                                                ? "Dejar vacío para mantener"
                                                : "Mínimo 6 caracteres"
                                        }
                                        required={
                                            !editingTeacher
                                        }
                                        minLength="6"
                                    />

                                    {editingTeacher && (
                                        <small>
                                            Déjala vacía si no deseas
                                            cambiar la contraseña.
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>
                                        Código de docente
                                    </label>

                                    <input
                                        type="text"
                                        name="teacher_code"
                                        value={
                                            form.teacher_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="DOC-0001"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Número de documento
                                    </label>

                                    <input
                                        type="text"
                                        name="document_number"
                                        value={
                                            form.document_number
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="12345678"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Especialidad
                                    </label>

                                    <input
                                        type="text"
                                        name="specialty"
                                        value={
                                            form.specialty
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Administración"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Teléfono
                                    </label>

                                    <input
                                        type="text"
                                        name="phone"
                                        value={
                                            form.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="987654321"
                                    />
                                </div>

                                <div className="form-group form-full">
                                    <label>
                                        Dirección
                                    </label>

                                    <input
                                        type="text"
                                        name="address"
                                        value={
                                            form.address
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Lima, Perú"
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
                                        : editingTeacher
                                            ? "Actualizar docente"
                                            : "Crear docente"}
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={resetForm}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </form>

                    </section>
                )}

                {/* DETALLE */}

                {showDetails &&
                    selectedTeacher && (

                    <section className="student-form-card">

                        <div className="table-header">

                            <h3>
                                Detalle del docente
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
                                    Nombre
                                </strong>

                                <p>
                                    {selectedTeacher.user?.name ||
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <strong>
                                    Correo
                                </strong>

                                <p>
                                    {selectedTeacher.user?.email ||
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <strong>
                                    Código
                                </strong>

                                <p>
                                    {selectedTeacher.teacher_code ||
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <strong>
                                    Documento
                                </strong>

                                <p>
                                    {selectedTeacher.document_number ||
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <strong>
                                    Especialidad
                                </strong>

                                <p>
                                    {selectedTeacher.specialty ||
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <strong>
                                    Teléfono
                                </strong>

                                <p>
                                    {selectedTeacher.phone ||
                                        "—"}
                                </p>
                            </div>

                            <div className="form-full">

                                <strong>
                                    Dirección
                                </strong>

                                <p>
                                    {selectedTeacher.address ||
                                        "—"}
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
                            placeholder="Buscar docente por nombre..."
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
                                    setCurrentPage(1);

                                    loadData(
                                        1,
                                        search
                                    );
                                }

                            }}
                        />

                        <button
                            className="primary-button"
                            onClick={() => {

                                setCurrentPage(1);

                                loadData(
                                    1,
                                    search
                                );

                            }}
                        >
                            Buscar
                        </button>

                        {search && (
                            <button
                                className="secondary-button"
                                onClick={() => {

                                    setSearch("");

                                    setCurrentPage(1);

                                    loadData(
                                        1,
                                        ""
                                    );

                                }}
                            >
                                Limpiar
                            </button>
                        )}

                    </div>

                    {/* CABECERA */}

                    <div className="table-header">

                        <div>

                            <h3>
                                Lista de docentes
                            </h3>

                            <span>
                                {totalTeachers} docentes
                                en total
                            </span>

                        </div>

                    </div>

                    {/* CONTENIDO */}

                    {loading ? (

                        <div className="loading-message">
                            Cargando docentes...
                        </div>

                    ) : teachers.length === 0 ? (

                        <div className="empty-message">
                            {search
                                ? `No se encontraron docentes con "${search}".`
                                : "No hay docentes registrados."}
                        </div>

                    ) : (

                        <>

                            <div className="table-container">

                                <table>

                                    <thead>

                                        <tr>
                                            <th>ID</th>
                                            <th>Docente</th>
                                            <th>Correo</th>
                                            <th>Código</th>
                                            <th>Documento</th>
                                            <th>Especialidad</th>
                                            <th>Acciones</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {teachers.map(
                                            (teacher) => (

                                            <tr
                                                key={
                                                    teacher.id
                                                }
                                            >

                                                <td>
                                                    {teacher.id}
                                                </td>

                                                <td>
                                                    {getTeacherName(
                                                        teacher
                                                    )}
                                                </td>

                                                <td>
                                                    {teacher.user?.email ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {teacher.teacher_code ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {teacher.document_number ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {teacher.specialty ||
                                                        "—"}
                                                </td>

                                                <td>

                                                    <div className="table-actions">

                                                        <button
                                                            className="view-button"
                                                            onClick={() =>
                                                                handleView(
                                                                    teacher
                                                                )
                                                            }
                                                        >
                                                            Ver
                                                        </button>

                                                        <button
                                                            className="edit-button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    teacher
                                                                )
                                                            }
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            className="delete-button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    teacher
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
                                            {teachers.length}
                                        </strong>{" "}
                                        de{" "}
                                        <strong>
                                            {totalTeachers}
                                        </strong>{" "}
                                        docentes

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

export default Teachers;

