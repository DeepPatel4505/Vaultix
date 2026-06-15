import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError("");

        try {
            const response = await api.post("/auth/login", { email, password });
            if (response.status === 200) {
                login(response.data.username, response.data.token);
                navigate("/files");
            } else {
                setError(response.data.message || "Login failed");
            }
        } catch (err) {
            console.error("Login request error:", err);
            setError(err.response?.data?.message || err.response?.data || "Unable to sign in. Please verify your credentials.");
        }
    };

    const handleValueChange = (e, stateModifier) => {
        const { name, value } = e.target;
        window.sessionStorage.setItem(name, value);
        stateModifier(value);
    };

    useEffect(() => {
        const storedEmail = window.sessionStorage.getItem("email");
        const storedPassword = window.sessionStorage.getItem("password");
        if (storedEmail) {
            setEmail(storedEmail);
        }
        if (storedPassword) {
            setPassword(storedPassword);
        }
    }, []);

    useEffect(() => {
        return () => {
            window.sessionStorage.removeItem("email");
            window.sessionStorage.removeItem("password");
        };
    }, []);

    return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-ink select-none">
            {/* Header Brand Wordmark */}
            <div className="mb-8 flex flex-col items-center">
                <span className="font-display text-xs uppercase tracking-[0.3em] font-semibold text-primary">
                    Vaultix
                </span>
            </div>

            <div className="w-full max-w-md bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
                <div className="text-center mb-6">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        Sign in to your account
                    </h1>
                    <p className="mt-2 text-xs text-muted">
                        Enter your credentials to access your personal storage vault.
                    </p>
                </div>

                <form
                    className="flex flex-col gap-4"
                    onSubmit={handleLogin}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleLogin(e);
                        }
                    }}
                >
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            Email Address
                        </label>
                        <input
                            className="w-full rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder-muted-soft transition-colors focus:border-primary focus:outline-none"
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            spellCheck={false}
                            autoComplete="email"
                            placeholder="name@example.com"
                            onChange={(e) => handleValueChange(e, setEmail)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            Password
                        </label>
                        <input
                            className="w-full rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder-muted-soft transition-colors focus:border-primary focus:outline-none"
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            spellCheck={false}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            onChange={(e) => handleValueChange(e, setPassword)}
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-error/5 border border-error/20 p-3 text-xs text-error font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] cursor-pointer mt-2"
                        type="submit"
                    >
                        Sign In
                    </button>

                    <p className="text-xs text-muted text-center mt-4">
                        New to Vaultix?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-primary hover:underline hover:text-primary-hover"
                        >
                            Create an account
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
