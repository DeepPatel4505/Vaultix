using System;
using System.Threading.Tasks;
using FileShareAPI.Data;
using FileShareAPI.Models;

namespace FileShareAPI.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _db;

    public AuditService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(Guid userId, string action, Guid fileId, string fileName, string clientIp)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            FileId = fileId,
            FileName = fileName,
            Timestamp = DateTime.UtcNow,
            ClientIp = clientIp
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}
