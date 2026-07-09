import React from "react";

export const ShareBadges = ({ shareLink }) => {
    if (!shareLink) return null;

    const badges = [];

    // If disabled or deleted, don't show any badges
    if (shareLink.status === "Disabled" || shareLink.status === "Deleted" || !shareLink.isActive) {
        if (shareLink.status === "Expired") {
            badges.push(
                <span 
                    key="expired" 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-badge-pink/10 text-badge-pink border border-badge-pink/20 shrink-0"
                >
                    ⏳ Expired
                </span>
            );
        } else if (shareLink.status === "DownloadLimitReached") {
            badges.push(
                <span 
                    key="limit-reached" 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-badge-pink/10 text-badge-pink border border-badge-pink/20 shrink-0"
                >
                    ↓ Limit Reached
                </span>
            );
        } else {
            return null;
        }
        
        return (
            <div className="flex flex-wrap gap-1 items-center select-none shrink-0">
                {badges}
            </div>
        );
    }

    // 1. Shared badge
    badges.push(
        <span 
            key="shared" 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-badge-emerald/10 text-badge-emerald border border-badge-emerald/20 shrink-0"
        >
            <span className="h-1 w-1 rounded-full bg-badge-emerald animate-pulse"></span>
            Shared
        </span>
    );

    // 2. Password badge
    if (shareLink.passwordProtected) {
        badges.push(
            <span 
                key="password" 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-badge-orange/10 text-badge-orange border border-badge-orange/20 shrink-0"
            >
                🔒 Password
            </span>
        );
    }

    // 3. Expiry badge
    if (shareLink.expiresAt) {
        const expiresAt = new Date(shareLink.expiresAt);
        const now = new Date();
        const diffMs = expiresAt - now;

        if (diffMs < 0) {
            badges.push(
                <span 
                    key="expired" 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-badge-pink/10 text-badge-pink border border-badge-pink/20 animate-pulse shrink-0"
                >
                    ⏳ Expired
                </span>
            );
        } else {
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            let displayTime = "";
            if (diffDays > 1) {
                displayTime = `${diffDays} Days`;
            } else if (diffHours > 1) {
                displayTime = `${diffHours} Hours`;
            } else {
                displayTime = "Expiring Soon";
            }

            badges.push(
                <span 
                    key="expiry" 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-badge-violet/10 text-badge-violet border border-badge-violet/20 shrink-0"
                >
                    ⏳ {displayTime}
                </span>
            );
        }
    }

    // 4. Download Limit badge
    if (shareLink.downloadLimit !== null && shareLink.downloadLimit > 0) {
        const remaining = Math.max(0, shareLink.downloadLimit - shareLink.downloadCount);
        const exhausted = remaining === 0;

        badges.push(
            <span 
                key="limit" 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    exhausted 
                        ? "bg-badge-pink/10 text-badge-pink border border-badge-pink/20 animate-pulse"
                        : "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                }`}
            >
                ↓ {shareLink.downloadCount}/{shareLink.downloadLimit}
            </span>
        );
    }

    return (
        <div className="flex flex-wrap gap-1 items-center select-none shrink-0">
            {badges}
        </div>
    );
};

export default ShareBadges;
