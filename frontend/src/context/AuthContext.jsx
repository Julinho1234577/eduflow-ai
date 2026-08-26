import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setLoading(false);
            return;
        }

        api.get("/me")
            .then((response) => {
                // /me devuelve directamente al usuario
                setUser(response.data);
            })
            .catch(() => {
                localStorage.removeItem("token");
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/login", {
            email,
            password,
        });

        const token = response.data.token;

        localStorage.setItem("token", token);

        // /login devuelve { token, user }
        setUser(response.data.user);

        return response.data;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }

        localStorage.removeItem("token");
        setUser(null);
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