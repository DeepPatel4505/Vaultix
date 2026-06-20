import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../context/WorkspaceContext";

const Layout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    const {
        files,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        isUploading,
        uploadFile,
        uploadProgress,
        uploadStatus,
        uploadFileName,
        uploadError,
        error,
        setError,
    } = useWorkspace();

    const [showProgressWidget, setShowProgressWidget] = useState(false);

    useEffect(() => {
        if (uploadStatus && uploadStatus !== "None") {
            setShowProgressWidget(true);
        }
    }, [uploadStatus]);

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Theme Management
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("theme");
                if (stored) return stored;
            } catch (e) {
                console.warn("localStorage is not accessible:", e);
            }
            try {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            } catch (e) {
                return "light";
            }
        }
        return "light";
     });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        try {
            localStorage.setItem("theme", theme);
        } catch (e) {
            console.warn("localStorage is not accessible:", e);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    // Click outside profile dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname, activeView]);

    // Keyboard shortcut to focus search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                const searchInput = document.getElementById("toolbar-search-input");
                searchInput?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleUploadFile = async (e) => {
        const fileObj = e.target.files?.[0] ?? null;
        if (!fileObj) return;

        try {
            await uploadFile(fileObj);
            setActiveView("workspace");
            navigate("/files");
        } catch (err) {
            console.error("Upload error in toolbar:", err);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Calculate Dynamic Storage Usage
    const totalSize = files.reduce((acc, f) => acc + Number(f.size || 0), 0);
    const storageLimit = 1* 1024 * 1024 * 1024; // 1 GB mock storage limit
    const storagePercentage = Math.min((totalSize / storageLimit) * 100, 100);

    const sizeDisplay = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatFileName = (name) => {
        if (!name) return "file";
        const maxLen = 22; // Maximum length before trimming
        if (name.length <= maxLen) return name;
        const lastDot = name.lastIndexOf(".");
        if (lastDot !== -1 && name.length - lastDot <= 6) {
            const ext = name.substring(lastDot);
            const base = name.substring(0, lastDot);
            return `${base.substring(0, maxLen - ext.length - 3)}...${ext}`;
        }
        return `${name.substring(0, maxLen - 3)}...`;
    };

    const userInitial = user ? user.substring(0, 1).toUpperCase() : "U";

    // Navigation Category Helper
    const handleCategoryClick = (viewName) => {
        setActiveView(viewName);
        navigate("/files");
    };

    const getViewTitle = () => {
        if (location.pathname === "/upload") return "Upload Hub";
        switch (activeView) {
            case "shared": return "Shared Files";
            case "favorites": return "Starred";
            case "trash": return "Trash Bin";
            default: return "Workspace";
        }
    };

    const navItemClass = (viewName) => {
        const isActive = activeView === viewName && location.pathname === "/files";
        return `w-full flex items-center justify-between rounded-md px-4 py-2 text-sm font-semibold select-none cursor-pointer transition-colors duration-150 group border border-transparent ${
            isActive
                ? "bg-surface-soft text-primary border-hairline"
                : "text-muted hover:bg-surface-soft hover:text-ink"
        }`;
    };

    const sidebarContent = (
        <div className="flex h-full flex-col justify-between p-4.5 bg-canvas border-r border-hairline text-ink h-screen">
            {/* Sidebar Upper Container */}
            <div className="space-y-6">
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-2 px-1.5 cursor-pointer select-none" onClick={() => navigate("/")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                        <path d="M5 5l7 14 7-14" />
                    </svg>
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                        Vaultix
                    </span>
                </div>

                {/* Sidebar Navigation Options */}
                <div className="space-y-1.5">
                    <p className="px-1.5 text-[10px] font-bold text-muted-soft tracking-wider uppercase mb-2 select-none">Navigation</p>
                    
                    <button
                        onClick={() => handleCategoryClick("workspace")}
                        className={navItemClass("workspace")}
                        aria-label="Navigate to workspace files"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span>Workspace</span>
                        </div>
                        <span className="font-mono text-xs text-muted-soft bg-surface-card border border-hairline/50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {files.length}
                        </span>
                    </button>

                    <button
                        onClick={() => handleCategoryClick("shared")}
                        className={navItemClass("shared")}
                        aria-label="Navigate to shared files"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span>Shared</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleCategoryClick("favorites")}
                        className={navItemClass("favorites")}
                        aria-label="Navigate to starred files"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.253.588 1.81l-3.974 2.879a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.88a1 1 0 00-1.176 0l-3.976 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 12.08c-.772-.557-.373-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                            </svg>
                            <span>Starred</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleCategoryClick("trash")}
                        className={navItemClass("trash")}
                        aria-label="Navigate to trash bin"
                    >
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Trash Bin</span>
                        </div>
                    </button>
                </div>

                {/* Secondary navigation for upload hub */}
                <div className="space-y-1.5">
                    <p className="px-1.5 text-[10px] font-bold text-muted-soft tracking-wider uppercase mb-2 select-none">Tools</p>
                    <NavLink
                        to="/upload"
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 rounded-md px-4 py-2 text-sm font-semibold select-none cursor-pointer transition-colors duration-150 border border-transparent ${
                                isActive
                                    ? "bg-surface-soft text-primary border-hairline"
                                    : "text-muted hover:bg-surface-soft hover:text-ink"
                            }`
                        }
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Upload Hub</span>
                    </NavLink>
                </div>
            </div>

            {/* Sidebar Bottom Container */}
            <div className="space-y-5 pt-4.5 border-t border-hairline/60">
                {/* Storage stats */}
                <div className="space-y-2 px-1 text-left select-none">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted">Storage used</span>
                        <span className="text-ink font-mono">{sizeDisplay(totalSize)}</span>
                    </div>
                    
                    <div className="h-2 w-full bg-surface-soft border border-hairline/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${storagePercentage}%` }}
                        />
                    </div>
                    
                    <p className="text-[10px] text-muted-soft">
                        {storagePercentage.toFixed(0)}% of {1} GB storage used.
                    </p>
                </div>

                {/* User Info / Profile trigger */}
                <div className="relative flex items-center justify-between border border-hairline bg-surface-soft rounded-lg p-2.5 gap-2.5" ref={dropdownRef}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            onClick={() => setIsProfileOpen((p) => !p)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas border border-hairline text-xs font-bold text-primary hover:border-ink cursor-pointer focus-visible:ring-1 focus-visible:ring-primary"
                            aria-label="User account actions"
                        >
                            {userInitial}
                        </button>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink leading-none">{user || "User"}</p>
                            <p className="truncate text-[10px] text-muted-soft mt-1 font-mono">Personal Plan</p>
                        </div>
                    </div>

                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="rounded p-1.5 hover:bg-canvas border border-transparent hover:border-hairline text-muted hover:text-ink cursor-pointer"
                    >
                        {theme === "dark" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    {/* Minimal Popup Menu */}
                    {isProfileOpen && (
                        <div className="absolute left-0 bottom-full mb-2 w-full rounded-lg border border-hairline bg-canvas shadow-lg p-2 space-y-1 select-none text-left animate-slide-in-right z-50">
                            <div className="px-2.5 py-1.5 border-b border-hairline/60">
                                <p className="text-[10px] font-bold text-muted-soft tracking-wider uppercase leading-none">Account</p>
                                <p className="mt-1.5 truncate text-xs font-semibold text-ink leading-none">{user || "Workspace Owner"}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-error hover:bg-error/5 cursor-pointer transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Sign out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-screen flex bg-canvas text-ink overflow-hidden transition-colors duration-200">
            {/* Hidden native input file for toolbar upload */}
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleUploadFile}
                className="hidden"
            />

            {/* Desktop Sidebar Panel - 64 wide (16rem) */}
            <aside className="hidden md:block w-64 flex-shrink-0 h-full">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Slide Drawer */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="fixed inset-0 bg-primary/20 backdrop-blur-xs transition-opacity"
                        aria-hidden="true"
                    />

                    {/* Drawer container */}
                    <div className="relative w-64 max-w-xs flex-1 flex flex-col bg-canvas shadow-xl animate-slide-in-right">
                        {sidebarContent}
                        
                        {/* Drawer Close Control */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="absolute top-4.5 right-4 rounded-md p-1.5 bg-surface-soft border border-hairline/60 hover:bg-surface-strong/60 transition-colors"
                            aria-label="Close menu drawer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Application Container */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {/* Top Toolbar Navigation Header - Height 16 (64px) */}
                <header className="h-16 border-b border-hairline bg-canvas flex items-center justify-between px-4.5 md:px-6 flex-shrink-0 z-10 select-none">
                    <div className="flex items-center gap-3">
                        {/* Hamburger toggle on mobile */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="md:hidden rounded-md p-1.5 border border-hairline/60 hover:bg-surface-soft transition-colors cursor-pointer text-muted hover:text-ink focus-visible:ring-1 focus-visible:ring-primary"
                            aria-label="Toggle menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Title header */}
                        <h2 className="font-display text-base font-bold tracking-tight text-ink uppercase">
                            {getViewTitle()}
                        </h2>
                    </div>

                    {/* Toolbar Unified Actions (Search & Upload) */}
                    <div className="flex items-center gap-3.5 max-w-[55%] md:max-w-md w-full justify-end">
                        {/* Search Input Box */}
                        {location.pathname === "/files" && (
                            <div className="relative flex-1 max-w-sm hidden sm:block">
                                <span className="absolute left-3 top-2.5 text-muted shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    id="toolbar-search-input"
                                    type="text"
                                    placeholder="Search in view… (Press '/' to focus)"
                                    value={searchQuery}
                                    spellCheck={false}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-md border border-hairline pl-9 pr-9 py-1.5 text-sm bg-canvas text-ink transition-colors focus:border-ink focus:outline-none"
                                />
                                <kbd className="hidden lg:inline-flex absolute right-3 top-2 h-4.5 select-none items-center gap-1 rounded border border-hairline bg-surface-soft px-1.5 font-mono text-[9px] font-semibold text-muted-soft leading-none">
                                    /
                                </kbd>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-2.5 text-muted hover:text-primary rounded"
                                        aria-label="Clear query search"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Toolbar Upload Button - Increased size and padding */}
                        <button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="
                                flex items-center justify-center gap-2 rounded bg-primary px-4.5 py-2 text-xs font-bold text-on-primary hover:bg-primary-hover transition-colors focus-visible:ring-1 focus-visible:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 select-none
                            "
                            aria-label="Upload a file"
                        >
                            {isUploading ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-canvas border-t-transparent" />
                                    <span className="hidden xs:inline">Uploading…</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Upload</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Content Area Portal */}
                <main className="flex-1 w-full bg-canvas overflow-y-auto relative">
                    {error && (
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 rounded bg-error/9 border border-error text-white text-xs font-semibold px-4.5 py-2 shadow flex items-center gap-2 animate-slide-in-right">
                            <span>⚠️ {error}</span>
                            <button onClick={() => setError("")} className="font-bold hover:opacity-85" aria-label="Close error toast">×</button>
                        </div>
                    )}
                    <Outlet />
                </main>
            </div>

            {/* Global Floating Upload Progress Widget */}
            {showProgressWidget && uploadStatus !== "None" && location.pathname !== "/upload" && (
                <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-hairline bg-surface-card shadow-2xl p-4 flex flex-col gap-3 select-none animate-slide-in-right transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-soft">
                            {uploadStatus === "Uploading" && "Uploading to Workspace"}
                            {uploadStatus === "Finalizing" && "Finalizing Upload"}
                            {uploadStatus === "Success" && "Upload Complete"}
                            {uploadStatus === "Error" && "Upload Failed"}
                        </span>
                        <button
                            onClick={() => setShowProgressWidget(false)}
                            className="text-muted hover:text-ink hover:bg-surface-soft p-1 rounded-md transition-colors cursor-pointer"
                            aria-label="Dismiss progress panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* File info row */}
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg ${
                            uploadStatus === "Success"
                                ? "bg-success/10 border-success/20 text-success"
                                : uploadStatus === "Error"
                                    ? "bg-error/10 border-error/20 text-error"
                                    : "bg-canvas border-hairline text-muted"
                        }`}>
                            {uploadStatus === "Uploading" && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            {uploadStatus === "Finalizing" && (
                                <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            )}
                            {uploadStatus === "Success" && "✓"}
                            {uploadStatus === "Error" && "⚠️"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink leading-tight" title={uploadFileName}>
                                {formatFileName(uploadFileName)}
                            </p>
                            <p className="text-[10px] text-muted-soft mt-1 leading-snug">
                                {uploadStatus === "Uploading" && `Progress: ${uploadProgress}%`}
                                {uploadStatus === "Finalizing" && "Processing on server..."}
                                {uploadStatus === "Success" && "Saved to vault"}
                                {uploadStatus === "Error" && (uploadError || "Failed to save file")}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {(uploadStatus === "Uploading" || uploadStatus === "Finalizing") && (
                        <div className="w-full">
                            <div className="h-1.5 w-full bg-surface-soft border border-hairline/60 rounded-full overflow-hidden relative">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        uploadStatus === "Finalizing" 
                                            ? "bg-primary animate-pulse w-full" 
                                            : "bg-primary"
                                    }`}
                                    style={{ width: uploadStatus === "Finalizing" ? "100%" : `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Layout;
