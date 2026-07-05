using System;

namespace FileShareAPI.Dtos;

public record ShareLinkResponseDto(
    Guid Id,
    string Url,
    string Token,
    bool IsPublic,
    bool PasswordProtected,
    DateTime? ExpiresAt,
    int? DownloadLimit,
    int DownloadCount,
    string Status
);
