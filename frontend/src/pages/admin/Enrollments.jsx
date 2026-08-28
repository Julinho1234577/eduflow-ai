import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Enrollments() {
  const { user, logout } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalEnrollments, setTotalEnrollments] = useState(0);

  const perPage = 50;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const [form, setForm] = useState({
    student_id: "",
    course_id: "",
    academic_period: "",
    enrollment_date: "",
    status: "active",
  });

  /*
   * =====================================================
   * CARGA INICIAL
   * =====================================================
   */

  useEffect(() => {
    loadEnrollments(1, "");
  }, []);

  /*
   * =====================================================
   * CARGAR MATRÍCULAS
   * =====================================================
   */

  const loadEnrollments = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      setError("");

      const cleanSearch = searchTerm.trim();

      console.log("=================================");
      console.log("CARGANDO MATRÍCULAS");
      console.log("Página:", page);
      console.log("Búsqueda:", cleanSearch);
      console.log("=================================");

      const response = await api.get("/enrollments", {
        params: {
          page,
          search: cleanSearch,
          per_page: perPage,
        },
      });

      const pagination = response.data;

      console.log("RESPUESTA:", pagination);
      console.log("RESULTADOS:", pagination.data?.length);
      console.log("TOTAL:", pagination.total);
      console.log("PÁGINA:", pagination.current_page);
      console.log("ÚLTIMA PÁGINA:", pagination.last_page);

      setEnrollments(Array.isArray(pagination.data) ? pagination.data : []);

      setCurrentPage(Number(pagination.current_page) || 1);

      setLastPage(Number(pagination.last_page) || 1);

      setTotalEnrollments(Number(pagination.total) || 0);
    } catch (err) {
      console.error("ERROR CARGANDO MATRÍCULAS:", err);
      console.error("RESPUESTA:", err.response?.data);

      setError(
        err.response?.data?.message || "No se pudieron cargar las matrículas.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * CARGAR ESTUDIANTES Y CURSOS
   * =====================================================
   */

  const loadFormData = async () => {
    try {
      const [studentsResponse, coursesResponse] = await Promise.all([
        api.get("/students"),
        api.get("/courses"),
      ]);

      setStudents(getData(studentsResponse));
      setCourses(getData(coursesResponse));
    } catch (err) {
      console.error("Error cargando estudiantes/cursos:", err);

      setError(
        err.response?.data?.message ||
          "No se pudieron cargar los datos del formulario.",
      );
    }
  };

  /*
   * =====================================================
   * EXTRAER DATA
   * =====================================================
   */

  const getData = (response) => {
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }

    return [];
  };

  /*
   * =====================================================
   * CAMBIAR PÁGINA
   * =====================================================
   */

  const handlePageChange = (page) => {
    const selectedPage = Number(page);

    console.log("CLICK PAGINACIÓN");
    console.log("Página seleccionada:", selectedPage);
    console.log("Página actual:", currentPage);
    console.log("Última página:", lastPage);

    if (
      selectedPage < 1 ||
      selectedPage > lastPage ||
      selectedPage === currentPage
    ) {
      console.log("Cambio de página bloqueado");
      return;
    }

    loadEnrollments(selectedPage, search);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =====================================================
   * CAMBIO FORMULARIO
   * =====================================================
   */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * =====================================================
   * RESET FORM
   * =====================================================
   */

  const resetForm = () => {
    setForm({
      student_id: "",
      course_id: "",
      academic_period: "",
      enrollment_date: "",
      status: "active",
    });

    setEditingEnrollment(null);
    setShowForm(false);
  };

  /*
   * =====================================================
   * NUEVA MATRÍCULA
   * =====================================================
   */

  const handleNewEnrollment = async () => {
    resetForm();

    setError("");
    setSuccess("");
    setShowDetails(false);

    if (students.length === 0 || courses.length === 0) {
      await loadFormData();
    }

    setShowForm(true);
  };

  /*
   * =====================================================
   * EDITAR
   * =====================================================
   */

  const handleEdit = async (enrollment) => {
    setEditingEnrollment(enrollment);

    setForm({
      student_id: enrollment.student_id || "",
      course_id: enrollment.course_id || "",
      academic_period: enrollment.academic_period || "",

      enrollment_date: enrollment.enrollment_date
        ? enrollment.enrollment_date.substring(0, 10)
        : "",

      status: enrollment.status || "active",
    });

    setError("");
    setSuccess("");
    setShowDetails(false);

    if (students.length === 0 || courses.length === 0) {
      await loadFormData();
    }

    setShowForm(true);
  };

  /*
   * =====================================================
   * VER DETALLE
   * =====================================================
   */

  const handleView = async (enrollment) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(`/enrollments/${enrollment.id}`);

      setSelectedEnrollment(response.data);

      setShowDetails(true);
      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "No se pudo obtener la matrícula.",
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
        student_id: Number(form.student_id),
        course_id: Number(form.course_id),
        academic_period: form.academic_period,
        enrollment_date: form.enrollment_date,
        status: form.status,
      };

      if (editingEnrollment) {
        await api.put(`/enrollments/${editingEnrollment.id}`, data);

        setSuccess("Matrícula actualizada correctamente.");
      } else {
        await api.post("/enrollments", data);

        setSuccess("Matrícula creada correctamente.");
      }

      resetForm();

      await loadEnrollments(currentPage, search);
    } catch (err) {
      console.error("Error guardando matrícula:", err);

      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors;

        if (validationErrors) {
          const messages = Object.values(validationErrors).flat();

          setError(messages.join(" "));
        } else {
          setError(
            err.response?.data?.message || "Los datos enviados no son válidos.",
          );
        }
      } else {
        setError(
          err.response?.data?.message || "No se pudo guardar la matrícula.",
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

  const handleDelete = async (enrollment) => {
    const studentName = enrollment.student?.user?.name || "este estudiante";

    const courseName = enrollment.course?.name || "este curso";

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la matrícula de ${studentName} en ${courseName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/enrollments/${enrollment.id}`);

      setSuccess("Matrícula eliminada correctamente.");

      if (enrollments.length === 1 && currentPage > 1) {
        await loadEnrollments(currentPage - 1, search);
      } else {
        await loadEnrollments(currentPage, search);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "No se pudo eliminar la matrícula.",
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

  const getStudentName = (student) => {
    return (
      student?.user?.name || student?.name || `Estudiante #${student?.id || ""}`
    );
  };

  const getStudentEmail = (student) => {
    return student?.user?.email || "";
  };

  const getCourseName = (course) => {
    if (!course) {
      return "—";
    }

    if (course.code) {
      return `${course.code} — ${course.name}`;
    }

    return course.name || "Curso";
  };

  const getTeacherName = (course) => {
    return (
      course?.teacher?.user?.name || course?.teacher?.name || "Sin docente"
    );
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Activa";

      case "inactive":
        return "Inactiva";

      case "completed":
        return "Completada";

      case "cancelled":
        return "Cancelada";

      default:
        return status || "—";
    }
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

    /*
     * Si existen pocas páginas,
     * mostramos todas.
     */

    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }

      return pages;
    }

    /*
     * Estamos al inicio.
     *
     * 1 2 3 4 5 ... 151
     */

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", lastPage);

      return pages;
    }

    /*
     * Estamos al final.
     *
     * 1 ... 147 148 149 150 151
     */

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

    /*
     * Estamos en el medio.
     *
     * 1 ... 20 21 22 ... 151
     */

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

  /*
   * =====================================================
   * DEBUG
   * =====================================================
   */

  console.log("DEBUG PAGINACIÓN:", {
    currentPage,
    lastPage,
    totalEnrollments,
    enrollments: enrollments.length,
    paginationPages,
  });

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
          <h1>EduFlow AI</h1>

          <p>Gestión de matrículas</p>
        </div>

        <div className="admin-user">
          <span>{user?.name || "Administrador"}</span>

          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      {/* CONTENIDO */}

      <main className="admin-content">
        {/* BIENVENIDA */}

        <section className="welcome-section">
          <div>
            <h2>Matrículas</h2>

            <p>Administra las matrículas de los estudiantes en los cursos.</p>
          </div>

          <button className="primary-button" onClick={handleNewEnrollment}>
            + Nueva matrícula
          </button>
        </section>

        {/* MENSAJES */}

        {error && <div className="dashboard-error">{error}</div>}

        {success && <div className="dashboard-success">{success}</div>}

        {/* FORMULARIO */}

        {showForm && (
          <section className="student-form-card">
            <h3>
              {editingEnrollment ? "Editar matrícula" : "Nueva matrícula"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* ESTUDIANTE */}

                <div className="form-group">
                  <label>Estudiante</label>

                  <select
                    name="student_id"
                    value={form.student_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona un estudiante</option>

                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getStudentName(student)}

                        {getStudentEmail(student)
                          ? ` — ${getStudentEmail(student)}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {students.length === 0 && (
                    <small>No hay estudiantes disponibles.</small>
                  )}
                </div>

                {/* CURSO */}

                <div className="form-group">
                  <label>Curso</label>

                  <select
                    name="course_id"
                    value={form.course_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona un curso</option>

                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {getCourseName(course)}
                      </option>
                    ))}
                  </select>

                  {courses.length === 0 && (
                    <small>No hay cursos disponibles.</small>
                  )}
                </div>

                {/* PERÍODO */}

                <div className="form-group">
                  <label>Período académico</label>

                  <input
                    type="text"
                    name="academic_period"
                    value={form.academic_period}
                    onChange={handleChange}
                    placeholder="Ejemplo: 2026-I"
                    required
                  />
                </div>

                {/* FECHA */}

                <div className="form-group">
                  <label>Fecha de matrícula</label>

                  <input
                    type="date"
                    name="enrollment_date"
                    value={form.enrollment_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* ESTADO */}

                <div className="form-group">
                  <label>Estado</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="active">Activa</option>

                    <option value="inactive">Inactiva</option>

                    <option value="completed">Completada</option>

                    <option value="cancelled">Cancelada</option>
                  </select>
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
                    : editingEnrollment
                      ? "Actualizar matrícula"
                      : "Crear matrícula"}
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

        {showDetails && selectedEnrollment && (
          <section className="student-form-card">
            <div className="table-header">
              <h3>Detalle de matrícula</h3>

              <button
                className="secondary-button"
                onClick={() => setShowDetails(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="form-grid">
              <div>
                <strong>Estudiante</strong>

                <p>{getStudentName(selectedEnrollment.student)}</p>
              </div>

              <div>
                <strong>Correo</strong>

                <p>{getStudentEmail(selectedEnrollment.student) || "—"}</p>
              </div>

              <div>
                <strong>Curso</strong>

                <p>{getCourseName(selectedEnrollment.course)}</p>
              </div>

              <div>
                <strong>Docente</strong>

                <p>{getTeacherName(selectedEnrollment.course)}</p>
              </div>

              <div>
                <strong>Período académico</strong>

                <p>{selectedEnrollment.academic_period || "—"}</p>
              </div>

              <div>
                <strong>Fecha de matrícula</strong>

                <p>
                  {selectedEnrollment.enrollment_date
                    ? selectedEnrollment.enrollment_date.substring(0, 10)
                    : "—"}
                </p>
              </div>

              <div>
                <strong>Estado</strong>

                <p>{getStatusLabel(selectedEnrollment.status)}</p>
              </div>

              <div>
                <strong>ID</strong>

                <p>{selectedEnrollment.id}</p>
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
              placeholder="Buscar estudiante, correo, curso o período..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  const value = e.currentTarget.value.trim();

                  setCurrentPage(1);

                  loadEnrollments(1, value);
                }
              }}
            />

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const value = search.trim();

                setCurrentPage(1);

                loadEnrollments(1, value);
              }}
            >
              Buscar
            </button>

            {search.trim() !== "" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch("");

                  setCurrentPage(1);

                  loadEnrollments(1, "");
                }}
              >
                Limpiar
              </button>
            )}
          </div>

          {/* HEADER */}

          <div className="table-header">
            <div>
              <h3>Lista de matrículas</h3>

              <span>{totalEnrollments} matrículas en total</span>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="loading-message">Cargando matrículas...</div>
          ) : enrollments.length === 0 ? (
            <div className="empty-message">No hay matrículas registradas.</div>
          ) : (
            <>
              {/* TABLA */}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>

                      <th>Estudiante</th>

                      <th>Curso</th>

                      <th>Docente</th>

                      <th>Período</th>

                      <th>Fecha</th>

                      <th>Estado</th>

                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>{enrollment.id}</td>

                        <td>{getStudentName(enrollment.student)}</td>

                        <td>{getCourseName(enrollment.course)}</td>

                        <td>{getTeacherName(enrollment.course)}</td>

                        <td>{enrollment.academic_period}</td>

                        <td>
                          {enrollment.enrollment_date
                            ? enrollment.enrollment_date.substring(0, 10)
                            : "—"}
                        </td>

                        <td>{getStatusLabel(enrollment.status)}</td>

                        <td>
                          <div className="table-actions">
                            <button
                              className="view-button"
                              onClick={() => handleView(enrollment)}
                            >
                              Ver
                            </button>

                            <button
                              className="edit-button"
                              onClick={() => handleEdit(enrollment)}
                            >
                              Editar
                            </button>

                            <button
                              className="delete-button"
                              onClick={() => handleDelete(enrollment)}
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

              {/* =================================================
                  PAGINACIÓN
                  ================================================= */}

              {lastPage > 1 && (
                <div className="pagination-wrapper">
                  <div className="pagination-container">
                    {/* ANTERIOR */}

                    <button
                      type="button"
                      className="pagination-button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-label="Página anterior"
                    >
                      ←
                    </button>

                    {/* NÚMEROS */}

                    {paginationPages.map((page, index) => {
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
                          type="button"
                          key={`page-${page}`}
                          className={`pagination-button ${
                            currentPage === page ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* SIGUIENTE */}

                    <button
                      type="button"
                      className="pagination-button"
                      disabled={currentPage >= lastPage}
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-label="Página siguiente"
                    >
                      →
                    </button>
                  </div>

                  {/* INFORMACIÓN */}

                  <div className="pagination-info">
                    Página <strong>{currentPage}</strong> de{" "}
                    <strong>{lastPage}</strong>
                    {" · "}
                    Mostrando <strong>{enrollments.length}</strong> de{" "}
                    <strong>{totalEnrollments}</strong> matrículas
                    {" · "}
                    <strong>{perPage}</strong> por página
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

export default Enrollments;
