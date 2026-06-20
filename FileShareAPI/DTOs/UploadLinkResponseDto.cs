namespace FileShareAPI.Dtos;

public record UploadLinkResponseDto(
    string UploadUrl,
    string StorageKey
);
