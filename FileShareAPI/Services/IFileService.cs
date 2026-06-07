using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IFileService
{
    Task<FileResponseDto> UploadAsync(IFormFile file, Guid userId);
    Task<List<FileListDto>> GetFileListAsync(Guid userId);
    Task<FileResponseDto?> GetFileAsync(Guid fileId, Guid userId);
    Task<DownloadFileDto> DownloadFileAsync(Guid fileId, Guid userId);
    Task DeleteFileAsync(Guid fileId, Guid userId);

}