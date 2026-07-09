using System;
using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;
using FileShareAPI.Data;
using FileShareAPI.Dtos;
using FileShareAPI.Models;
using FileShareAPI.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FileShareAPI.Services;

public class ShareService : IShareService
{
    private readonly ApplicationDbContext _db;
    private readonly IFileStorage _fileStorage;
    private readonly ShareSettings _shareSettings;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IAuditService _auditService;

    public ShareService(
        ApplicationDbContext db,
        IFileStorage fileStorage,
        IOptions<ShareSettings> shareSettingsOptions,
        IPasswordHasher<User> passwordHasher,
        IAuditService auditService)
    {
        _db = db;
        _fileStorage = fileStorage;
        _shareSettings = shareSettingsOptions.Value;
        _passwordHasher = passwordHasher;
        _auditService = auditService;
    }

    private string GenerateSecureToken()
    {
        var bytes = new byte[16];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }

    private string? HashPassword(string? password)
    {
        if (string.IsNullOrEmpty(password)) return null;
        return _passwordHasher.HashPassword(null!, password);
    }

    private string GetShareUrl(string token)
    {
        var baseUrl = _shareSettings.BaseUrl;
        if (baseUrl.EndsWith('/'))
        {
            baseUrl = baseUrl.TrimEnd('/');
        }
        return $"{baseUrl}/{token}";
    }

    public async Task<ShareLinkResponseDto> CreateShareLinkAsync(CreateShareLinkRequestDto request, Guid userId)
    {
        // 1. Verify file exists and belongs to the user
        var fileRecord = await _db.Files
            .FirstOrDefaultAsync(f => f.Id == request.FileId && f.UserId == userId);

        if (fileRecord == null)
        {
            throw new UnauthorizedAccessException("File not found or access denied.");
        }

        ShareLink shareLink;

        if (request.ReusePreviousToken == true)
        {
            // Find the most recent inactive/disabled/expired session to reuse
            var previousLink = await _db.ShareLinks
                .Where(sl => sl.FileId == request.FileId)
                .OrderByDescending(sl => sl.CreatedAt)
                .FirstOrDefaultAsync();

            if (previousLink != null)
            {
                // Deactivate any currently active sessions first just in case
                var activeSessions = await _db.ShareLinks
                    .Where(sl => sl.FileId == request.FileId && sl.Status == ShareLinkStatus.Active && sl.Id != previousLink.Id)
                    .ToListAsync();
                foreach (var active in activeSessions)
                {
                    active.Status = ShareLinkStatus.Disabled;
                    active.IsActive = false;
                    active.DisabledAt = DateTime.UtcNow;
                    _db.ShareLinks.Update(active);
                }

                // Update settings and mark previous link as active
                previousLink.Status = ShareLinkStatus.Active;
                previousLink.IsActive = true;
                previousLink.DisabledAt = null;
                previousLink.IsPublic = request.IsPublic;
                previousLink.PasswordHash = HashPassword(request.Password);
                previousLink.ExpiresAt = request.ExpiresAt;
                previousLink.DownloadLimit = request.DownloadLimit;

                shareLink = previousLink;
                _db.ShareLinks.Update(previousLink);
            }
            else
            {
                var token = GenerateSecureToken();
                shareLink = new ShareLink
                {
                    Id = Guid.NewGuid(),
                    FileId = request.FileId,
                    Token = token,
                    IsPublic = request.IsPublic,
                    PasswordHash = HashPassword(request.Password),
                    ExpiresAt = request.ExpiresAt,
                    DownloadLimit = request.DownloadLimit,
                    DownloadCount = 0,
                    IsActive = true,
                    Status = ShareLinkStatus.Active,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow
                };
                await _db.ShareLinks.AddAsync(shareLink);
            }
        }
        else
        {
            // Deactivate any currently active sessions first
            var activeSessions = await _db.ShareLinks
                .Where(sl => sl.FileId == request.FileId && sl.Status == ShareLinkStatus.Active)
                .ToListAsync();
            foreach (var active in activeSessions)
            {
                active.Status = ShareLinkStatus.Disabled;
                active.IsActive = false;
                active.DisabledAt = DateTime.UtcNow;
                _db.ShareLinks.Update(active);
            }

            // Create a brand new share session
            var token = GenerateSecureToken();
            shareLink = new ShareLink
            {
                Id = Guid.NewGuid(),
                FileId = request.FileId,
                Token = token,
                IsPublic = request.IsPublic,
                PasswordHash = HashPassword(request.Password),
                ExpiresAt = request.ExpiresAt,
                DownloadLimit = request.DownloadLimit,
                DownloadCount = 0,
                IsActive = true,
                Status = ShareLinkStatus.Active,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };
            await _db.ShareLinks.AddAsync(shareLink);
        }

        await _db.SaveChangesAsync();

        var shareUrl = GetShareUrl(shareLink.Token);
        return new ShareLinkResponseDto(
            Id: shareLink.Id,
            Url: shareUrl,
            Token: shareLink.Token,
            IsPublic: shareLink.IsPublic,
            PasswordProtected: !string.IsNullOrEmpty(shareLink.PasswordHash),
            ExpiresAt: shareLink.ExpiresAt,
            DownloadLimit: shareLink.DownloadLimit,
            DownloadCount: shareLink.DownloadCount,
            Status: shareLink.Status.ToString()
        );
    }

