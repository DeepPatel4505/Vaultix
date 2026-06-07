namespace FileShareAPI.Models;

public enum StorageProvider
{
    local = 1,
    r2 = 2,
    s3 = 3,
    azureBlob = 4
}

public class FileRecord
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public StorageProvider StorageProvider { get; set; } = StorageProvider.local;
    public string StorageKey { get; set; } = string.Empty;
    public int DownloadCount { get; set; } = 0;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}