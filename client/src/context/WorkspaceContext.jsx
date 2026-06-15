import { createContext, useState, useEffect, useContext, useMemo } from "react";
import api from "../lib/api";

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
            prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
        );
    };

    const toggleShared = (id) => {
        setShared((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
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

        const formData = new FormData();
        formData.append("file", fileObj);

        try {
            setIsUploading(true);
            setError("");
            
            await api.post("/file", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            
            // Refresh files listing
            await fetchFiles();
        } catch (err) {
            console.error("Upload failed:", err);
            setError("Unable to upload file. Please check file size and connection.");
            throw err;
        } finally {
            setIsUploading(false);
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
        uploadFile,
        refreshFiles: fetchFiles,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};
