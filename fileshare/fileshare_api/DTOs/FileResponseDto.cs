namespace FileShareAPI.Dtos;

public record FileResponseDto(
    Guid Id,
    string FileName,
    long Size,
    int DownloadCount,
    DateTime UploadedAt
);