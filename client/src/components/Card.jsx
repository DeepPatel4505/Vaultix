const formatDate = (value) => {
    if (!value) {
        return "Unknown";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const Card = ({ fileMeta }) => {
    const sizeInMb = Number(fileMeta?.size ?? 0) / (1024 * 1024);

    return (
        <article className="border border-[var(--border)] px-5 py-4 transition-colors duration-200 hover:border-[var(--border-hover)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div className="min-w-0 space-y-3">
                    <span className="inline-flex max-w-full items-center border border-[var(--border)] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--foreground-muted)]">
                        File
                    </span>
                    <h2 className="truncate text-lg font-medium text-[var(--foreground)]">
                        {fileMeta?.originalFileName ?? "Untitled file"}
                    </h2>
                </div>

                <div className="text-xs font-medium text-[var(--foreground-secondary)]">
                    {sizeInMb.toFixed(2)} MB
                </div>
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-[var(--foreground-secondary)]">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
                    <dt className="text-[var(--foreground-muted)]">Uploaded</dt>
                    <dd className="text-right text-[var(--foreground)]">{formatDate(fileMeta?.uploadedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--foreground-muted)]">Downloads</dt>
                    <dd className="text-right font-medium text-[var(--foreground)]">
                        {fileMeta?.downloadCount ?? 0}
                    </dd>
                </div>
            </dl>
        </article>
    );
};

export default Card;