    public async Task<ShareLinkResponseDto> RegenerateShareLinkAsync(Guid fileId, Guid userId)
    {
        var fileRecord = await _db.Files
            .FirstOrDefaultAsync(f => f.Id == fileId && f.UserId == userId);

        if (fileRecord == null)
        {
            throw new UnauthorizedAccessException("File not found or access denied.");
        }

        var previousLink = await _db.ShareLinks
            .Where(sl => sl.FileId == fileId)
            .OrderByDescending(sl => sl.CreatedAt)
            .FirstOrDefaultAsync();

        var activeSessions = await _db.ShareLinks
            .Where(sl => sl.FileId == fileId && sl.Status == ShareLinkStatus.Active)
            .ToListAsync();

        foreach (var active in activeSessions)
        {
            if (active.ExpiresAt.HasValue && active.ExpiresAt.Value < DateTime.UtcNow)
            {
                active.Status = ShareLinkStatus.Expired;
            }
            else if (active.DownloadLimit.HasValue && active.DownloadCount >= active.DownloadLimit.Value)
            {
                active.Status = ShareLinkStatus.DownloadLimitReached;
            }
            else
            {
                active.Status = ShareLinkStatus.Disabled;
                active.DisabledAt = DateTime.UtcNow;
            }
            active.IsActive = false;
            _db.ShareLinks.Update(active);
        }

        var token = GenerateSecureToken();
        var shareLink = new ShareLink
        {
            Id = Guid.NewGuid(),
            FileId = fileId,
            Token = token,
            IsPublic = previousLink?.IsPublic ?? true,
            PasswordHash = previousLink?.PasswordHash,
            ExpiresAt = previousLink?.ExpiresAt,
            DownloadLimit = previousLink?.DownloadLimit,
            DownloadCount = 0,
            IsActive = true,
            Status = ShareLinkStatus.Active,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };
        await _db.ShareLinks.AddAsync(shareLink);
        await _db.SaveChangesAsync();

        var shareUrl = GetShareUrl(shareLink.Token);
        return new ShareLinkResponseDto(
            Id: shareLink.Id,
            Url: shareUrl,
            Token: shareLink.Token,
            IsPublic: shareLink.IsPublic,
            PasswordProtected: !string.IsNullOrEmpty(shareLink.PasswordHash),
            ExpiresAt: shareLink.ExpiresAt,
            DownloadLimit: shareLink.DownloadLimit,
            DownloadCount: shareLink.DownloadCount,
            Status: shareLink.Status.ToString()
        );
    }

    public async Task<ShareLinkResponseDto> UpdateShareSettingsAsync(CreateShareLinkRequestDto request, Guid userId)
    {
        var fileRecord = await _db.Files
            .FirstOrDefaultAsync(f => f.Id == request.FileId && f.UserId == userId);

        if (fileRecord == null)
        {
            throw new UnauthorizedAccessException("File not found or access denied.");
        }

        var activeLink = await _db.ShareLinks
            .FirstOrDefaultAsync(sl => sl.FileId == request.FileId && sl.Status == ShareLinkStatus.Active);

        if (activeLink == null)
        {
            throw new InvalidOperationException("No active share link found for this file.");
        }

        activeLink.IsPublic = request.IsPublic;
        activeLink.PasswordHash = HashPassword(request.Password);
        activeLink.ExpiresAt = request.ExpiresAt;
        activeLink.DownloadLimit = request.DownloadLimit;

        if (activeLink.ExpiresAt.HasValue && activeLink.ExpiresAt.Value < DateTime.UtcNow)
        {
            activeLink.Status = ShareLinkStatus.Expired;
            activeLink.IsActive = false;
        }
        else if (activeLink.DownloadLimit.HasValue && activeLink.DownloadCount >= activeLink.DownloadLimit.Value)
        {
            activeLink.Status = ShareLinkStatus.DownloadLimitReached;
            activeLink.IsActive = false;
        }
        else
        {
            activeLink.Status = ShareLinkStatus.Active;
            activeLink.IsActive = true;
        }

        _db.ShareLinks.Update(activeLink);
        await _db.SaveChangesAsync();

        var shareUrl = GetShareUrl(activeLink.Token);
        return new ShareLinkResponseDto(
            Id: activeLink.Id,
            Url: shareUrl,
            Token: activeLink.Token,
            IsPublic: activeLink.IsPublic,
            PasswordProtected: !string.IsNullOrEmpty(activeLink.PasswordHash),
            ExpiresAt: activeLink.ExpiresAt,
            DownloadLimit: activeLink.DownloadLimit,
            DownloadCount: activeLink.DownloadCount,
            Status: activeLink.Status.ToString()
        );
    }

