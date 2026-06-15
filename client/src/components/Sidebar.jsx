import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import api from "../lib/api";

const Sidebar = ({ isOpen, onClose, theme, toggleTheme }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [totalFiles, setTotalFiles] = useState(0);

    const fetchTotalFiles = async () => {
        try {
            const response = await api.get("/file");
            setTotalFiles(response.data.length);
        } catch (error) {
            console.error("Failed to fetch total files:", error);
        }
    };

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchTotalFiles();
        });
    }, [location.pathname]); // re-fetch files count when path changes

    const handleLogout = () => {
        logout();
        navigate("/login");
        if (onClose) onClose();
    };

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    const getTabClassName = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
            isActive
                ? "bg-surface-soft text-primary font-semibold border-l-2 border-primary"
                : "text-muted hover:bg-surface-soft hover:text-primary"
        }`;

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-hairline bg-canvas p-6 transition-transform duration-300 ease-in-out md:static md:translate-x-0
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
            `}
            aria-label="Main navigation"
        >
            {/* Header / Brand */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                        Vaultix
                    </span>
                    <p className="text-[11px] text-muted-soft tracking-wider mt-1">WORKSPACE</p>
                </div>

                {/* Theme Toggle & Close Control */}
                <div className="flex items-center gap-1">
                    {/* Desktop Theme Switcher */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="rounded-md p-1.5 hover:bg-surface-soft text-muted hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                        {theme === "dark" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    {/* Mobile Close Button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="rounded-md p-1.5 hover:bg-surface-soft md:hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                            aria-label="Close menu"
                        >
                            <svg
                                xmlns="http://www.w3.org/2500/svg"
                                className="h-5 w-5 text-muted hover:text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-1 flex-col gap-1.5">
                <NavLink to="/files" className={getTabClassName} onClick={handleLinkClick}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                    </svg>
                    <span>Files</span>
                </NavLink>
            </nav>

            {/* Footer Statistics & Actions */}
            <div className="mt-auto pt-6 border-t border-hairline">
                <div className="rounded-lg bg-surface-soft p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-success" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                                Total Files
                            </span>
                        </div>
                        <span className="font-mono text-sm font-semibold text-primary">{totalFiles}</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-error bg-canvas px-4 py-2 text-sm font-semibold text-error transition-all duration-150 hover:bg-error/5 active:scale-98 cursor-pointer focus-visible:ring-2 focus-visible:ring-error"
                    type="button"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
