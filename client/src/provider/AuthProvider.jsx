import AuthContext from "../context/authContext";
import { useState, useMemo, useEffect, useCallback } from "react";
import api, { setupInterceptors } from "../lib/api";

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = window.localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState(() => window.localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    const login = useCallback((userData, tokenData) => {
        setUser(userData);
        setToken(tokenData);
        window.localStorage.setItem("user", JSON.stringify(userData));
        window.localStorage.setItem("token", tokenData);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        window.localStorage.removeItem("user");
        window.localStorage.removeItem("token");
    }, []);

    const register = useCallback((userData, tokenData) => {
        setUser(userData);
        setToken(tokenData);
        window.localStorage.setItem("user", JSON.stringify(userData));
        window.localStorage.setItem("token", tokenData);
    }, []);

    const updateToken = useCallback((newToken) => {
        setToken(newToken);
        window.localStorage.setItem("token", newToken);
    }, []);

    useEffect(() => {
        setupInterceptors(
            (newToken) => {
                updateToken(newToken);
            },
            () => {
                logout();
            }
        );
    }, [logout, updateToken]);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const response = await api.post("/auth/refresh");
                const { accessToken } = response.data;
                window.localStorage.setItem("token", accessToken);

                const userResponse = await api.get("/auth/me");
                const userData = userResponse.data;

                login(userData.username, accessToken);
            } catch (err) {
                console.warn("No active session initialized:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [login, logout]);

    const value = useMemo(() => ({
        user,
        token,
        loading,
        login,
        logout,
        register
    }), [user, token, loading, login, logout, register]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;