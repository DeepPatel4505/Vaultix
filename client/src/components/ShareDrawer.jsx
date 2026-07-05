import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../lib/api";

const formatSize = (bytes) => {
    const sizeInBytes = Number(bytes ?? 0);
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ShareDrawer = ({ file, isOpen, onClose, onSave }) => {
    const [isPublic, setIsPublic] = useState(false);
    const [passwordEnabled, setPasswordEnabled] = useState(false);
    const [password, setPassword] = useState("");
    const [expiryPreset, setExpiryPreset] = useState("never");
    const [customExpiry, setCustomExpiry] = useState("");
    const [limitPreset, setLimitPreset] = useState("unlimited");
    const [customLimit, setCustomLimit] = useState("");

    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [shareLink, setShareLink] = useState(null);

    const qrRef = useRef(null);

    // Load initial state if file is already shared
    useEffect(() => {
        if (file && isOpen) {
            setError("");
            setSuccess("");
            setCopied(false);

            if (file.shareLink && file.shareLink.isActive) {
                const sl = file.shareLink;
                setShareLink(sl);
                setIsPublic(sl.isPublic);
                setPasswordEnabled(sl.passwordProtected);
                setPassword(""); // Do not show hash to user, leave blank to keep unchanged

                if (sl.expiresAt) {
                    setExpiryPreset("custom");
                    // Format datetime-local value (YYYY-MM-DDTHH:MM)
                    const expDate = new Date(sl.expiresAt);
                    const localIso = new Date(expDate.getTime() - expDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setCustomExpiry(localIso);
                } else {
                    setExpiryPreset("never");
                    setCustomExpiry("");
                }

                if (sl.downloadLimit) {
                    setLimitPreset("custom");
                    setCustomLimit(String(sl.downloadLimit));
                } else {
                    setLimitPreset("unlimited");
                    setCustomLimit("");
                }
            } else {
                setShareLink(null);
                setIsPublic(true);
                setPasswordEnabled(false);
                setPassword("");
                setExpiryPreset("never");
                setCustomExpiry("");
                setLimitPreset("unlimited");
                setCustomLimit("");
            }
        }
    }, [file, isOpen]);

    if (!isOpen || !file) return null;

    const shareUrl = shareLink ? `${window.location.origin}/s/${shareLink.token}` : "";

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQr = () => {
        const svgElement = qrRef.current?.querySelector("svg");
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 300;
            const context = canvas.getContext("2d");
            if (context) {
                context.fillStyle = "#FFFFFF";
                context.fillRect(0, 0, 300, 300);
                context.drawImage(image, 20, 20, 260, 260);
                
                const pngUrl = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `qr_${file.fileName.split("/").pop()}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
            URL.revokeObjectURL(blobURL);
        };
        image.src = blobURL;
    };

    const handleSave = async () => {
        setIsSaving(false);
        setError("");
        setSuccess("");

        let expiresAtVal = null;
        if (expiryPreset === "custom" && customExpiry) {
            expiresAtVal = new Date(customExpiry).toISOString();
        } else if (expiryPreset === "1h") {
            expiresAtVal = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "1d") {
            expiresAtVal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "7d") {
            expiresAtVal = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "30d") {
            expiresAtVal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        let downloadLimitVal = null;
        if (limitPreset === "custom") {
            downloadLimitVal = parseInt(customLimit, 10);
            if (Number.isNaN(downloadLimitVal) || downloadLimitVal <= 0) {
                setError("Please enter a valid download limit.");
                return;
            }
        }

        try {
            setIsSaving(true);
            if (isPublic) {
                // Upsert Share Link
                const payload = {
                    fileId: file.id,
                    isPublic: true,
                    password: passwordEnabled ? password || null : null, // send null if not enabled, or leave empty if unmodified but existing password
                    expiresAt: expiresAtVal,
                    downloadLimit: downloadLimitVal
                };

                const response = await api.post("/share", payload);
                setShareLink(response.data);
                setSuccess("Share settings saved successfully!");
            } else {
                // Delete/Disable sharing
                await api.delete(`/share/${file.id}`);
                setShareLink(null);
                setSuccess("File unshared successfully.");
            }

            // Refresh parent list
            if (onSave) {
                await onSave();
            }

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Save sharing settings failed:", err);
            setError(err.response?.data?.message || "Failed to update sharing settings.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <aside
            className="fixed top-0 right-0 h-full w-full max-w-md bg-canvas border-l border-hairline/80 shadow-2xl z-50 flex flex-col transition-all duration-300 transform translate-x-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
        >
            {/* Header */}
            <div className="p-4 border-b border-hairline flex items-center justify-between flex-shrink-0 bg-surface-soft/40">
                <div>
                    <h2 id="drawer-title" className="text-sm font-bold text-ink flex items-center gap-2">
                        <span>🔗</span> Share Settings
                    </h2>
                    <p className="text-[10px] text-muted truncate max-w-xs mt-0.5" title={file.fileName}>
                        {file.fileName.split("/").pop()} ({formatSize(file.size)})
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded hover:bg-surface-strong text-muted hover:text-primary transition-colors cursor-pointer"
                    aria-label="Close panel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {error && (
                    <div className="p-3 rounded border border-error/20 bg-error/5 text-error text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 rounded border border-success/20 bg-success/5 text-success text-xs font-semibold">
                        ✨ {success}
                    </div>
                )}

                {/* Sharing toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-surface-soft/30">
                    <div>
                        <span className="text-xs font-bold text-ink block">Public Sharing Link</span>
                        <span className="text-[10px] text-muted-soft">Allow anyone with the link to access this file</span>
                    </div>
                    <button
                        onClick={() => setIsPublic(!isPublic)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isPublic ? "bg-brand-accent" : "bg-surface-strong"
                        }`}
                        aria-checked={isPublic}
                        role="switch"
                    >
                        <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isPublic ? "translate-x-4" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                {isPublic && (
                    <>
                        {/* URL Copy Card */}
                        {shareLink ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Share Link</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 bg-surface-soft text-primary font-mono text-[11px] px-3 py-2 rounded border border-hairline focus:outline-none select-all"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-3 py-2 rounded font-bold text-xs shrink-0 cursor-pointer transition-colors border ${
                                            copied 
                                                ? "bg-success/10 text-success border-success/20 hover:bg-success/15" 
                                                : "bg-brand-accent text-white border-transparent hover:bg-brand-accent/90"
                                        }`}
                                    >
                                        {copied ? "✓ Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 text-center border border-dashed border-hairline rounded text-xs text-muted-soft select-none bg-surface-soft/10">
                                Click <strong>Save Settings</strong> to generate your share URL.
                            </div>
                        )}

                        {/* Password protection details */}
                        <div className="border border-hairline rounded-lg p-3 space-y-3 bg-surface-soft/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-ink block">Require Password</span>
                                    <span className="text-[9px] text-muted">Secure downloads with a custom password</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={passwordEnabled}
                                    onChange={(e) => {
                                        setPasswordEnabled(e.target.checked);
                                        if (!e.target.checked) setPassword("");
                                    }}
                                    className="h-4.5 w-4.5 rounded border-hairline text-brand-accent focus:ring-brand-accent focus:ring-opacity-40 cursor-pointer"
                                />
                            </div>

                            {passwordEnabled && (
                                <div className="space-y-1.5 animate-fadeIn">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={shareLink?.passwordProtected ? "•••••••• (Leave blank to keep current)" : "Enter access password"}
                                        className="w-full bg-canvas text-xs px-3 py-2 rounded border border-hairline focus:border-brand-accent focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Expiry Selector */}
                        <div className="border border-hairline rounded-lg p-3 space-y-3 bg-surface-soft/10">
                            <div>
                                <span className="text-xs font-semibold text-ink block">Link Expiration</span>
                                <span className="text-[9px] text-muted">Automatically disable sharing after a period</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {[
                                    { value: "never", label: "Never" },
                                    { value: "1h", label: "1 Hour" },
                                    { value: "1d", label: "1 Day" },
                                    { value: "7d", label: "7 Days" },
                                    { value: "30d", label: "30 Days" },
                                    { value: "custom", label: "Custom" }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setExpiryPreset(opt.value);
                                            if (opt.value !== "custom") setCustomExpiry("");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                            expiryPreset === opt.value
                                                ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                                                : "bg-canvas border-hairline text-muted hover:border-muted"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {expiryPreset === "custom" && (
                                <div className="space-y-1.5 animate-fadeIn">
                                    <input
                                        type="datetime-local"
                                        value={customExpiry}
                                        onChange={(e) => setCustomExpiry(e.target.value)}
                                        className="w-full bg-canvas text-xs px-3 py-2 rounded border border-hairline focus:border-brand-accent focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Download limits */}
                        <div className="border border-hairline rounded-lg p-3 space-y-3 bg-surface-soft/10">
                            <div>
                                <span className="text-xs font-semibold text-ink block">Download Limit</span>
                                <span className="text-[9px] text-muted">Disable sharing after a certain download count</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {[
                                    { value: "unlimited", label: "Unlimited" },
                                    { value: "1", label: "1 Download" },
                                    { value: "5", label: "5 times" },
                                    { value: "10", label: "10 times" },
                                    { value: "50", label: "50 times" },
                                    { value: "custom", label: "Custom" }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setLimitPreset(opt.value);
                                            if (opt.value !== "custom") setCustomLimit("");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                            limitPreset === opt.value
                                                ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                                                : "bg-canvas border-hairline text-muted hover:border-muted"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {limitPreset === "custom" && (
                                <div className="space-y-1.5 animate-fadeIn">
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Max download count"
                                        value={customLimit}
                                        onChange={(e) => setCustomLimit(e.target.value)}
                                        className="w-full bg-canvas text-xs px-3 py-2 rounded border border-hairline focus:border-brand-accent focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* QR Code generator */}
                        {shareLink && (
                            <div className="border border-hairline rounded-lg p-4 bg-surface-soft/10 flex flex-col items-center gap-3">
                                <span className="text-xs font-semibold text-ink self-start">QR Code Sharing</span>
                                <div ref={qrRef} className="p-2.5 bg-white rounded border border-hairline/60">
                                    <QRCodeSVG value={shareUrl} size={150} level="M" />
                                </div>
                                <button
                                    onClick={downloadQr}
                                    className="px-3 py-1.5 rounded font-bold text-xs cursor-pointer border border-hairline bg-canvas hover:bg-surface-soft hover:text-primary transition-colors text-muted"
                                >
                                    Download PNG
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-hairline flex items-center justify-end gap-2.5 flex-shrink-0 bg-surface-soft/40">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded border border-hairline text-xs font-bold hover:bg-surface-soft cursor-pointer text-muted transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                    {isSaving && (
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                    {isSaving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </aside>
    );
};

export default ShareDrawer;
