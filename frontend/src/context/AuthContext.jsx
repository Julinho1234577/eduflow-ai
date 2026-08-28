import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get("/me");

                setUser(response.data);
            } catch (error) {
                console.error(
                    "Error verificando sesión:",
                    error.response?.status,
                    error.response?.data
                );

                // Solo eliminamos el token si realmente
                // la sesión/token ya no es válida.
                if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                ) {
                    localStorage.removeItem("token");
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/login", {
            email,
            password,
        });

        const token = response.data.token;
        const loggedUser = response.data.user;

        localStorage.setItem("token", token);
        setUser(loggedUser);

        return response.data;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error(
                "Error al cerrar sesión:",
                error.response?.data || error.message
            );
        } finally {
            localStorage.removeItem("token");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}