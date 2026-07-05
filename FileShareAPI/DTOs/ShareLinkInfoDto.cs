using System;

namespace FileShareAPI.Dtos;

public record ShareLinkInfoDto(
    string FileName,
    long Size,
    string ContentType,
    DateTime? ExpiresAt,
    int? DownloadLimit,
    int DownloadCount,
    bool PasswordRequired,
    bool IsActive
);
