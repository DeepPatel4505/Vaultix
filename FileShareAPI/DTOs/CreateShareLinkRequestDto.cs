using System;

namespace FileShareAPI.Dtos;

public record CreateShareLinkRequestDto(
    Guid FileId,
    bool IsPublic,
    string? Password,
    DateTime? ExpiresAt,
    int? DownloadLimit
);
