import api from "../lib/api";
import Card from "../components/Card";
import { useEffect, useState } from "react";

const FilesPage = () => {
    const [filesMeta, setFilesMeta] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchFilesMeta = async () => {
            try {
                setError("");
                const response = await api.get("/file");
                setFilesMeta(response.data);
            } catch (error) {
                console.error("Error fetching files metadata:", error);
                setError("We could not load the file list right now.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilesMeta();
    }, []);

    return (
        <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                <header className="border-b border-[var(--border)] pb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--foreground-muted)]">
                                File Share System
                            </p>
                            <h1 className="text-3xl font-medium tracking-tight text-[var(--foreground)] sm:text-4xl">
                                Files
                            </h1>
                            <p className="max-w-2xl text-sm text-[var(--foreground-secondary)] sm:text-base">
                                Browse uploaded files and see the basic metadata in one clean list.
                            </p>
                        </div>

                        <p className="text-sm text-[var(--foreground-secondary)]">
                            {filesMeta.length} files available
                        </p>
                    </div>
                </header>

                <section className="space-y-4">
                    {error ? (
                        <div className="border border-[var(--border)] px-4 py-3 text-sm text-[var(--destructive)]">
                            {error}
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="animate-pulse border border-[var(--border)] px-5 py-4"
                                >
                                    <div className="mb-5 h-4 w-3/4 bg-[var(--background-tertiary)]" />
                                    <div className="space-y-3">
                                        <div className="h-3 bg-[var(--background-tertiary)]" />
                                        <div className="h-3 bg-[var(--background-tertiary)]" />
                                        <div className="h-3 bg-[var(--background-tertiary)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filesMeta.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filesMeta.map((fileMeta) => (
                                <Card key={fileMeta.id} fileMeta={fileMeta} />
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-[var(--border)] px-6 py-10 text-center">
                            <h2 className="text-lg font-medium text-[var(--foreground)]">No files yet</h2>
                            <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
                                Uploaded files will appear here once the backend returns data.
                            </p>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
};

export default FilesPage;
