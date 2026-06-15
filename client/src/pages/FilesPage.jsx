import { useState, useMemo } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import Card from "../components/Card";
import FilePreviewPanel from "../components/FilePreviewPanel";
import api from "../lib/api";

// Helper function to build virtual file system tree on client
const buildFolderTree = (files) => {
    const root = { name: "Root", files: [], folders: {} };
    for (const file of files) {
        const parts = file.fileName.split("/");
        let current = root;

        // Walk down folder path parts
        for (let i = 0; i < parts.length - 1; i++) {
            const folderName = parts[i];
            if (!current.folders[folderName]) {
                current.folders[folderName] = { name: folderName, files: [], folders: {} };
            }
            current = current.folders[folderName];
        }

        // Add actual file meta
        current.files.push(file);
    }
    return root;
};

// Retrieve sub-folder node by path array
const getFolderNode = (tree, path) => {
    let current = tree;
    for (const segment of path) {
        if (current && current.folders[segment]) {
            current = current.folders[segment];
        } else {
            return null;
        }
    }
    return current;
};

const getExtension = (fileName) => {
    return fileName?.split(".").pop()?.toLowerCase() ?? "";
};

const getFileTypeDetails = (fileName = "") => {
    const extension = getExtension(fileName);

    if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(extension)) {
        return {
            type: "IMAGE",
            bgColor: "bg-badge-orange/10 text-badge-orange border border-badge-orange/20",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        };
    }
    if (["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(extension)) {
        return {
            type: "DOCUMENT",
            bgColor: "bg-badge-violet/10 text-badge-violet border border-badge-violet/20",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        };
    }
    if (["zip", "rar", "tar", "gz", "7z", "iso"].includes(extension)) {
        return {
            type: "ARCHIVE",
            bgColor: "bg-badge-pink/10 text-badge-pink border border-badge-pink/20",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            )
        };
    }
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
        return {
            type: "VIDEO",
            bgColor: "bg-brand-accent/10 text-brand-accent border border-brand-accent/20",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )
        };
    }
    if (["js", "ts", "json", "html", "css", "cs", "py", "sh", "go", "rb"].includes(extension)) {
        return {
            type: "CODE",
            bgColor: "bg-badge-emerald/10 text-badge-emerald border border-badge-emerald/20",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            )
        };
    }

    return {
        type: extension.toUpperCase() || "FILE",
        bgColor: "bg-surface-soft text-muted border border-hairline",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        )
    };
};

const formatDate = (value) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
    }).format(date);
};

