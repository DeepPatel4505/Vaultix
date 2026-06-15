import { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

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

const getFileTypeDetails = (fileName = "") => {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

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

const Card = ({ fileMeta, onDownload, onDelete, onSelect, isDownloading }) => {
    const { favorites, toggleFavorite, shared, activeView, restoreFromTrash } = useWorkspace();
    const [isDeleting, setIsDeleting] = useState(false);

    const isStarred = favorites.includes(fileMeta?.id);
    const isFileShared = shared.includes(fileMeta?.id) || Number(fileMeta?.downloadCount || 0) > 0;

    const sizeInBytes = Number(fileMeta?.size ?? 0);
    const sizeDisplay =
        sizeInBytes < 1024
            ? `${sizeInBytes} B`
            : sizeInBytes < 1024 * 1024
            ? `${(sizeInBytes / 1024).toFixed(1)} KB`
            : `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;

    const fileTypeInfo = getFileTypeDetails(fileMeta?.fileName);

    const handleDownload = (e) => {
        e.stopPropagation();
        if (!isDownloading) {
            onDownload(fileMeta?.id, fileMeta?.fileName);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        const msg = activeView === "trash" ? `Delete ${fileMeta?.fileName} permanently?` : `Move ${fileMeta?.fileName} to Trash?`;
        const shouldDelete = window.confirm(msg);

        if (!shouldDelete) return;

        try {
            setIsDeleting(true);
            await onDelete(fileMeta?.id);
        } catch (err) {
            console.error("Failed to delete:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRestore = (e) => {
        e.stopPropagation();
        restoreFromTrash(fileMeta?.id);
    };

    const handleStarClick = (e) => {
        e.stopPropagation();
        toggleFavorite(fileMeta?.id);
    };

    return (
        <article
            onClick={() => onSelect?.(fileMeta)}
            className="
                group
                relative
                flex
                flex-col
                justify-between
                rounded-lg
                border
                border-hairline
                bg-canvas
                p-3
                transition-all
                duration-150
                hover:border-ink
                hover:shadow-xs
                cursor-pointer
                select-none
            "
        >
            <div className="space-y-2.5">
                {/* Upper row: Icon + Star toggle */}
                <div className="flex items-start justify-between gap-2.5">
                    <div className={`rounded p-1.5 shrink-0 flex items-center justify-center ${fileTypeInfo.bgColor}`}>
                        {fileTypeInfo.icon}
                    </div>

                    {activeView !== "trash" ? (
                        <button
                            onClick={handleStarClick}
                            className={`p-1.5 rounded hover:bg-surface-soft transition-colors cursor-pointer ${
                                isStarred ? "text-badge-orange" : "text-muted opacity-0 group-hover:opacity-100"
                            }`}
                            aria-label={isStarred ? "Unstar" : "Star"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 fill-current" viewBox="0 0 20 20">
                                <path d="M10.868 2.784c-.304-.793-1.432-.793-1.736 0L7.498 7.027 2.946 7.42c-.878.076-1.23 1.157-.566 1.696l3.468 2.822-.977 4.478c-.19.873.748 1.554 1.506 1.09L10 15.247l3.623 2.261c.758.464 1.696-.217 1.506-1.09l-.977-4.478 3.468-2.822c.664-.539.312-1.62-.566-1.696l-4.552-.393-1.636-4.243z" />
                            </svg>
                        </button>
                    ) : (
                        <span className="badge badge-expired">
                            TRASHED
                        </span>
                    )}
                </div>

                {/* File Name - font weight and size scaled */}
                <div className="min-w-0">
                    <h3 
                        className="truncate text-xs sm:text-sm font-bold text-ink leading-tight group-hover:text-primary transition-colors duration-150" 
                        title={fileMeta?.fileName}
                    >
                        {fileMeta?.fileName?.split("/").pop() ?? "Untitled"}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-1 select-none flex-wrap">
                        <span className="text-[10px] text-muted-soft font-mono uppercase tracking-wider">
                            {fileTypeInfo.type}
                        </span>
                        {isFileShared && activeView !== "trash" && (
                            <span className="badge badge-shared">
                                Shared
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Metadata & Hover Actions */}
            <div className="mt-4 pt-2.5 border-t border-hairline/40 flex items-center justify-between text-[10px] text-muted leading-none">
                {/* Size stats & Download Count */}
                <div className="flex items-center gap-1.5 font-mono text-muted-soft font-medium select-none">
                    <span>{sizeDisplay}</span>
                    {activeView !== "trash" && (
                        <>
                            <span className="text-muted/30 select-none">•</span>
                            <span className="flex items-center gap-0.5" title={`${fileMeta?.downloadCount ?? 0} downloads`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-muted-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>{fileMeta?.downloadCount ?? 0}</span>
                            </span>
                        </>
                    )}
                </div>

                {/* Main Interactive Hover Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {activeView === "trash" ? (
                        <>
                            <button
                                onClick={handleRestore}
                                className="p-1.5 rounded text-success hover:bg-success/5 cursor-pointer"
                                title="Restore File"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-1.5 rounded text-error hover:bg-error/5 cursor-pointer disabled:opacity-50"
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
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={`p-1.5 rounded text-muted hover:bg-surface-soft hover:text-primary cursor-pointer transition-colors ${
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
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-1.5 rounded text-error/70 hover:bg-error/5 hover:text-error cursor-pointer disabled:opacity-50 transition-colors"
                                title="Move to Trash"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

export default Card;
