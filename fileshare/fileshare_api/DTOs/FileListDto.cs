using System;

namespace FileShareAPI.Dtos;

public record FileListDto(
    Guid Id,
    string FileName,
    long Size,
    int DownloadCount,
    DateTime UploadedAt,
    ShareLinkSummaryDto? ShareLink
);

