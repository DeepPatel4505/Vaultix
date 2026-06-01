import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../lib/api";

const Sidebar = () => {
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
        fetchTotalFiles();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getTabClassName = ({ isActive }) =>
        `sidebar__tab ${isActive ? "sidebar__tab--active" : ""}`;

    return (
        <aside className="sidebar" aria-label="Main navigation">
            <span
                className="
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-(--border)
                                bg-(--surface)
                                px-3
                                py-1
                                mb-6
                                text-xs
                                font-medium
                                uppercase
                                tracking-[0.25em]
                                text-(--primary)
                            "
            >
                File Share System
            </span>
            <nav className="sidebar__nav">
                <motion.div
                    animate={{
                        y: location.pathname === "/files" ? 0 : 48,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="sidebar__indicator"
                    aria-hidden
                />

                <NavLink to="/files" className={getTabClassName}>
                    Files
                </NavLink>

                <NavLink to="/upload" className={getTabClassName}>
                    Upload
                </NavLink>
            </nav>

            <div className="sidebar__footer">
                <div className="flex flex-row items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                        <div
                                className="
                                h-3
                                w-3
                                rounded-full
                                bg-(--primary)
                            "
                            />
                        <p
                            className="
                                    text-xs
                                    uppercase
                                    tracking-[0.15em]
                                    text-(--foreground-muted)
                                "
                        >
                            Total Files
                        </p>
                    </div>

                    <p
                        className="
                                    text-xl
                                    font-semibold
                                    text-(--foreground)
                                "
                    >
                        {totalFiles}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="sidebar__logout"
                    type="button"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
