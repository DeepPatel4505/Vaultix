namespace FileShareAPI.Models;

public enum ShareLinkStatus
{
    Active = 1,
    Expired = 2,
    DownloadLimitReached = 3,
    Disabled = 4,
    Deleted = 5
}
