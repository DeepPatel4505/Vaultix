using System;

namespace FileShareAPI.Dtos;

public record ShareLinkSummaryDto(
    string Token,
    bool IsPublic,
    bool PasswordProtected,
    DateTime? ExpiresAt,
    int? DownloadLimit,
    int DownloadCount,
    bool IsActive,
    string Status
);
