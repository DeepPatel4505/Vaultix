import { useState, useRef } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

const UploadPage = () => {
    const { uploadFile, isUploading: contextUploading } = useWorkspace();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLocalUploading, setIsLocalUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef(null);

    const isUploading = isLocalUploading || contextUploading;

    const handleUpload = async (e) => {
        if (e) e.preventDefault();

        if (!selectedFile) {
            setError("Please choose or drag a file before uploading.");
            setSuccess("");
            return;
        }

        try {
            setIsLocalUploading(true);
            setError("");
            setSuccess("");

            await uploadFile(selectedFile);

            setSuccess(`"${selectedFile.name}" has been successfully uploaded to your workspace.`);
            setSelectedFile(null);
        } catch (uploadError) {
            console.error("Upload failed in page:", uploadError);
            setError("Unable to upload the file. Please check your network and file size.");
        } finally {
            setIsLocalUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setSelectedFile(file);
            setError("");
            setSuccess("");
        }
    };

    // Drag-and-drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0] ?? null;
        if (file) {
            setSelectedFile(file);
            setError("");
            setSuccess("");
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const clearSelectedFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
    };

    const getFileDisplaySize = (sizeInBytes) => {
        if (sizeInBytes < 1024) return `${sizeInBytes} Bytes`;
        if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="w-full bg-canvas text-ink px-4 py-8 md:px-8 max-w-2xl mx-auto select-none">
            <header className="mb-6 text-left">
                <h2 className="font-display font-semibold tracking-tight text-ink text-lg">
                    Import Files
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                    Securely add files to your personal sharing workspace.
                </p>
            </header>

            <div className="space-y-5">
                {/* Error and Success Alerts */}
                {error && (
                    <div className="rounded bg-error/5 border border-error/20 p-4 text-sm text-error flex items-start gap-3">
                        <span className="text-base shrink-0">⚠️</span>
                        <div>
                            <h4 className="font-bold">Upload Failed</h4>
                            <p className="mt-1 text-xs text-error/85">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="rounded bg-success/5 border border-success/20 p-4 text-sm text-success flex items-start gap-3">
                        <span className="text-base shrink-0">✓</span>
                        <div>
                            <h4 className="font-bold">Upload Successful</h4>
                            <p className="mt-1 text-xs text-success/85">{success}</p>
                        </div>
                    </div>
                )}

                {/* Drag and Drop Box */}
                <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`
                        relative
                        flex
                        flex-col
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-dashed
                        p-10
                        text-center
                        transition-all
                        duration-150
                        cursor-pointer
                        ${isDragging 
                            ? "border-ink bg-surface-soft scale-[1.005]" 
                            : "border-hairline bg-canvas hover:border-muted hover:bg-surface-soft"
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {!selectedFile ? (
                        <div className="space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-primary border border-hairline/60">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            
                            <div>
                                <p className="font-display text-sm font-bold tracking-tight text-ink">
                                    Drag and drop files here
                                </p>
                                <p className="mt-1 text-xs text-muted-soft">
                                    or click to browse from device
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 w-full">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <div className="rounded border border-hairline bg-canvas p-3.5 text-left flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg shrink-0 select-none">📄</span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-ink leading-tight" title={selectedFile.name}>
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-muted-soft mt-1 font-mono">
                                            {getFileDisplaySize(selectedFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearSelectedFile}
                                    aria-label="Remove chosen file"
                                    className="rounded p-1.5 text-muted hover:bg-surface-soft hover:text-error transition-colors cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Buttons */}
                <div className="flex justify-end gap-2.5">
                    {selectedFile && (
                        <button
                            onClick={() => setSelectedFile(null)}
                            type="button"
                            disabled={isUploading}
                            className="rounded border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-soft cursor-pointer transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                        className="
                            flex items-center justify-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-hover transition-all focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.98] cursor-pointer
                            disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed disabled:scale-100
                        "
                    >
                        {isUploading ? (
                            <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-canvas border-t-transparent" />
                                <span>Uploading…</span>
                            </>
                        ) : (
                            <span>Start Upload</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;