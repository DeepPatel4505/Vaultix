using FileShareAPI.Models;
using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IFileStorage
{
    StorageProvider StorageProvider { get; }
    Task<StorageUploadResultDto> UploadAsync(IFormFile file);
    Task<Stream> GetFileAsync(string storedFileName);
    Task DeleteFileAsync(string storedFileName);
}