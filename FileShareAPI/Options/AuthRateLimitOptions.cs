namespace FileShareAPI.Options;

public class AuthRateLimitOptions
{
    public const string Position = "AuthRateLimit";

    public int PermitLimit { get; set; } = 100;
    public int WindowSeconds { get; set; } = 60;
    public int QueueLimit { get; set; } = 0;
}
