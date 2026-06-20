import { createContext, useState, useEffect, useContext, useMemo } from "react";
import api from "../lib/api";
import axios from "axios";

const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
};

export const WorkspaceProvider = ({ children }) => {
    const [filesMeta, setFilesMeta] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeView, setActiveView] = useState("workspace"); // workspace, shared, favorites, trash
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("None"); // None, Uploading, Finalizing, Success, Error
    const [uploadFileName, setUploadFileName] = useState("");

    // Client-side local storage states for favorites, shared, and trash
    const [favorites, setFavorites] = useState(() => {
        const stored = localStorage.getItem("workspace_favorites");
        return stored ? JSON.parse(stored) : [];
    });

    const [shared, setShared] = useState(() => {
        const stored = localStorage.getItem("workspace_shared");
        return stored ? JSON.parse(stored) : [];
    });

    const [trashList, setTrashList] = useState(() => {
        const stored = localStorage.getItem("workspace_trash");
        return stored ? JSON.parse(stored) : [];
    });

    // Sync to local storage
    useEffect(() => {
        localStorage.setItem("workspace_favorites", JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem("workspace_shared", JSON.stringify(shared));
    }, [shared]);

    useEffect(() => {
        localStorage.setItem("workspace_trash", JSON.stringify(trashList));
    }, [trashList]);

    // Fetch active files
    const fetchFiles = async () => {
        try {
            setIsLoading(true);
            setError("");
            const response = await api.get("/file");
            setFilesMeta(response.data);
        } catch (err) {
            console.error("Failed to load files:", err);
            setError("Unable to retrieve files from the workspace server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchFiles();
        });
    }, []);

    // Filter out files that are currently trashed from active view list
    const activeFiles = useMemo(() => {
        const trashedIds = trashList.map((item) => item.id);
        return filesMeta.filter((file) => !trashedIds.includes(file.id));
    }, [filesMeta, trashList]);

    // Helper functions for action mappings
    const toggleFavorite = (id) => {
        setFavorites((prev) =>
            prev.includes(id)
                ? prev.filter((fid) => fid !== id)
                : [...prev, id],
        );
    };

    const toggleShared = (id) => {
        setShared((prev) =>
            prev.includes(id)
                ? prev.filter((sid) => sid !== id)
                : [...prev, id],
        );
    };

    const moveToTrash = (file) => {
        if (!file) return;
        // Don't duplicate trash items
        if (trashList.some((item) => item.id === file.id)) return;

        setTrashList((prev) => [
            ...prev,
            {
                id: file.id,
                fileMeta: file,
                trashedAt: new Date().toISOString(),
            },
        ]);

        if (selectedFile?.id === file.id) {
            setSelectedFile(null);
        }
    };

    const restoreFromTrash = (id) => {
        setTrashList((prev) => prev.filter((item) => item.id !== id));
    };

    const deletePermanently = async (id) => {
        try {
            setError("");
            await api.delete(`/file/${id}`);

            // Remove from local trash state
            setTrashList((prev) => prev.filter((item) => item.id !== id));

            // Remove from raw files list
            setFilesMeta((prev) => prev.filter((file) => file.id !== id));

            // Cleanup references
            setFavorites((prev) => prev.filter((fid) => fid !== id));
            setShared((prev) => prev.filter((sid) => sid !== id));

            if (selectedFile?.id === id) {
                setSelectedFile(null);
            }
        } catch (err) {
            console.error("Delete permanently failed:", err);
            setError("Could not delete file permanently from the server.");
            throw err;
        }
    };

    const uploadFile = async (fileObj) => {
        if (!fileObj) return;

        try {
            setIsUploading(true);
            setUploadFileName(fileObj.name);
            setUploadStatus("Uploading");
            setError("");
            const response = await api.post("/file/upload-link", {
                fileName: fileObj.name,
                contentType: fileObj.type,
                size: fileObj.size,
            });

            if (response.status !== 200) {
                throw new Error("Failed to get upload link from server");
            }

            const { uploadUrl, storageKey } = response.data;
            console.log(`Received upload URL: ${uploadUrl}, Storage Key: ${storageKey}`);

            // Perform the actual file upload to the provided URL
            await axios.put(uploadUrl, fileObj, {
                headers: {
                    "Content-Type": fileObj.type,
                },
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return; // Avoid division by zero
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    setUploadProgress(progress);
                    console.log(`Upload progress: ${progress}%`);
                },
            });

            setUploadStatus("Finalizing");
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Notify the server that the upload is complete (if needed, depending on backend implementation)
            const completeResponse = await api.post(`/file/complete/`, {
                storageKey,
                fileName: fileObj.name,
            });
            if (completeResponse.status !== 200) {
                throw new Error("Failed to complete upload on server");
            }
            // After successful upload, refresh the file list to include the new file
            setUploadStatus("Success");

            setTimeout(() => {
                setUploadStatus("None");
            }, 2000);
            await fetchFiles();
        } catch (err) {
            console.error("Upload failed:", err);
            setUploadStatus("Error");
            setTimeout(() => {
                setUploadStatus("None");
            }, 3000);
            setError(
                "Unable to upload file. Please check file size and connection.",
            );
            throw err;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const value = {
        files: activeFiles,
        rawFiles: filesMeta,
        trash: trashList,
        isLoading,
        error,
        setError,
        searchQuery,
        setSearchQuery,
        activeView,
        setActiveView,
        selectedFile,
        setSelectedFile,
        favorites,
        shared,
        toggleFavorite,
        toggleShared,
        moveToTrash,
        restoreFromTrash,
        deletePermanently,
        isUploading,
        uploadStatus,
        uploadProgress,
        uploadFileName,
        uploadFile,
        refreshFiles: fetchFiles,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};
