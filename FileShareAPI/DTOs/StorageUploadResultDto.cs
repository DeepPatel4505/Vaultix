using FileShareAPI.Models;

namespace FileShareAPI.Dtos;
public record StorageUploadResultDto(
    string StorageKey,
    StorageProvider Provider
);