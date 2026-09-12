namespace FileShareAPI.Options;

public sealed class ShareSettings
{
    public const string Position = "ShareSettings";

    public string BaseUrl { get; init; } = string.Empty;
}