    public async Task<ShareLinkInfoDto> GetShareLinkInfoAsync(string token)
    {
        var shareLink = await _db.ShareLinks
            .Include(sl => sl.File)
            .FirstOrDefaultAsync(sl => sl.Token == token);

        if (shareLink == null || shareLink.File == null)
        {
            throw new KeyNotFoundException("This sharing link could not be found.");
        }

        // Dynamically check and update status of Active link
        if (shareLink.Status == ShareLinkStatus.Active)
        {
            if (shareLink.ExpiresAt.HasValue && shareLink.ExpiresAt.Value < DateTime.UtcNow)
            {
                shareLink.Status = ShareLinkStatus.Expired;
                shareLink.IsActive = false;
                _db.ShareLinks.Update(shareLink);
                await _db.SaveChangesAsync();
            }
            else if (shareLink.DownloadLimit.HasValue && shareLink.DownloadCount >= shareLink.DownloadLimit.Value)
            {
                shareLink.Status = ShareLinkStatus.DownloadLimitReached;
                shareLink.IsActive = false;
                _db.ShareLinks.Update(shareLink);
                await _db.SaveChangesAsync();
            }
        }

        // If not Active, throw appropriate exception
        if (shareLink.Status == ShareLinkStatus.Expired)
        {
            throw new InvalidOperationException("This sharing link has expired.");
        }
        if (shareLink.Status == ShareLinkStatus.DownloadLimitReached)
        {
            throw new InvalidOperationException("Download limit reached.");
        }
        if (shareLink.Status == ShareLinkStatus.Disabled)
        {
            throw new InvalidOperationException("This link is no longer available.");
        }
        if (shareLink.Status == ShareLinkStatus.Deleted)
        {
            throw new InvalidOperationException("This link has been deleted.");
        }

        return new ShareLinkInfoDto(
            FileName: shareLink.File.OriginalFileName,
            Size: shareLink.File.Size,
            ContentType: shareLink.File.ContentType,
            ExpiresAt: shareLink.ExpiresAt,
            DownloadLimit: shareLink.DownloadLimit,
            DownloadCount: shareLink.DownloadCount,
            PasswordRequired: !string.IsNullOrEmpty(shareLink.PasswordHash),
            IsActive: shareLink.IsActive,
            Status: shareLink.Status.ToString()
        );
    }

    public async Task<string> ProcessDownloadAsync(string token, string? password, string clientIp)
    {
        var shareLink = await _db.ShareLinks
            .Include(sl => sl.File)
            .FirstOrDefaultAsync(sl => sl.Token == token);

        if (shareLink == null || shareLink.File == null)
        {
            throw new FileNotFoundException("Share link not found.");
        }

        // Dynamically check and update status of an Active link
        // (kept for cases where nothing else touches the row concurrently;
        // the atomic claim below is the real guard against races)
        if (shareLink.Status == ShareLinkStatus.Active)
        {
            if (shareLink.ExpiresAt.HasValue && shareLink.ExpiresAt.Value < DateTime.UtcNow)
            {
                shareLink.Status = ShareLinkStatus.Expired;
                shareLink.IsActive = false;
                _db.ShareLinks.Update(shareLink);
                await _db.SaveChangesAsync();
            }
            else if (shareLink.DownloadLimit.HasValue && shareLink.DownloadCount >= shareLink.DownloadLimit.Value)
            {
                shareLink.Status = ShareLinkStatus.DownloadLimitReached;
                shareLink.IsActive = false;
                _db.ShareLinks.Update(shareLink);
                await _db.SaveChangesAsync();
            }
        }

        // Throw appropriate error if not Active
        if (shareLink.Status == ShareLinkStatus.Expired)
        {
            throw new InvalidOperationException("This sharing link has expired.");
        }
        if (shareLink.Status == ShareLinkStatus.DownloadLimitReached)
        {
            throw new InvalidOperationException("Download limit reached.");
        }
        if (shareLink.Status == ShareLinkStatus.Disabled)
        {
            throw new InvalidOperationException("This link is no longer available.");
        }
        if (shareLink.Status == ShareLinkStatus.Deleted)
        {
            throw new InvalidOperationException("This link has been deleted.");
        }

        // Password protection check
        if (!string.IsNullOrEmpty(shareLink.PasswordHash))
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new UnauthorizedAccessException("Password required.");
            }

