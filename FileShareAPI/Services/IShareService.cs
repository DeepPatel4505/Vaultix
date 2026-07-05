using System;
using System.Threading.Tasks;
using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IShareService
{
    Task<ShareLinkResponseDto> CreateOrUpdateShareLinkAsync(CreateShareLinkRequestDto request, Guid userId);
    Task<ShareLinkInfoDto> GetShareLinkInfoAsync(string token);
    Task<string> ProcessDownloadAsync(string token, string? password, string clientIp);
    Task<bool> DisableShareLinkAsync(Guid fileId, Guid userId);
}
