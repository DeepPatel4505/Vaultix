namespace FileShareAPI.Dtos;

public record MetadataDto(
    string StorageKey,
    string ContentType,
    long Size
);