            var verification = _passwordHasher.VerifyHashedPassword(null!, shareLink.PasswordHash, password);
            if (verification == PasswordVerificationResult.Failed)
            {
                throw new UnauthorizedAccessException("Invalid password.");
            }
        }

        // ---- Atomic claim of a download slot ----
        // This single conditional UPDATE is the concurrency guard: it only
        // succeeds for as many concurrent requests as there are remaining slots,
        // because the DB serializes writes to the same row.
        var now = DateTime.UtcNow;

        var rowsAffected = await _db.ShareLinks
            .Where(sl => sl.Id == shareLink.Id
                && sl.Status == ShareLinkStatus.Active
                && (sl.ExpiresAt == null || sl.ExpiresAt > now)
                && (sl.DownloadLimit == null || sl.DownloadCount < sl.DownloadLimit.Value))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(sl => sl.DownloadCount, sl => sl.DownloadCount + 1)
                .SetProperty(sl => sl.LastAccessedAt, now));

        if (rowsAffected == 0)
        {
            // Someone else claimed the last slot, or the link expired/was
            // disabled concurrently. Reload fresh state to report accurately.
            var current = await _db.ShareLinks.AsNoTracking()
                .FirstOrDefaultAsync(sl => sl.Id == shareLink.Id);

            if (current == null)
            {
                throw new FileNotFoundException("Share link not found.");
            }
            if (current.ExpiresAt.HasValue && current.ExpiresAt.Value < now)
            {
                throw new InvalidOperationException("This sharing link has expired.");
            }
            if (current.Status == ShareLinkStatus.Disabled)
            {
                throw new InvalidOperationException("This link is no longer available.");
            }
            if (current.Status == ShareLinkStatus.Deleted)
            {
                throw new InvalidOperationException("This link has been deleted.");
            }
            // Default / most common concurrent case
            throw new InvalidOperationException("Download limit reached.");
        }

        // We successfully claimed a slot — re-fetch the authoritative count so
        // we can decide whether *this* download tips it over the limit.
        var updatedCount = await _db.ShareLinks
            .Where(sl => sl.Id == shareLink.Id)
            .Select(sl => sl.DownloadCount)
            .FirstAsync();

        if (shareLink.DownloadLimit.HasValue && updatedCount >= shareLink.DownloadLimit.Value)
        {
            await _db.ShareLinks
                .Where(sl => sl.Id == shareLink.Id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(sl => sl.Status, ShareLinkStatus.DownloadLimitReached)
                    .SetProperty(sl => sl.IsActive, false));
        }

        // Generate pre-signed URL only after the slot is safely claimed
        var signedUrl = await _fileStorage.GetFileUrlAsync(
            shareLink.File!.StorageKey,
            TimeSpan.FromSeconds(15),
            shareLink.File.OriginalFileName
        );

        // Update file-level stats (not part of the concurrency-sensitive limit
        // check, so a plain increment is fine here)
        await _db.Files
            .Where(f => f.Id == shareLink.File.Id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(f => f.DownloadCount, f => f.DownloadCount + 1));

        // Audit Logging (using Guid.Empty for anonymous downloader)
        await _auditService.LogAsync(Guid.Empty, "ShareDownload", shareLink.File!.Id, shareLink.File.OriginalFileName, clientIp);

        return signedUrl;
    }
    public async Task<bool> DisableShareLinkAsync(Guid fileId, Guid userId)
    {
        // Check ownership of file first
        var fileRecord = await _db.Files
            .FirstOrDefaultAsync(f => f.Id == fileId && f.UserId == userId);

        if (fileRecord == null)
        {
            throw new UnauthorizedAccessException("File not found or access denied.");
        }

        var shareLink = await _db.ShareLinks
            .FirstOrDefaultAsync(sl => sl.FileId == fileId && sl.Status == ShareLinkStatus.Active);

        if (shareLink == null)
        {
            return false;
        }

        shareLink.Status = ShareLinkStatus.Disabled;
        shareLink.IsActive = false;
        shareLink.DisabledAt = DateTime.UtcNow;
        _db.ShareLinks.Update(shareLink);
        await _db.SaveChangesAsync();

        return true;
    }
}
