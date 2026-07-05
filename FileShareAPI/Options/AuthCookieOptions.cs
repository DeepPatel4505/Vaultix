using Microsoft.AspNetCore.Http;

namespace FileShareAPI.Options;

public sealed class AuthCookieOptions
{
    public const string Position = "Cookie";

    public bool HttpOnly { get; init; } = true;

    public bool Secure { get; init; } = true;

    public SameSiteMode SameSite { get; init; } = SameSiteMode.None;

    public string Path { get; init; } = "/";

    public string? Domain { get; init; }

    public int ExpiryDays { get; init; } = 7;

    public bool IsEssential { get; init; } = true;
}