const formatSize = (bytes) => {
    const sizeInBytes = Number(bytes ?? 0);
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FilesPage = () => {
    const {
        files,
        trash,
        isLoading,
        searchQuery,
        activeView,
        selectedFile,
        setSelectedFile,
        favorites,
        shared,
        toggleFavorite,
        toggleShared,
        moveToTrash,
        restoreFromTrash,
        deletePermanently,
    } = useWorkspace();

    // View Navigation States
    const [currentPath, setCurrentPath] = useState([]); // Array of directory path segments
    const [activeTab, setActiveTab] = useState("all"); // all, images, documents, videos, others
    const [sortBy, setSortBy] = useState("date-desc"); // name-asc, name-desc, date-desc, date-asc, size-desc
    const [viewLayout, setViewLayout] = useState("list"); // list, grid
    const [viewMode, setViewMode] = useState("folders"); // folders, flat (only applies to Workspace view)
    const [downloadingIds, setDownloadingIds] = useState({});

    // Download Handler
    const onDownload = async (id, fileName) => {
        setDownloadingIds((prev) => ({ ...prev, [id]: true }));
        try {
            const response = await api.get(`/file/download/${id}`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Unable to download file.");
        } finally {
            setDownloadingIds((prev) => ({ ...prev, [id]: false }));
        }
    };

    // Delete Soft/Hard handler
    const handleDelete = async (file, e) => {
        e?.stopPropagation();
        if (activeView === "trash") {
            const shouldDelete = window.confirm(`Delete "${file.fileName}" permanently? This cannot be undone.`);
            if (shouldDelete) {
                try {
                    await deletePermanently(file.id);
                } catch (err) {
                    alert("Failed to delete permanently.");
                }
            }
        } else {
            const shouldTrash = window.confirm(`Move "${file.fileName}" to Trash?`);
            if (shouldTrash) {
                moveToTrash(file);
            }
        }
    };

    // Restore from trash handler
    const handleRestore = (id, e) => {
        e?.stopPropagation();
        restoreFromTrash(id);
    };

    // Filter Files by current Active View Sidebar category
    const viewFilteredFiles = useMemo(() => {
        if (activeView === "trash") {
            return trash.map((t) => t.fileMeta);
        }
        if (activeView === "favorites") {
            return files.filter((f) => favorites.includes(f.id));
        }
        if (activeView === "shared") {
            return files.filter((f) => shared.includes(f.id) || Number(f.downloadCount || 0) > 0);
        }
        return files; // workspace
    }, [activeView, files, trash, favorites, shared]);

    // Filter by Tab (images, documents, videos, etc.)
    const tabFilteredFiles = useMemo(() => {
        if (activeTab === "all") return viewFilteredFiles;
        return viewFilteredFiles.filter((file) => {
            const ext = getExtension(file.fileName);
            if (activeTab === "images") {
                return ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext);
            }
            if (activeTab === "documents") {
                return ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(ext);
            }
            if (activeTab === "videos") {
                return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
            }
            if (activeTab === "others") {
                const known = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "pdf", "doc", "docx", "txt", "md", "rtf", "odt", "mp4", "mov", "avi", "mkv", "webm"];
                return !known.includes(ext);
            }
            return true;
        });
    }, [viewFilteredFiles, activeTab]);

    // Filter by Search Query (passed from Toolbar Context)
    const searchedFiles = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return tabFilteredFiles;
        return tabFilteredFiles.filter((file) =>
            file.fileName.toLowerCase().includes(query)
        );
    }, [tabFilteredFiles, searchQuery]);

    // Sort files
    const sortedFiles = useMemo(() => {
        return [...searchedFiles].sort((a, b) => {
            if (sortBy === "name-asc") return a.fileName.localeCompare(b.fileName);
            if (sortBy === "name-desc") return b.fileName.localeCompare(a.fileName);
            if (sortBy === "date-desc") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
            if (sortBy === "date-asc") return new Date(a.uploadedAt) - new Date(b.uploadedAt);
            if (sortBy === "size-desc") return Number(b.size || 0) - Number(a.size || 0);
            return 0;
        });
    }, [searchedFiles, sortBy]);

    // Build Folder Tree structure (Workspace View only, and when no search query active)
    const folderTree = useMemo(() => {
        return buildFolderTree(viewFilteredFiles);
    }, [viewFilteredFiles]);

    const currentFolderNode = useMemo(() => {
        return getFolderNode(folderTree, currentPath);
    }, [folderTree, currentPath]);

    // Sort Folder Files
    const displayFolderFiles = useMemo(() => {
        if (!currentFolderNode) return [];
        let items = currentFolderNode.files;

        // Apply Tab Filter in current directory
        if (activeTab !== "all") {
            items = items.filter((file) => {
                const ext = getExtension(file.fileName);
                if (activeTab === "images") {
                    return ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext);
                }
                if (activeTab === "documents") {
                    return ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(ext);
                }
                if (activeTab === "videos") {
                    return ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
                }
                if (activeTab === "others") {
                    const known = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "pdf", "doc", "docx", "txt", "md", "rtf", "odt", "mp4", "mov", "avi", "mkv", "webm"];
                    return !known.includes(ext);
                }
                return true;
            });
        }

        // Apply sort
        return [...items].sort((a, b) => {
            if (sortBy === "name-asc") return a.fileName.localeCompare(b.fileName);
            if (sortBy === "name-desc") return b.fileName.localeCompare(a.fileName);
            if (sortBy === "date-desc") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
            if (sortBy === "date-asc") return new Date(a.uploadedAt) - new Date(b.uploadedAt);
            if (sortBy === "size-desc") return Number(b.size || 0) - Number(a.size || 0);
            return 0;
        });
    }, [currentFolderNode, activeTab, sortBy]);

    const isSearchActive = searchQuery.trim().length > 0;
    const isRoot = currentPath.length === 0;

    // Navigation breadcrumb clicks
    const handleBreadcrumbClick = (index) => {
        setCurrentPath(currentPath.slice(0, index));
        setSelectedFile(null);
    };

    const handleFolderClick = (folderName) => {
        setCurrentPath([...currentPath, folderName]);
        setSelectedFile(null);
    };

    const isWorkspaceView = activeView === "workspace";
    const showDirectories = isWorkspaceView && viewMode === "folders" && !isSearchActive;

    // Define items to list based on view modes
    const finalDisplayFiles = showDirectories ? displayFolderFiles : sortedFiles;

    return (
        <div className="flex flex-col h-full bg-canvas text-ink relative">
            {/* Header Control Row (Dense Filters & Toggles) */}
            <div className="flex flex-wrap items-center justify-between border-b border-hairline/60 px-4 py-2 gap-2 flex-shrink-0 select-none bg-canvas/40 backdrop-blur-xs sticky top-0 z-10">
                {/* File Type Filter Tabs (Dense Navigation Switcher) */}
                <div className="inline-flex rounded bg-surface-soft p-0.5 border border-hairline/60">
                    {["all", "images", "documents", "videos", "others"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setSelectedFile(null);
                            }}
                            className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab
                                    ? "bg-canvas text-primary shadow-xs"
                                    : "text-muted hover:text-primary"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Right controls cluster */}
                <div className="flex items-center gap-2">
                    {/* Folder tree vs Flat list toggle (Workspace View only) */}
                    {isWorkspaceView && !isSearchActive && (
                        <div className="inline-flex rounded bg-surface-soft p-0.5 border border-hairline/60">
                            <button
                                onClick={() => setViewMode("folders")}
                                className={`rounded px-2 py-0.5.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${viewMode === "folders"
                                        ? "bg-canvas text-primary shadow-xs"
                                        : "text-muted hover:text-primary"
                                    }`}
                            >
                                Folders
                            </button>
                            <button
                                onClick={() => setViewMode("flat")}
                                className={`rounded px-2 py-0.5.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${viewMode === "flat"
                                        ? "bg-canvas text-primary shadow-xs"
                                        : "text-muted hover:text-primary"
                                    }`}
                            >
                                Flat List
                            </button>
                        </div>
                    )}

                    {/* Sorting dropdown Selector */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded border border-hairline bg-canvas px-2.5 py-1 text-[10px] font-bold text-ink transition-colors hover:border-muted focus:outline-none cursor-pointer"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="name-asc">Alphabetical (A-Z)</option>
                        <option value="name-desc">Alphabetical (Z-A)</option>
                        <option value="size-desc">Largest Size</option>
                    </select>

                    {/* List/Grid Layout Toggle */}
                    <div className="inline-flex rounded bg-surface-soft p-0.5 border border-hairline/60">
                        <button
                            onClick={() => setViewLayout("list")}
                            aria-label="Switch to list view"
                            className={`rounded p-1 transition-all cursor-pointer ${viewLayout === "list"
                                    ? "bg-canvas text-primary shadow-xs"
                                    : "text-muted hover:text-primary"
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewLayout("grid")}
                            aria-label="Switch to grid view"
                            className={`rounded p-1 transition-all cursor-pointer ${viewLayout === "grid"
                                    ? "bg-canvas text-primary shadow-xs"
                                    : "text-muted hover:text-primary"
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Folder Breadcrumb Row (Workspace Folder Mode only) */}
            {showDirectories && (
                <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-1 px-4 py-1.5 text-[11px] font-bold text-muted bg-canvas border-b border-hairline/40 select-none flex-shrink-0">
                    <button
                        onClick={() => handleBreadcrumbClick(0)}
                        className="hover:text-primary transition-colors cursor-pointer"
                    >
                        Workspace
                    </button>
                    {currentPath.map((folder, index) => (
                        <div key={index} className="flex items-center gap-1">
                            <span className="text-muted-soft select-none">/</span>
                            <button
                                onClick={() => handleBreadcrumbClick(index + 1)}
                                className={`hover:text-primary transition-colors cursor-pointer ${index === currentPath.length - 1 ? "text-primary font-extrabold" : ""
                                    }`}
                            >
                                {folder}
                            </button>
                        </div>
                    ))}
                </nav>
            )}

            {/* Main scrollable body viewport */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-w-0">
                {isLoading ? (
                    /* Skeleton Loaders */
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="animate-pulse flex items-center justify-between rounded border border-hairline p-3">
                                <div className="flex items-center gap-3 w-1/3">
                                    <div className="h-6 w-6 rounded bg-surface-card" />
                                    <div className="h-3.5 w-full rounded bg-surface-card" />
                                </div>
                                <div className="h-3 w-16 rounded bg-surface-card" />
                                <div className="h-3 w-24 rounded bg-surface-card" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Folders Directories Grid (Workspace Mode only) */}
                        {showDirectories && currentFolderNode && Object.keys(currentFolderNode.folders).length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-soft mb-2 select-none">Folders</h3>
                                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                    {Object.keys(currentFolderNode.folders).map((folderName) => (
                                        <div
                                            key={folderName}
                                            onClick={() => handleFolderClick(folderName)}
                                            className="flex items-center gap-2 rounded border border-hairline bg-canvas p-2 hover:border-ink hover:shadow-xs transition-all duration-150 cursor-pointer text-left group select-none"
                                        >
                                            <span className="text-sm shrink-0">📁</span>
                                            <span className="truncate text-xs font-semibold text-ink leading-none group-hover:text-primary transition-colors">
                                                {folderName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files Listing Header */}
                        {showDirectories && currentFolderNode && Object.keys(currentFolderNode.folders).length > 0 && (
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-soft mt-4 select-none">Files</h3>
                        )}

                        {/* Files Container Render */}
                        {finalDisplayFiles.length === 0 ? (
                            /* Empty View State */
                            <div className="rounded border border-dashed border-hairline bg-canvas px-6 py-12 text-center max-w-sm mx-auto mt-6">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-lg select-none">
                                    {activeView === "trash" ? "🗑️" : activeView === "favorites" ? "⭐" : "📁"}
                                </div>
                                <h2 className="text-xs font-bold text-ink">
                                    {activeView === "trash"
                                        ? "Trash is empty"
                                        : activeView === "favorites"
                                            ? "No starred files"
                                            : activeView === "shared"
                                                ? "No shared files"
                                                : "No files here"}
                                </h2>
                                <p className="mt-1 text-[10px] text-muted leading-relaxed">
                                    {activeView === "trash"
                                        ? "Deleted files show up here. You can restore them or permanently delete them."
                                        : activeView === "favorites"
                                            ? "Star files in the workspace to view them quickly in this tab."
                                            : "Upload files or drag-and-drop elements to start."}
                                </p>
                            </div>
                        ) : viewLayout === "list" ? (
                            /* Dense Professional Table Layout */
                            <div className="border border-hairline bg-canvas rounded-lg overflow-hidden select-none">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className="bg-surface-soft border-b border-hairline text-xs font-bold text-muted-soft uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2 font-bold w-6"></th>
                                            <th className="px-4 py-2 font-bold">Name</th>
                                            <th className="px-4 py-2 font-bold w-24">Size</th>
                                            <th className="px-4 py-2 font-bold w-24">Downloads</th>
                                            <th className="px-4 py-2 font-bold w-36">Uploaded</th>
                                            <th className="px-4 py-2 font-bold w-32 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline/60">
                                        {finalDisplayFiles.map((file) => {
                                            const fileType = getFileTypeDetails(file.fileName);
                                            const isStarred = favorites.includes(file.id);
                                            const isFileShared = shared.includes(file.id) || Number(file.downloadCount || 0) > 0;
                                            const isDownloading = !!downloadingIds[file.id];

                                            return (
                                                <tr
                                                    key={file.id}
                                                    onClick={() => setSelectedFile(file)}
                                                    className="hover:bg-surface-soft/60 transition-colors duration-150 cursor-pointer group"
                                                >
                                                    {/* Favorite Star action */}
                                                    <td className="pl-4 pr-1 py-4 align-middle">
                                                        {activeView !== "trash" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFavorite(file.id);
                                                                }}
                                                                className={`p-1 rounded hover:bg-surface-strong/50 transition-all cursor-pointer ${isStarred ? "text-badge-orange" : "text-muted opacity-25 group-hover:opacity-100"
                                                                    }`}
                                                                aria-label={isStarred ? `Unstar ${file.fileName}` : `Star ${file.fileName}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                                                                    <path d="M10.868 2.784c-.304-.793-1.432-.793-1.736 0L7.498 7.027 2.946 7.42c-.878.076-1.23 1.157-.566 1.696l3.468 2.822-.977 4.478c-.19.873.748 1.554 1.506 1.09L10 15.247l3.623 2.261c.758.464 1.696-.217 1.506-1.09l-.977-4.478 3.468-2.822c.664-.539.312-1.62-.566-1.696l-4.552-.393-1.636-4.243z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </td>

                                                    {/* File type icon & Name */}
                                                    <td className="px-4 py-2 font-medium text-ink align-middle min-w-0">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={`rounded p-1 shrink-0 ${fileType.bgColor}`}>
                                                                {fileType.icon}
                                                            </div>
                                                            <span className="truncate block font-semibold text-ink group-hover:text-primary transition-colors max-w-xs sm:max-w-sm md:max-w-md" title={file.fileName}>
                                                                {file.fileName.split("/").pop()}
                                                            </span>
                                                            {isFileShared && activeView !== "trash" && (
                                                                <span className="badge badge-shared">
                                                                    SHARED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* File Size */}
                                                    <td className="px-4 py-2 font-mono text-muted text-[11px] align-middle tabular-nums">
                                                        {formatSize(file.size)}
                                                    </td>

                                                    {/* Download Stats */}
                                                    <td className="px-4 py-2 font-mono text-muted text-[11px] align-middle tabular-nums">
                                                        <div className="flex items-center gap-1 select-none">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-muted-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            <span>{file.downloadCount ?? 0}</span>
                                                        </div>
                                                    </td>

                                                    {/* Date uploaded */}
                                                    <td className="px-4 py-2 text-muted-soft align-middle text-[11px]">
                                                        {formatDate(file.uploadedAt)}
                                                    </td>

                                                    {/* Row Hover actions */}
                                                    <td className="px-4 py-2 align-middle text-right">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {activeView === "trash" ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => handleRestore(file.id, e)}
                                                                        className="p-1 rounded text-success hover:bg-success/5 border border-transparent hover:border-success/20 cursor-pointer"
                                                                        title="Restore File"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
                                                                        </svg>
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => handleDelete(file, e)}
                                                                        className="p-1 rounded text-error hover:bg-error/5 border border-transparent hover:border-error/20 cursor-pointer"
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!isDownloading) {
                                                                                onDownload(file.id, file.fileName);
                                                                            }
                                                                        }}
                                                                        disabled={isDownloading}
                                                                        className={`p-1 rounded text-muted hover:bg-surface-strong/50 hover:text-primary border border-transparent cursor-pointer ${
                                                                            isDownloading ? "text-primary cursor-wait" : ""
                                                                        }`}
                                                                        title={isDownloading ? "Downloading..." : "Download"}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            {isDownloading ? (
                                                                                <>
                                                                                    <path className="animate-tray-pulse" strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                                                                                    <path className="animate-download-arrow" strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m-4-4l4 4 4-4" />
                                                                                </>
                                                                            ) : (
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                            )}
                                                                        </svg>
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleShared(file.id);
                                                                        }}
                                                                        className={`p-1 rounded border border-transparent cursor-pointer ${shared.includes(file.id) ? "text-brand-accent hover:bg-brand-accent/5" : "text-muted hover:bg-surface-strong/50 hover:text-primary"
                                                                            }`}
                                                                        title={shared.includes(file.id) ? "Unshare file" : "Share file"}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                                        </svg>
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => handleDelete(file, e)}
                                                                        className="p-1 rounded text-error/70 hover:bg-error/5 hover:text-error border border-transparent cursor-pointer"
                                                                        title="Move to Trash"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Compact Grid Card Layout */
                            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {finalDisplayFiles.map((file) => (
                                    <Card
                                        key={file.id}
                                        fileMeta={file}
                                        onDownload={onDownload}
                                        isDownloading={!!downloadingIds[file.id]}
                                        onDelete={(id) => {
                                            if (activeView === "trash") {
                                                deletePermanently(id);
                                            } else {
                                                moveToTrash(file);
                                            }
                                        }}
                                        onSelect={setSelectedFile}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Slide-over detailed file preview properties drawer */}
            {selectedFile && (
                <>
                    {/* Panel Backdrop click-away */}
                    <div
                        onClick={() => setSelectedFile(null)}
                        className="fixed inset-0 z-40 bg-primary/15 backdrop-blur-xs select-none"
                        aria-hidden="true"
                    />

                    {/* Panel Container */}
                    <FilePreviewPanel
                        file={selectedFile}
                        onClose={() => setSelectedFile(null)}
                        onDownload={onDownload}
                        isDownloading={!!downloadingIds[selectedFile.id]}
                        onDelete={(id) => {
                            if (activeView === "trash") {
                                deletePermanently(id);
                            } else {
                                moveToTrash(selectedFile);
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default FilesPage;
