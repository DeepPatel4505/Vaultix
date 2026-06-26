import AuthContext from "../context/authContext";
import { useState, useMemo, useEffect, useCallback } from "react";
import { setAuthToken, setupInterceptors } from "../lib/api";
import {
    loginRequest,
    registerRequest,
    logoutRequest,
    refreshRequest,
    getMeRequest
} from "../lib/auth";

const AuthProvider = ({ children }) => {
    const [accessToken, setAccessTokenState] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const setAccessToken = useCallback((token) => {
        setAccessTokenState(token);
        setAuthToken(token);
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const response = await getMeRequest();
            setUser(response.data);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch user:", err);
            throw err;
        }
    }, []);

    const refresh = useCallback(async () => {
        try {
            const response = await refreshRequest();
            const token = typeof response.data === "string" ? response.data : response.data.accessToken;
            setAccessToken(token);
            return token;
        } catch (err) {
            setAccessToken(null);
            setUser(null);
            throw err;
        }
    }, [setAccessToken]);

    const login = useCallback(async (email, password) => {
        try {
            const response = await loginRequest(email, password);
            const token = response.data.accessToken;
            setAccessToken(token);
            await fetchUser();
        } catch (err) {
            setAccessToken(null);
            setUser(null);
            throw err;
        }
    }, [setAccessToken, fetchUser]);

    const register = useCallback(async (username, email, password) => {
        try {
            const response = await registerRequest(username, email, password);
            const token = response.data.accessToken;
            setAccessToken(token);
            await fetchUser();
        } catch (err) {
            setAccessToken(null);
            setUser(null);
            throw err;
        }
    }, [setAccessToken, fetchUser]);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } catch (err) {
            console.warn("Logout request failed:", err);
        } finally {
            setAccessToken(null);
            setUser(null);
        }
    }, [setAccessToken]);

    // Setup interceptors
    useEffect(() => {
        setupInterceptors(
            (newToken) => {
                setAccessToken(newToken);
            },
            () => {
                setAccessToken(null);
                setUser(null);
            }
        );
    }, [setAccessToken]);

    // Startup Session Initialization
    useEffect(() => {
        const initializeSession = async () => {
            try {
                const token = await refresh();
                if (token) {
                    await fetchUser();
                }
            } catch (err) {
                console.warn("No active session initialized:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeSession();
    }, [refresh, fetchUser]);

    const isAuthenticated = useMemo(() => !!accessToken, [accessToken]);

    const value = useMemo(() => ({
        accessToken,
        token: accessToken, // Alias for backward compatibility
        user: user?.username || null, // UI components expect the username string
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        refresh,
        fetchUser
    }), [accessToken, user, loading, isAuthenticated, login, logout, register, refresh, fetchUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;