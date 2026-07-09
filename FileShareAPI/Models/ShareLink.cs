using System;

namespace FileShareAPI.Models;

public class ShareLink
{
    public Guid Id { get; set; }
    public Guid FileId { get; set; }
    public string Token { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public string? PasswordHash { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? DownloadLimit { get; set; }
    public int DownloadCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public ShareLinkStatus Status { get; set; } = ShareLinkStatus.Active;
    public DateTime? DisabledAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastAccessedAt { get; set; }

    // Navigation properties
    public FileRecord File { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
