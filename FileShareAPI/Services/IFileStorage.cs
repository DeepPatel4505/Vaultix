using FileShareAPI.Models;
using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IFileStorage
{
    StorageProvider StorageProvider { get; }
    Task<StorageUploadResultDto> UploadAsync(IFormFile file);
    Task<UploadLinkResponseDto> GenerateUploadLinkAsync(string fileName, string contentType, long size, TimeSpan expiration);
    Task<Stream> GetFileAsync(string storageKey);
    Task<string> GetFileUrlAsync(string storageKey, TimeSpan expiration, string fileName);
    Task DeleteFileAsync(string storageKey);
}