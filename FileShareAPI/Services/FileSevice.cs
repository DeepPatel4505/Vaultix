using FileShareAPI.Data;
using FileShareAPI.Dtos;
using FileShareAPI.Models;
using Microsoft.EntityFrameworkCore;


namespace FileShareAPI.Services;

public class FileService(ApplicationDbContext db, IFileStorage fileStorage) : IFileService
{
    private readonly ApplicationDbContext _db = db;
    private readonly IFileStorage _fileStorage = fileStorage;

    public async Task<FileResponseDto> UploadAsync(IFormFile file, Guid userId)
    {
        var storedFileName = await _fileStorage.UploadAsync(file);

        var fileRecord = new FileRecord
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OriginalFileName = file.FileName,
            StorageProvider = StorageProvider.local,
            StorageKey = storedFileName.StorageKey,
            ContentType = file.ContentType,
            Size = file.Length,
        };

        _db.Files.Add(fileRecord);
        await _db.SaveChangesAsync();

        return new FileResponseDto(
            fileRecord.Id,
            fileRecord.OriginalFileName,
            fileRecord.Size,
            fileRecord.DownloadCount
        );
    }

    public async Task<List<FileListDto>> GetFileListAsync(Guid userId)
    {
        var fileList = await _db.Files
            .Where(file => file.UserId == userId)
            .ToListAsync();
        return [.. fileList.Select(f => new FileListDto(
            f.Id,
            f.OriginalFileName,
            f.Size,
            f.DownloadCount
        ))];
    }

    public async Task<FileResponseDto?> GetFileAsync(Guid fileId, Guid userId)
    {
        var filedata = await _db.Files.FirstOrDefaultAsync(file => file.Id == fileId && file.UserId == userId);
        if (filedata == null) return null;
        return new FileResponseDto(
            filedata.Id,
            filedata.OriginalFileName,
            filedata.Size,
            filedata.DownloadCount
        );
    }

    public async Task<DownloadFileDto> DownloadFileAsync(Guid fileId, Guid userId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(file => file.Id == fileId && file.UserId == userId);

        if (file == null)
        {
            return null;
        }

        file.DownloadCount++;

        await _db.SaveChangesAsync();

        var Stream = await _fileStorage.GetFileAsync(file.StorageKey);

        return new DownloadFileDto(
            Stream,
            file.ContentType,
            file.OriginalFileName
        );
    }

    public async Task DeleteFileAsync(Guid fileId, Guid userId)
    {
        var fileRecord = await _db.Files.FirstOrDefaultAsync(file => file.Id == fileId && file.UserId == userId);

        if (fileRecord == null)
        {
            throw new FileNotFoundException();
        }

        await _fileStorage.DeleteFileAsync(fileRecord.StorageKey);

        _db.Files.Remove(fileRecord);

        await _db.SaveChangesAsync();
    }

}