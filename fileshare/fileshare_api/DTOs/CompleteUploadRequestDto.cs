namespace FileShareAPI.Dtos;

public record CompleteUploadRequestDto(
    string StorageKey,
    string FileName
);
