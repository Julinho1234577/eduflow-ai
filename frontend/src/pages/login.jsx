import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await login(email, password);

            const role = data.user?.role;

            if (role === "admin") {
                navigate("/admin");
            } else if (role === "docente") {
                navigate("/docente");
            } else if (role === "estudiante") {
                navigate("/estudiante");
            } else {
                navigate("/");
            }
        } catch (error) {
            console.error(error);

            if (error.response?.status === 401) {
                setError("Correo o contraseña incorrectos.");
            } else {
                setError(
                    error.response?.data?.message ||
                    "No se pudo conectar con el servidor."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>EduFlow AI</h1>
                    <p>Plataforma educativa inteligente</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Correo electrónico</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;