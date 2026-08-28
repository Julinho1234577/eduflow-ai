import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Students() {
  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [perPage, setPerPage] = useState(20);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [form, setForm] = useState({
    user_id: "",
    student_code: "",
    document_number: "",
    birth_date: "",
    phone: "",
    address: "",
    career: "",
    admission_year: "",
  });

  useEffect(() => {
    loadStudents(1, "");
  }, []);

  // ============================================================
  // CARGAR ESTUDIANTES
  // ============================================================

  const loadStudents = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/students", {
        params: {
          page: page,
          search: searchTerm,
        },
      });

      console.log("STUDENTS:", response.data);

      const pagination = response.data;

      setStudents(
        Array.isArray(pagination.data)
          ? pagination.data
          : [],
      );

      setCurrentPage(pagination.current_page || 1);
      setLastPage(pagination.last_page || 1);
      setTotalStudents(pagination.total || 0);

      if (pagination.per_page) {
        setPerPage(pagination.per_page);
      }
    } catch (err) {
      console.error("Error cargando estudiantes:", err);
      console.error("Respuesta:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "No se pudieron cargar los estudiantes.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CARGAR USUARIOS DISPONIBLES
  // ============================================================

  const loadUsers = async () => {
    try {
      const response = await api.get("/users/students/available");

      const usersData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setUsers(usersData);
    } catch (err) {
      console.error("Error cargando usuarios:", err);

      setUsers([]);
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

    loadStudents(selectedPage, search);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // CAMBIAR CAMPOS DEL FORMULARIO
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
      user_id: "",
      student_code: "",
      document_number: "",
      birth_date: "",
      phone: "",
      address: "",
      career: "",
      admission_year: "",
    });

    setEditingStudent(null);
    setShowForm(false);
  };

  // ============================================================
  // NUEVO ESTUDIANTE
  // ============================================================

  const handleNewStudent = () => {
    setForm({
      user_id: "",
      student_code: "",
      document_number: "",
      birth_date: "",
      phone: "",
      address: "",
      career: "",
      admission_year: "",
    });

    setEditingStudent(null);
    setSelectedStudent(null);
    setShowDetails(false);

    setError("");
    setSuccess("");

    if (users.length === 0) {
      loadUsers();
    }

    setShowForm(true);
  };

  // ============================================================
  // EDITAR
  // ============================================================

  const handleEdit = (student) => {
    setEditingStudent(student);

    setForm({
      user_id: student.user_id || "",
      student_code: student.student_code || "",
      document_number: student.document_number || "",
      birth_date: student.birth_date
        ? student.birth_date.substring(0, 10)
        : "",
      phone: student.phone || "",
      address: student.address || "",
      career: student.career || "",
      admission_year: student.admission_year || "",
    });

    setError("");
    setSuccess("");

    setShowDetails(false);
    setShowForm(true);
  };

  // ============================================================
  // VER DETALLE
  // ============================================================

  const handleView = async (student) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(`/students/${student.id}`);

      setSelectedStudent(response.data);

      setShowDetails(true);
      setShowForm(false);
    } catch (err) {
      console.error("Error obteniendo estudiante:", err);

      setError(
        err.response?.data?.message ||
          "No se pudo obtener el estudiante.",
      );
    }
  };

  // ============================================================
  // GUARDAR / ACTUALIZAR
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingStudent) {
        const data = {
          student_code: form.student_code,
          document_number: form.document_number,
          birth_date: form.birth_date || null,
          phone: form.phone || null,
          address: form.address || null,
          career: form.career || null,
          admission_year: form.admission_year
            ? Number(form.admission_year)
            : null,
        };

        await api.put(`/students/${editingStudent.id}`, data);

        setSuccess("Estudiante actualizado correctamente.");
      } else {
        if (!form.user_id) {
          setError("Debes seleccionar un usuario estudiante.");
          return;
        }

        const data = {
          user_id: Number(form.user_id),
          student_code: form.student_code,
          document_number: form.document_number,
          birth_date: form.birth_date || null,
          phone: form.phone || null,
          address: form.address || null,
          career: form.career || null,
          admission_year: form.admission_year
            ? Number(form.admission_year)
            : null,
        };

        await api.post("/students", data);

        setSuccess("Estudiante creado correctamente.");
      }

      resetForm();

      await loadStudents(currentPage, search);
    } catch (err) {
      console.error("Error guardando estudiante:", err);

      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors;

        if (validationErrors) {
          const messages = Object.values(validationErrors).flat();

          setError(messages.join(" "));
        } else {
          setError(
            err.response?.data?.message ||
              "Los datos enviados no son válidos.",
          );
        }
      } else {
        setError(
          err.response?.data?.message ||
            "No se pudo guardar el estudiante.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ELIMINAR
  // ============================================================

  const handleDelete = async (student) => {
    const name =
      student.user?.name ||
      `estudiante #${student.id}`;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar a ${name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/students/${student.id}`);

      setSuccess("Estudiante eliminado correctamente.");

      if (students.length === 1 && currentPage > 1) {
        await loadStudents(currentPage - 1, search);
      } else {
        await loadStudents(currentPage, search);
      }
    } catch (err) {
      console.error("Error eliminando estudiante:", err);

      setError(
        err.response?.data?.message ||
          "No se pudo eliminar el estudiante.",
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
  // PAGINACIÓN
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
      pages.push(1, 2, 3, 4, 5, "...", lastPage);

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
        lastPage,
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
      lastPage,
    );

    return pages;
  };

  const paginationPages = getPaginationPages();

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-dashboard">

      {/* HEADER */}

      <header className="admin-header">
        <div>
          <h1>EduFlow AI</h1>

          <p>Gestión de estudiantes</p>
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

        {/* TÍTULO */}

        <section className="welcome-section">
          <div>
            <h2>Estudiantes</h2>

            <p>
              Administra la información académica de los estudiantes.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={handleNewStudent}
          >
            + Nuevo estudiante
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
              {editingStudent
                ? "Editar estudiante"
                : "Nuevo estudiante"}
            </h3>

            <form onSubmit={handleSubmit}>

              {!editingStudent && (
                <div className="form-group">

                  <label>
                    Usuario estudiante
                  </label>

                  <select
                    name="user_id"
                    value={form.user_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Selecciona un usuario
                    </option>

                    {users.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name} — {item.email}
                      </option>
                    ))}
                  </select>

                  {users.length === 0 && (
                    <small>
                      No hay usuarios estudiante disponibles.
                    </small>
                  )}
                </div>
              )}

              {editingStudent && (
                <div className="form-group">

                  <label>
                    Usuario
                  </label>

                  <input
                    type="text"
                    value={
                      editingStudent.user?.name ||
                      "Usuario"
                    }
                    disabled
                  />

                </div>
              )}

              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Código de estudiante
                  </label>

                  <input
                    type="text"
                    name="student_code"
                    value={form.student_code}
                    onChange={handleChange}
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
                    value={form.document_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Fecha de nacimiento
                  </label>

                  <input
                    type="date"
                    name="birth_date"
                    value={form.birth_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Teléfono
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Carrera
                  </label>

                  <input
                    type="text"
                    name="career"
                    value={form.career}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Año de ingreso
                  </label>

                  <input
                    type="number"
                    name="admission_year"
                    value={form.admission_year}
                    onChange={handleChange}
                    min="2000"
                    max="2100"
                  />
                </div>

                <div className="form-group form-full">
                  <label>
                    Dirección
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
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
                    : editingStudent
                      ? "Actualizar estudiante"
                      : "Crear estudiante"}
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

        {/* DETALLE */}

        {showDetails && selectedStudent && (
          <section className="student-form-card">

            <div className="table-header">

              <h3>
                Detalle del estudiante
              </h3>

              <button
                className="secondary-button"
                onClick={() => setShowDetails(false)}
              >
                Cerrar
              </button>

            </div>

            <div className="form-grid">

              <div>
                <strong>Nombre</strong>
                <p>
                  {selectedStudent.user?.name || "—"}
                </p>
              </div>

              <div>
                <strong>Correo</strong>
                <p>
                  {selectedStudent.user?.email || "—"}
                </p>
              </div>

              <div>
                <strong>Código</strong>
                <p>
                  {selectedStudent.student_code || "—"}
                </p>
              </div>

              <div>
                <strong>Documento</strong>
                <p>
                  {selectedStudent.document_number || "—"}
                </p>
              </div>

              <div>
                <strong>Fecha de nacimiento</strong>
                <p>
                  {selectedStudent.birth_date
                    ? selectedStudent.birth_date.substring(0, 10)
                    : "—"}
                </p>
              </div>

              <div>
                <strong>Teléfono</strong>
                <p>
                  {selectedStudent.phone || "—"}
                </p>
              </div>

              <div>
                <strong>Carrera</strong>
                <p>
                  {selectedStudent.career || "—"}
                </p>
              </div>

              <div>
                <strong>Año de ingreso</strong>
                <p>
                  {selectedStudent.admission_year || "—"}
                </p>
              </div>

              <div className="form-full">
                <strong>Dirección</strong>
                <p>
                  {selectedStudent.address || "—"}
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
              placeholder="Buscar estudiante por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCurrentPage(1);
                  loadStudents(1, search);
                }
              }}
            />

            <button
              className="primary-button"
              onClick={() => {
                setCurrentPage(1);
                loadStudents(1, search);
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
                  loadStudents(1, "");
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
                Lista de estudiantes
              </h3>

              <span>
                {totalStudents} estudiantes en total
              </span>

            </div>

          </div>

          {/* CONTENIDO */}

          {loading ? (
            <div className="loading-message">
              Cargando estudiantes...
            </div>
          ) : students.length === 0 ? (
            <div className="empty-message">
              No hay estudiantes registrados.
            </div>
          ) : (
            <>

              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Estudiante</th>
                      <th>Correo</th>
                      <th>Código</th>
                      <th>Documento</th>
                      <th>Carrera</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>

                    {students.map((student) => (
                      <tr key={student.id}>

                        <td>
                          {student.id}
                        </td>

                        <td>
                          {student.user?.name || "—"}
                        </td>

                        <td>
                          {student.user?.email || "—"}
                        </td>

                        <td>
                          {student.student_code}
                        </td>

                        <td>
                          {student.document_number}
                        </td>

                        <td>
                          {student.career || "—"}
                        </td>

                        <td>

                          <div className="table-actions">

                            <button
                              className="view-button"
                              onClick={() =>
                                handleView(student)
                              }
                            >
                              Ver
                            </button>

                            <button
                              className="edit-button"
                              onClick={() =>
                                handleEdit(student)
                              }
                            >
                              Editar
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDelete(student)
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
                      disabled={currentPage <= 1}
                      onClick={() =>
                        handlePageChange(currentPage - 1)
                      }
                    >
                      ←
                    </button>

                    {paginationPages.map(
                      (page, index) => {

                        if (page === "...") {
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
                              currentPage === page
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handlePageChange(page)
                            }
                          >
                            {page}
                          </button>
                        );
                      },
                    )}

                    <button
                      className="pagination-button"
                      disabled={
                        currentPage >= lastPage
                      }
                      onClick={() =>
                        handlePageChange(
                          currentPage + 1,
                        )
                      }
                    >
                      →
                    </button>

                  </div>

                  <div className="pagination-info">

                    Página{" "}
                    <strong>{currentPage}</strong>{" "}
                    de{" "}
                    <strong>{lastPage}</strong>

                    {" · "}

                    Mostrando{" "}
                    <strong>{students.length}</strong>{" "}
                    de{" "}
                    <strong>{totalStudents}</strong>{" "}
                    estudiantes

                    {" · "}

                    <strong>{perPage}</strong>{" "}
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

export default Students;

