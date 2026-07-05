import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

const formatSize = (bytes) => {
    const sizeInBytes = Number(bytes ?? 0);
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (fileName) => {
    return fileName?.split(".").pop()?.toLowerCase() ?? "";
};

const getFileTypeIcon = (fileName = "") => {
    const extension = getExtension(fileName);
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) return "🖼️";
    if (["pdf", "doc", "docx", "txt", "md"].includes(extension)) return "📄";
    if (["zip", "rar", "tar", "gz", "7z"].includes(extension)) return "📦";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) return "🎥";
    if (["js", "ts", "json", "html", "css", "cs", "py"].includes(extension)) return "💻";
    return "📁";
};

export const PublicDownloadPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [metadata, setMetadata] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Download states
    const [password, setPassword] = useState("");
    const [downloadError, setDownloadError] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                setIsLoading(true);
                setError("");
                const response = await api.get(`/share/${token}`);
                setMetadata(response.data);
            } catch (err) {
                console.error("Failed to load share metadata:", err);
                setError(err.response?.data?.message || "This sharing link could not be found or has been deactivated.");
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchInfo();
        }
    }, [token]);

    const handleDownload = async (e) => {
        if (e) e.preventDefault();
        setDownloadError("");
        setIsDownloading(true);

        try {
            // POST to initiate download
            const response = await api.post(`/share/download/${token}`, {
                password: metadata?.passwordRequired ? password : null
            });

            const downloadUrl = response.data.url;

            // Trigger browser download using iframe or a temporary anchor click
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", metadata?.fileName || "download");
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Refetch metadata to update download counts
            const infoResponse = await api.get(`/share/${token}`);
            setMetadata(infoResponse.data);
        } catch (err) {
            console.error("Download failed:", err);
            if (err.response && err.response.status === 403) {
                setDownloadError("Incorrect password. Please verify and try again.");
            } else {
                setDownloadError(err.response?.data?.message || "Failed to download file. The link may have expired or limit reached.");
            }
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
                {/* Visual glow backdrop designs */}
                <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-violet/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-accent/10 blur-[120px] pointer-events-none" />

                <div className="text-center space-y-4">
                    <svg className="animate-spin h-8 w-8 text-brand-accent mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-xs text-muted-soft font-semibold tracking-wider uppercase">Retrieving secure link details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 select-none relative overflow-hidden text-ink">
                <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-error/5 blur-[120px] pointer-events-none" />

                <div className="w-full max-w-md bg-canvas/30 backdrop-blur-md border border-hairline/80 shadow-2xl rounded-2xl p-6 text-center space-y-5">
                    <div className="text-4xl">⚠️</div>
                    <div className="space-y-1.5">
                        <h1 className="text-sm font-bold">Link Unavailable</h1>
                        <p className="text-xs text-muted leading-relaxed">
                            {error}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full py-2 bg-surface-soft hover:bg-surface-strong border border-hairline/60 rounded font-bold text-xs cursor-pointer transition-colors"
                    >
                        Back to Vaultix Home
                    </button>
                </div>
            </div>
        );
    }

    // Client-side validations
    const isExpired = metadata?.expiresAt && new Date(metadata.expiresAt) < new Date();
    const isLimitExceeded = metadata?.downloadLimit && metadata.downloadCount >= metadata.downloadLimit;

    return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 select-none relative overflow-hidden text-ink">
            {/* Ambient Background Lights */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-brand-violet/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-brand-accent/10 blur-[130px] pointer-events-none" />

            {/* Header Brand */}
            <div className="mb-6 text-center">
                <span className="font-display text-xs uppercase tracking-[0.3em] font-semibold text-primary">
                    Vaultix Secure Share
                </span>
            </div>

            {/* Glassmorphic Download Container */}
            <div className="w-full max-w-md bg-canvas/40 backdrop-blur-md border border-hairline/60 shadow-2xl rounded-2xl p-6 space-y-6">
                
                {/* File Header Card */}
                <div className="flex items-center gap-4 bg-surface-soft/20 p-4 rounded-xl border border-hairline/40">
                    <div className="text-3xl shrink-0">
                        {getFileTypeIcon(metadata?.fileName)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xs font-bold text-ink truncate" title={metadata?.fileName}>
                            {metadata?.fileName}
                        </h2>
                        <p className="text-[10px] text-muted-soft font-mono mt-0.5">
                            {formatSize(metadata?.size)}
                        </p>
                    </div>
                </div>

                {/* Expiry / Limits Alert state */}
                {isExpired ? (
                    <div className="p-3 rounded-lg border border-pink-500/20 bg-pink-500/5 text-pink-500 text-xs font-semibold text-center leading-relaxed">
                        ⏳ This share link has expired.
                    </div>
                ) : isLimitExceeded ? (
                    <div className="p-3 rounded-lg border border-pink-500/20 bg-pink-500/5 text-pink-500 text-xs font-semibold text-center leading-relaxed">
                        ↓ The download limit for this link has been reached.
                    </div>
                ) : (
                    <form onSubmit={handleDownload} className="space-y-4">
                        {metadata?.passwordRequired && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-soft block">
                                    Password Protected File
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter file password to download"
                                    className="w-full bg-canvas text-xs px-3 py-2.5 rounded border border-hairline focus:border-brand-accent focus:outline-none transition-colors"
                                />
                            </div>
                        )}

                        {downloadError && (
                            <div className="text-[11px] font-semibold text-error">
                                ❌ {downloadError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isDownloading}
                            className="w-full py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded font-bold text-xs cursor-pointer transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Decrypting & downloading...</span>
                                </>
                            ) : (
                                <>
                                    <span>Download File</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Info summary parameters */}
                <div className="pt-4 border-t border-hairline/40 grid grid-cols-2 gap-3 text-[10px] text-muted-soft font-medium select-none">
                    <div>
                        <span>Downloads Count</span>
                        <strong className="block text-ink text-xs mt-0.5">{metadata?.downloadCount ?? 0} times</strong>
                    </div>
                    {metadata?.downloadLimit && (
                        <div>
                            <span>Max Limit</span>
                            <strong className="block text-ink text-xs mt-0.5">{metadata.downloadLimit} times</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate("/")}
                className="mt-6 text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
                ← Back to Vaultix Dashboard
            </button>
        </div>
    );
};

export default PublicDownloadPage;
