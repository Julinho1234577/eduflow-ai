import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// =============================
// ADMIN
// =============================
import Grades from "./pages/admin/Grades";
import Login from "./pages/login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import Teachers from "./pages/admin/Teachers";
import Courses from "./pages/admin/Courses";
import Enrollments from "./pages/admin/Enrollments";
import Attendances from "./pages/admin/Attendances";

// =============================
// DOCENTE
// =============================
import DocenteCourses from "./pages/docente/DocenteCourses";
import DocenteDashboard from "./pages/docente/DocenteDashboard";
import DocenteGrades from "./pages/docente/DocenteGrades";
import DocenteStudents from "./pages/docente/DocenteStudents";
import DocenteAttendances from "./pages/docente/DocenteAttendances";

// =============================
// ESTUDIANTE
// =============================
import EstudianteDashboard from "./pages/estudiante/EstudianteDashboard";
import EstudianteCourses from "./pages/estudiante/EstudianteCourses";
import EstudianteGrades from "./pages/estudiante/EstudianteGrades";
import EstudianteAttendances from "./pages/estudiante/EstudianteAttendances";


// ============================================================================
// RUTA PROTEGIDA
// ============================================================================

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: "40px" }}>
                Cargando...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
}


// ============================================================================
// APP
// ============================================================================

function App() {
    return (
        <Routes>

            {/* =====================================================
                LOGIN
            ====================================================== */}

            <Route
                path="/login"
                element={<Login />}
            />


            {/* =====================================================
                ADMIN
            ====================================================== */}

            <Route
                path="/admin"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/students"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <Students />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/teachers"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <Teachers />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/courses"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <Courses />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/enrollments"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <Enrollments />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/grades"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <Grades />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/attendances"
                element={
                    <ProtectedRoute roles={["admin"]}>
                        <Attendances />
                    </ProtectedRoute>
                }
            />


            {/* =====================================================
                DOCENTE
            ====================================================== */}

            <Route
                path="/docente"
                element={
                    <ProtectedRoute roles={["docente"]}>
                        <DocenteDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/docente/courses"
                element={
                    <ProtectedRoute roles={["docente"]}>
                        <DocenteCourses />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/docente/students"
                element={
                    <ProtectedRoute roles={["docente"]}>
                        <DocenteStudents />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/docente/grades"
                element={
                    <ProtectedRoute roles={["docente"]}>
                        <DocenteGrades />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/docente/attendances"
                element={
                    <ProtectedRoute roles={["docente"]}>
                        <DocenteAttendances />
                    </ProtectedRoute>
                }
            />


            {/* =====================================================
                ESTUDIANTE
            ====================================================== */}

            <Route
                path="/estudiante"
                element={
                    <ProtectedRoute roles={["estudiante"]}>
                        <EstudianteDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/estudiante/courses"
                element={
                    <ProtectedRoute roles={["estudiante"]}>
                        <EstudianteCourses />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/estudiante/grades"
                element={
                    <ProtectedRoute roles={["estudiante"]}>
                        <EstudianteGrades />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/estudiante/attendances"
                element={
                    <ProtectedRoute roles={["estudiante"]}>
                        <EstudianteAttendances />
                    </ProtectedRoute>
                }
            />


            {/* =====================================================
                RUTA PRINCIPAL
            ====================================================== */}

            <Route
                path="/"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />


            {/* =====================================================
                404
            ====================================================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

        </Routes>
    );
}

export default App;