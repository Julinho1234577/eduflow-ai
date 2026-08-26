import Students from "./pages/admin/Students";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import AdminDashboard from "./pages/admin/AdminDashboard";

function Docente() {
    return (
        <div>
            <h1>Panel del Docente</h1>
            <p>Bienvenido a EduFlow AI.</p>
        </div>
    );
}

function Estudiante() {
    return (
        <div>
            <h1>Panel del Estudiante</h1>
            <p>Bienvenido a EduFlow AI.</p>
        </div>
    );
}

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<Login />}
            />

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
                path="/docente"
                element={
                    <ProtectedRoute roles={["docente"]}>
                        <Docente />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/estudiante"
                element={
                    <ProtectedRoute roles={["estudiante"]}>
                        <Estudiante />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />
        </Routes>
    );
}

export default App;