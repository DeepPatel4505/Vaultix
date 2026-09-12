using System;
using System.Threading.Tasks;

namespace FileShareAPI.Services;

public interface IAuditService
{
    Task LogAsync(Guid userId, string action, Guid fileId, string fileName, string clientIp);
}
