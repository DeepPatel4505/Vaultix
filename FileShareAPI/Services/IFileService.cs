using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IFileService
{
    Task<FileResponseDto> UploadAsync(IFormFile file, Guid userId);
    Task<UploadLinkResponseDto> GenerateUploadLinkAsync(UploadLinkRequestDto request, Guid userId);
    Task<FileResponseDto> CompleteUploadAsync(CompleteUploadRequestDto request, Guid userId);
    Task<List<FileListDto>> GetFileListAsync(Guid userId);
    Task<FileResponseDto?> GetFileAsync(Guid fileId, Guid userId);
    Task<DownloadFileDto> DownloadFileAsync(Guid fileId, Guid userId);
    Task<DownloadLinkDto> GenerateDownloadLinkAsync(Guid fileId, Guid userId);
    Task<bool> DeleteFileAsync(Guid fileId, Guid userId);

}