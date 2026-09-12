using System;

namespace FileShareAPI.Models;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty; // Upload, Download, Delete
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string ClientIp { get; set; } = string.Empty;
}
