import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = window.sessionStorage.getItem("username");
        const storedEmail = window.sessionStorage.getItem("email");
        const storedPassword = window.sessionStorage.getItem("password");

        if (storedUsername) setUsername(storedUsername);
        if (storedEmail) setEmail(storedEmail);
        if (storedPassword) setPassword(storedPassword);

        return () => {
            window.sessionStorage.removeItem("username");
            window.sessionStorage.removeItem("email");
            window.sessionStorage.removeItem("password");
        };
    }, []);

    const handleValueChange = (e, stateModifier) => {
        const { name, value } = e.target;
        window.sessionStorage.setItem(name, value);
        stateModifier(value);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await api.post("/auth/register", {
                username,
                email,
                password,
            });

            register(response.data, response.data.token);
            navigate("/files");
        } catch (registerError) {
            const message =
                registerError?.response?.data?.message ||
                registerError?.response?.data ||
                "Registration failed";

            setError(message);
        }
    };

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
                        Create your account
                    </h1>
                    <p className="mt-2 text-xs text-muted">
                        Get started with free file storage and quick sharing links.
                    </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            Username
                        </label>
                        <input
                            className="w-full rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder-muted-soft transition-colors focus:border-primary focus:outline-none"
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            spellCheck={false}
                            autoComplete="username"
                            placeholder="username"
                            onChange={(e) => handleValueChange(e, setUsername)}
                        />
                    </div>

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
                            autoComplete="new-password"
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
                        Register
                    </button>

                    <p className="text-xs text-muted text-center mt-4">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-primary hover:underline hover:text-primary-hover"
                        >
                            Sign In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;