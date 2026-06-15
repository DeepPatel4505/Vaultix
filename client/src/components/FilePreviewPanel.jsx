import { useState, useEffect } from "react";
import api from "../lib/api";
import { useWorkspace } from "../context/WorkspaceContext";

const formatDate = (value) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "long",
        timeStyle: "short",
    }).format(date);
};

const FilePreviewPanel = ({ file, onClose, onDownload, onDelete, isDownloading }) => {
    const { favorites, toggleFavorite, shared, toggleShared, activeView, restoreFromTrash } = useWorkspace();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [textContent, setTextContent] = useState("");
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState("");
    const [copied, setCopied] = useState(false);

    const isStarred = favorites.includes(file?.id);
    const isFileShared = shared.includes(file?.id) || Number(file?.downloadCount || 0) > 0;

    const sizeInBytes = Number(file?.size ?? 0);
    const sizeDisplay =
        sizeInBytes < 1024
            ? `${sizeInBytes} Bytes`
            : sizeInBytes < 1024 * 1024
            ? `${(sizeInBytes / 1024).toFixed(2)} KB`
            : `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;

    const extension = file?.fileName?.split(".").pop()?.toLowerCase() ?? "";
    const isImage = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(extension);
    const isText = ["txt", "md", "json", "js", "ts", "html", "css", "py", "cs"].includes(extension);

    // Fetch preview content when file selection changes
    useEffect(() => {
        if (!file) return;

        Promise.resolve().then(() => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            setTextContent("");
            setPreviewError("");
            setCopied(false);
        });

        const fetchPreview = async () => {
            setIsLoadingPreview(true);
            try {
                if (isImage) {
                    const response = await api.get(`/file/download/${file.id}`, {
                        responseType: "blob",
                    });
                    const blob = new Blob([response.data]);
                    const url = window.URL.createObjectURL(blob);
                    setPreviewUrl(url);
                } else if (isText) {
                    const response = await api.get(`/file/download/${file.id}`, {
                        responseType: "text",
                    });
                    const text = typeof response.data === "string" 
                        ? response.data 
                        : JSON.stringify(response.data, null, 2);
                    setTextContent(text.slice(0, 10000) + (text.length > 10000 ? "\n\n...[Preview truncated for length]..." : ""));
                }
            } catch (err) {
                console.error("Preview load failed:", err);
                setPreviewError("Unable to load preview for this file.");
            } finally {
                setIsLoadingPreview(false);
            }
        };

        fetchPreview();

        return () => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
            }
        };
    }, [file]);

    if (!file) return null;

    const shareUrl = `${import.meta.env.VITE_BACKEND_URL}/api/file/download/${file.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        if (!shared.includes(file.id)) {
            toggleShared(file.id);
        }
    };

    const handleRestoreClick = () => {
        restoreFromTrash(file.id);
        onClose();
    };

    const handleDeleteClick = () => {
        onDelete(file.id);
        onClose();
    };

    return (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-hairline bg-canvas shadow-xl animate-slide-in-right md:w-96 select-none">
            {/* Properties Panel Header */}
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                        File Properties
                    </span>
                    {activeView !== "trash" && (
                        <button
                            onClick={() => toggleFavorite(file.id)}
                            className={`p-1.5 rounded hover:bg-surface-soft transition-colors cursor-pointer ${
                                isStarred ? "text-badge-orange" : "text-muted"
                            }`}
                            aria-label={isStarred ? "Unstar file" : "Star file"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 fill-current" viewBox="0 0 20 20">
                                <path d="M10.868 2.784c-.304-.793-1.432-.793-1.736 0L7.498 7.027 2.946 7.42c-.878.076-1.23 1.157-.566 1.696l3.468 2.822-.977 4.478c-.19.873.748 1.554 1.506 1.09L10 15.247l3.623 2.261c.758.464 1.696-.217 1.506-1.09l-.977-4.478 3.468-2.822c.664-.539.312-1.62-.566-1.696l-4.552-.393-1.636-4.243z" />
                            </svg>
                        </button>
                    )}
                </div>
                
                <button
                    onClick={onClose}
                    className="rounded-md p-1.5 hover:bg-surface-soft text-muted hover:text-primary transition-colors cursor-pointer"
                    aria-label="Close panel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Properties Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Visual Preview Window */}
                <div className="flex items-center justify-center rounded-lg border border-hairline bg-surface-card min-h-48 p-4 relative overflow-hidden">
                    {isLoadingPreview ? (
                        <div className="flex flex-col items-center gap-1.5 text-xs text-muted">
                            <span className="h-5 w-5 animate-spin rounded-full border border-hairline border-t-primary" />
                            <p>Loading preview…</p>
                        </div>
                    ) : previewError ? (
                        <div className="text-center p-4">
                            <span className="text-lg">⚠️</span>
                            <p className="mt-1.5 text-xs text-muted">{previewError}</p>
                        </div>
                    ) : isImage && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={`Preview of ${file.fileName}`}
                            className="max-h-56 max-w-full rounded object-contain shadow-xs"
                        />
                    ) : isText && textContent ? (
                        <pre className="w-full max-h-56 rounded border border-hairline bg-canvas p-3 font-mono text-[10px] text-ink overflow-auto text-left whitespace-pre-wrap select-text">
                            {textContent}
                        </pre>
                    ) : (
                        <div className="text-center p-5 text-muted">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-2xl">
                                📄
                            </div>
                            <p className="mt-2 text-xs">No preview available</p>
                        </div>
                    )}
                </div>

                {/* File Information Fields */}
                <div className="space-y-4 border-t border-hairline/40 pt-5">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-soft select-none">File Name</h4>
                        <p className="mt-1 text-sm font-bold text-ink break-all select-all leading-tight">{file.fileName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-soft select-none">Size</h4>
                            <p className="mt-1 text-sm font-bold text-ink leading-none">{sizeDisplay}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-soft select-none">Downloads</h4>
                            <p className="mt-1 text-sm font-bold text-ink leading-none">{file.downloadCount ?? 0} times</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-soft select-none">Uploaded Date</h4>
                        <p className="mt-1 text-sm font-bold text-ink leading-none">{formatDate(file.uploadedAt)}</p>
                    </div>
                </div>

                {/* Sharing URL box */}
                {activeView !== "trash" && (
                    <div className="rounded-lg border border-hairline bg-surface-soft p-4 space-y-2.5">
                        <div>
                            <h4 className="text-xs font-bold text-primary select-none leading-none">Share Link</h4>
                            <p className="text-[10px] text-muted-soft mt-1.5 leading-tight">Anyone with link can download file.</p>
                        </div>
                        
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 rounded border border-hairline bg-canvas px-3 py-1.5 text-xs text-muted focus:outline-none"
                            />
                            <button
                                onClick={handleCopyLink}
                                className={`
                                    rounded px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none
                                    ${copied 
                                        ? "bg-success text-white" 
                                        : "bg-primary text-on-primary hover:bg-primary-hover active:scale-95"
                                    }
                                `}
                            >
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Properties Drawer Footer Actions */}
            <div className="border-t border-hairline bg-surface-soft px-5 py-3.5 flex gap-2.5 flex-shrink-0">
                {activeView === "trash" ? (
                    <>
                        <button
                            onClick={handleRestoreClick}
                            className="flex-1 flex items-center justify-center gap-2 rounded bg-success px-4 py-2 text-sm font-bold text-white hover:bg-success-hover transition-colors cursor-pointer select-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
                            </svg>
                            <span>Restore file</span>
                        </button>
                        
                        <button
                            onClick={handleDeleteClick}
                            className="rounded border border-error bg-canvas p-2 text-error hover:bg-error/5 transition-colors cursor-pointer select-none"
                            title="Delete Permanently"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => {
                                if (!isDownloading) {
                                    onDownload(file.id, file.fileName);
                                }
                            }}
                            disabled={isDownloading}
                            className={`flex-1 flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-colors cursor-pointer select-none ${
                                isDownloading ? "bg-primary-active opacity-90 cursor-wait" : "hover:bg-primary-hover"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                {isDownloading ? (
                                    <>
                                        <path className="animate-tray-pulse" strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                                        <path className="animate-download-arrow" strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m-4-4l4 4 4-4" />
                                    </>
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                )}
                            </svg>
                            <span>{isDownloading ? "Downloading..." : "Download"}</span>
                        </button>
                        
                        <button
                            onClick={handleDeleteClick}
                            className="rounded border border-error bg-canvas p-2 text-error hover:bg-error/5 transition-colors cursor-pointer select-none"
                            title="Move to Trash"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FilePreviewPanel;
