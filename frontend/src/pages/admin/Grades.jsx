import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Grades() {
  const { user, logout } = useAuth();

  const [grades, setGrades] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalGrades, setTotalGrades] = useState(0);
  const [perPage, setPerPage] = useState(50);

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
    /*
     * Solo cargamos las notas al entrar a la página.
     * Las matrículas (para el <select> del formulario)
     * se cargan bajo demanda, cuando el usuario realmente
     * abre "Nueva nota" o "Editar" — así la carga inicial
     * no espera por datos que quizás nunca se usen.
     */
    loadGrades(1);
  }, []);

  /*
   * =====================================================
   * CARGAR NOTAS
   * =====================================================
   *
   * IMPORTANTE:
   * "searchTerm" es opcional. Si no se pasa, se usa el
   * valor actual del estado "search".
   *
   * Esto permite llamar a loadGrades(1, "") justo después
   * de limpiar el buscador, sin depender de que React ya
   * haya vuelto a renderizar con el estado actualizado
   * (evita el bug de "closure" con valores desactualizados).
   */

  const loadGrades = async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/grades", {
        params: {
          page: page,
          search: searchTerm,
        },
      });

      const pagination = response.data;

      setGrades(Array.isArray(pagination.data) ? pagination.data : []);

      setCurrentPage(pagination.current_page || 1);

      setLastPage(pagination.last_page || 1);

      setTotalGrades(pagination.total || 0);
    } catch (err) {
      console.error("Error cargando notas:", err);

      console.error("Respuesta del servidor:", err.response?.data);

      setError(
        err.response?.data?.message || "No se pudieron cargar las notas.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * CARGAR MATRÍCULAS
   * =====================================================
   */

  const loadEnrollments = async () => {
    try {
      const response = await api.get("/enrollments");

      if (Array.isArray(response.data)) {
        setEnrollments(response.data);
      } else if (Array.isArray(response.data?.data)) {
        setEnrollments(response.data.data);
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      console.error("Error cargando matrículas:", err);
    }
  };

  /*
   * =====================================================
   * CAMBIAR PÁGINA
   * =====================================================
   */

  const handlePageChange = (page) => {
    const selectedPage = Number(page);

    if (
      selectedPage < 1 ||
      selectedPage > lastPage ||
      selectedPage === currentPage
    ) {
      return;
    }

    loadGrades(selectedPage);

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
      enrollment_id: "",
      assessment_type: "",
      score: "",
      assessment_date: "",
      comments: "",
    });

    setEditingGrade(null);
    setShowForm(false);
  };

  /*
   * =====================================================
   * NUEVA NOTA
   * =====================================================
   */

  const handleNewGrade = () => {
    resetForm();

    setError("");
    setSuccess("");
    setShowDetails(false);

    /*
     * Solo pedimos las matrículas si todavía no las
     * tenemos cargadas (para no repetir la petición
     * cada vez que se abre el formulario).
     */
    if (enrollments.length === 0) {
      loadEnrollments();
    }

    setShowForm(true);
  };

  /*
   * =====================================================
   * EDITAR
   * =====================================================
   */

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

    if (enrollments.length === 0) {
      loadEnrollments();
    }

    setShowForm(true);
  };

  /*
   * =====================================================
   * VER
   * =====================================================
   */

  const handleView = async (grade) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(`/grades/${grade.id}`);

      setSelectedGrade(response.data);

      setShowDetails(true);
      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "No se pudo obtener la nota.");
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
        enrollment_id: Number(form.enrollment_id),

        assessment_type: form.assessment_type,

        score: Number(form.score),

        assessment_date: form.assessment_date,

        comments: form.comments || null,
      };

      if (editingGrade) {
        await api.put(`/grades/${editingGrade.id}`, data);

        setSuccess("Nota actualizada correctamente.");
      } else {
        await api.post("/grades", data);

        setSuccess("Nota creada correctamente.");
      }

      resetForm();

      await loadGrades(currentPage);
    } catch (err) {
      console.error("Error guardando nota:", err);

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
        setError(err.response?.data?.message || "No se pudo guardar la nota.");
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

  const handleDelete = async (grade) => {
    const studentName =
      grade.enrollment?.student?.user?.name || "este estudiante";

    const courseName = grade.enrollment?.course?.name || "este curso";

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la nota de ${studentName} en ${courseName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/grades/${grade.id}`);

      setSuccess("Nota eliminada correctamente.");

      /*
       * Si eliminamos la última nota de una página,
       * regresamos automáticamente a la página anterior.
       */

      if (grades.length === 1 && currentPage > 1) {
        await loadGrades(currentPage - 1);
      } else {
        await loadGrades(currentPage);
      }
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "No se pudo eliminar la nota.");
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

  const getTeacherName = (enrollment) => {
    return (
      enrollment?.course?.teacher?.user?.name ||
      enrollment?.course?.teacher?.name ||
      "Sin docente"
    );
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

  /*
   * =====================================================
   * PAGINACIÓN
   * =====================================================
   */

  const getPaginationPages = () => {
    const pages = [];

    if (lastPage <= 1) {
      return pages;
    }

    /*
     * Hasta 7 páginas:
     *
     * 1 2 3 4 5 6 7
     */

    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }

      return pages;
    }

    /*
     * Inicio:
     *
     * 1 2 3 4 5 ... 601
     */

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", lastPage);

      return pages;
    }

    /*
     * Final:
     *
     * 1 ... 597 598 599 600 601
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
     * Medio:
     *
     * 1 ... 20 21 22 ... 601
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
   * RENDER
   * =====================================================
   */

  return (
    <div className="admin-dashboard">
      {/* HEADER */}

      <header className="admin-header">
        <div>
          <h1>EduFlow AI</h1>

          <p>Gestión de calificaciones</p>
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
            <h2>Notas</h2>

            <p>Administra las calificaciones de los estudiantes.</p>
          </div>

          <button className="primary-button" onClick={handleNewGrade}>
            + Nueva nota
          </button>
        </section>

        {/* MENSAJES */}

        {error && <div className="dashboard-error">{error}</div>}

        {success && <div className="dashboard-success">{success}</div>}

        {/* FORMULARIO */}

        {showForm && (
          <section className="student-form-card">
            <h3>{editingGrade ? "Editar nota" : "Nueva nota"}</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Matrícula</label>

                  <select
                    name="enrollment_id"
                    value={form.enrollment_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona una matrícula</option>

                    {enrollments.map((enrollment) => (
                      <option key={enrollment.id} value={enrollment.id}>
                        {getStudentName(enrollment)} —{" "}
                        {getCourseName(enrollment)} —{" "}
                        {enrollment.academic_period}
                      </option>
                    ))}
                  </select>

                  {enrollments.length === 0 && (
                    <small>No hay matrículas disponibles.</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Tipo de evaluación</label>

                  <input
                    type="text"
                    name="assessment_type"
                    value={form.assessment_type}
                    onChange={handleChange}
                    placeholder="Ejemplo: Examen parcial"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nota</label>

                  <input
                    type="number"
                    name="score"
                    value={form.score}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    step="0.01"
                    placeholder="0 - 20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de evaluación</label>

                  <input
                    type="date"
                    name="assessment_date"
                    value={form.assessment_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Comentarios</label>

                  <textarea
                    name="comments"
                    value={form.comments}
                    onChange={handleChange}
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

        {/* DETALLE */}

        {showDetails && selectedGrade && (
          <section className="student-form-card">
            <div className="table-header">
              <h3>Detalle de nota</h3>

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

                <p>{getStudentName(selectedGrade.enrollment)}</p>
              </div>

              <div>
                <strong>Curso</strong>

                <p>{getCourseName(selectedGrade.enrollment)}</p>
              </div>

              <div>
                <strong>Docente</strong>

                <p>{getTeacherName(selectedGrade.enrollment)}</p>
              </div>

              <div>
                <strong>Tipo de evaluación</strong>

                <p>{selectedGrade.assessment_type}</p>
              </div>

              <div>
                <strong>Nota</strong>

                <p className={getScoreClass(selectedGrade.score)}>
                  {selectedGrade.score}
                </p>
              </div>

              <div>
                <strong>Fecha</strong>

                <p>
                  {selectedGrade.assessment_date
                    ? selectedGrade.assessment_date.substring(0, 10)
                    : "—"}
                </p>
              </div>

              <div>
                <strong>Comentarios</strong>

                <p>{selectedGrade.comments || "Sin comentarios"}</p>
              </div>

              <div>
                <strong>ID</strong>

                <p>{selectedGrade.id}</p>
              </div>
            </div>
          </section>
        )}

        {/* TABLA */}

        <section className="table-card">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar estudiante por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCurrentPage(1);
                  loadGrades(1, search);
                }
              }}
            />

            <button
              className="primary-button"
              onClick={() => {
                setCurrentPage(1);
                loadGrades(1, search);
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

                  /*
                   * Se pasa "" directamente en vez de depender
                   * del estado "search", que todavía no se
                   * habría actualizado en este mismo render.
                   */
                  loadGrades(1, "");
                }}
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="table-header">
            <div>
              <h3>Lista de notas</h3>

              <span>{totalGrades} notas en total</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Cargando notas...</div>
          ) : grades.length === 0 ? (
            <div className="empty-message">No hay notas registradas.</div>
          ) : (
            <>
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
                        <td>{grade.id}</td>

                        <td>{getStudentName(grade.enrollment)}</td>

                        <td>{getCourseName(grade.enrollment)}</td>

                        <td>{grade.assessment_type}</td>

                        <td>
                          <strong className={getScoreClass(grade.score)}>
                            {grade.score}
                          </strong>
                        </td>

                        <td>
                          {grade.assessment_date
                            ? grade.assessment_date.substring(0, 10)
                            : "—"}
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              className="view-button"
                              onClick={() => handleView(grade)}
                            >
                              Ver
                            </button>

                            <button
                              className="edit-button"
                              onClick={() => handleEdit(grade)}
                            >
                              Editar
                            </button>

                            <button
                              className="delete-button"
                              onClick={() => handleDelete(grade)}
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
                    <button
                      className="pagination-button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      ←
                    </button>

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

                    <button
                      className="pagination-button"
                      disabled={currentPage >= lastPage}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      →
                    </button>
                  </div>

                  <div className="pagination-info">
                    Página <strong>{currentPage}</strong> de{" "}
                    <strong>{lastPage}</strong>
                    {" · "}
                    Mostrando <strong>{grades.length}</strong> de{" "}
                    <strong>{totalGrades}</strong> notas
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

export default Grades;