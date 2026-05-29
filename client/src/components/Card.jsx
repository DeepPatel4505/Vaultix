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

const getFileType = (fileName = "") => {
    const extension = fileName.split(".").pop()?.toUpperCase();

    if (!extension) return "FILE";

    return extension.length > 4 ? "FILE" : extension;
};

const Card = ({ fileMeta , onDownload }) => {
    const sizeInMb = Number(fileMeta?.size ?? 0) / (1024 * 1024);

    const handleDownload = () => {
        onDownload(fileMeta?.id, fileMeta?.originalFileName, fileMeta?.mimeType);
    };

    return (
        <article
            className="
            group
            relative
            overflow-hidden
            rounded-sm
            border
            border-(--border)
            bg-(--surface)
            transition-all
            duration-300
            hover:border-(--surface-hover)
            hover:bg-(--surface-hover)
            hover:shadow-(--shadow-md)
        "
        >
            <div className="p-5">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                    <h2
                        className="
                        line-clamp-2
                        text-lg
                        font-semibold
                        leading-7
                        text-(--foreground)
                    "
                    >
                        {fileMeta?.originalFileName ?? "Untitled File"}
                    </h2>
                    <div
                        className="
                    w-fit
                    py-1
                    px-3
                    rounded-lg
                    bg-(--background-secondary)
                    border
                    border-(--border)
                    flex
                    items-center
                    justify-center
                "
                    >
                        <span
                            className="
                        font-mono
                        text-xs
                        tracking-wider
                        text-(--primary)
                    "
                        >
                            {getFileType(fileMeta?.originalFileName)}
                        </span>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span
                            className="
                            rounded-full
                            bg-(--background-secondary)
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-(--foreground-secondary)
                        "
                        >
                            {sizeInMb.toFixed(2)} MB
                        </span>

                        <span
                            className="
                            rounded-full
                            bg-(--background-secondary)
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-(--primary)
                        "
                        >
                            ↓ {fileMeta?.downloadCount ?? 0}
                        </span>
                    </div>
                </div>
                <div>
                    {/* Download Button  */}
                    <button
                        className="
                        mt-5
                        w-full
                        inline-flex
                        items-center
                        justify-center
                        rounded-sm
                        bg-(--primary)
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-(--primary-foreground)
                        hover:bg-(--primary-hover)
                        hover:scale-[1.05]
                        transition-all
                        duration-300
                    "
                    onClick={handleDownload}
                    >
                        Download
                    </button>
                </div>
                <div
                    className="
                    mt-6
                    border-t
                    border-(--border)
                    pt-4
                "
                >
                    <p
                        className="
                        mt-1
                        text-sm
                        text-(--foreground-secondary)
                    "
                    >
                        {formatDate(fileMeta?.uploadedAt)}
                    </p>
                </div>
            </div>
        </article>
    );
};

export default Card;
