namespace FileShareAPI.Dtos;

public record UploadLinkRequestDto(
    string? FileName = null,
    string? ContentType = null,
    long? Size = 0
);