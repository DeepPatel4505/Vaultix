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
                console.error(error);

                setError("Unable to load files.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilesMeta();
    }, []);

    return (
        <main className="min-h-screen bg-(--background) text-(--foreground)">
            <section className="mx-auto max-w-7xl px-6 py-12">
                <header className="mb-12">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <span
                                className="
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-(--border)
                                bg-(--surface)
                                px-3
                                py-1
                                text-xs
                                font-medium
                                uppercase
                                tracking-[0.25em]
                                text-(--primary)
                            "
                            >
                                File Share System
                            </span>

                            <h1
                                className="
                                mt-5
                                text-5xl
                                font-semibold
                                tracking-tight
                                text-(--foreground)
                            "
                            >
                                Files
                            </h1>

                            <p
                                className="
                                mt-3
                                max-w-2xl
                                text-sm
                                leading-7
                                text-(--foreground-secondary)
                            "
                            >
                                Browse uploaded files, manage downloads and
                                access your shared content from a single place.
                            </p>
                        </div>

                        <div
                            className="
                            flex
                            items-center
                            gap-3
                            rounded-(--radius-lg)
                            border
                            border-(--border)
                            bg-(--surface)
                            px-5
                            py-4
                        "
                        >
                            <div
                                className="
                                h-3
                                w-3
                                rounded-full
                                bg-(--primary)
                            "
                            />

                            <div>
                                <p
                                    className="
                                    text-xs
                                    uppercase
                                    tracking-[0.15em]
                                    text-(--foreground-muted)
                                "
                                >
                                    Total Files
                                </p>

                                <p
                                    className="
                                    text-xl
                                    font-semibold
                                    text-(--foreground)
                                "
                                >
                                    {filesMeta.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {error && (
                    <div
                        className="
                        mb-8
                        rounded-(--radius-md)
                        border
                        border-(--destructive)
                        bg-(--surface)
                        px-4
                        py-3
                        text-sm
                        text-(--destructive)
                    "
                    >
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div
                        className="
                        grid
                        gap-6
                        sm:grid-cols-2
                        xl:grid-cols-3
                        2xl:grid-cols-4
                    "
                    >
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="
                                animate-pulse
                                overflow-hidden
                                rounded-(--radius-lg)
                                border
                                border-(--border)
                                bg-(--surface)
                            "
                            >
                                <div className="h-1 bg-(--primary)" />

                                <div className="p-5">
                                    <div className="mb-5 h-28 rounded-(--radius-md) bg-(--background-secondary)" />

                                    <div className="space-y-3">
                                        <div className="h-4 rounded bg-(--background-secondary)" />
                                        <div className="h-4 w-3/4 rounded bg-(--background-secondary)" />
                                    </div>

                                    <div className="mt-5 flex gap-2">
                                        <div className="h-7 w-20 rounded-full bg-(--background-secondary)" />
                                        <div className="h-7 w-24 rounded-full bg-(--background-secondary)" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filesMeta.length > 0 ? (
                    <div
                        className="
                        grid
                        gap-6
                        sm:grid-cols-2
                        xl:grid-cols-3
                        2xl:grid-cols-4
                    "
                    >
                        {filesMeta.map((fileMeta) => (
                            <Card key={fileMeta.id} fileMeta={fileMeta} />
                        ))}
                    </div>
                ) : (
                    <div
                        className="
                        rounded-(--radius-lg)
                        border
                        border-dashed
                        border-(--border)
                        bg-(--surface)
                        px-8
                        py-20
                        text-center
                    "
                    >
                        <div
                            className="
                            mx-auto
                            mb-5
                            flex
                            h-20
                            w-20
                            items-center
                            justify-center
                            rounded-full
                            bg-(--background-secondary)
                            text-3xl
                        "
                        >
                            📁
                        </div>

                        <h2
                            className="
                            text-2xl
                            font-semibold
                            text-(--foreground)
                        "
                        >
                            No files yet
                        </h2>

                        <p
                            className="
                            mt-3
                            text-sm
                            text-(--foreground-secondary)
                        "
                        >
                            Upload your first file and it will appear here.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
};

export default FilesPage;
