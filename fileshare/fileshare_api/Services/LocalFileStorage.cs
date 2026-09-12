using FileShareAPI.Dtos;
using FileShareAPI.Models;

namespace FileShareAPI.Services;

public class LocalFileStorage : IFileStorage
{
    private readonly string _storagePath;

    public StorageProvider StorageProvider => StorageProvider.local;

    public LocalFileStorage(IConfiguration configuration)
    {
        _storagePath = Path.Combine(Directory.GetCurrentDirectory(), "Storage/uploads");
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    public async Task<StorageUploadResultDto> UploadAsync(IFormFile file)
    {
        var storedFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var fullPath = Path.Combine(_storagePath, storedFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return new StorageUploadResultDto(
            StorageKey: storedFileName,
            Provider: StorageProvider.local
        );
    }

    public async Task<Stream> GetFileAsync(string storageKey)
    {
        var fullPath = Path.Combine(_storagePath, storageKey);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException();
        }

        return new FileStream(fullPath, FileMode.Open, FileAccess.Read);
    }

    public async Task DeleteFileAsync(string storageKey)
    {
        var fullPath = Path.Combine(_storagePath, storageKey);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }

    public Task<string> GetFileUrlAsync(string storageKey, TimeSpan expiration, string fileName)
    {
        throw new NotImplementedException();
    }

    public Task<UploadLinkResponseDto> GenerateUploadLinkAsync(string fileName, string contentType, long size, TimeSpan expiration)
    {
        throw new NotImplementedException();
    }

    public Task<MetadataDto> GetFileMetadataAsync(string storageKey)
    {
        throw new NotImplementedException();
    }
}