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

    public async Task<ShareLinkResponseDto> CreateOrUpdateShareLinkAsync(CreateShareLinkRequestDto request, Guid userId)
    {
        // 1. Verify file exists and belongs to the user
        var fileRecord = await _db.Files
            .FirstOrDefaultAsync(f => f.Id == request.FileId && f.UserId == userId);

        if (fileRecord == null)
        {
            throw new UnauthorizedAccessException("File not found or access denied.");
        }

        // 2. Check if a share link already exists for this file (1-to-1)
        var existingLink = await _db.ShareLinks
            .FirstOrDefaultAsync(sl => sl.FileId == request.FileId);

        ShareLink shareLink;

        if (existingLink != null)
        {
            // Update existing share link details
            existingLink.IsPublic = request.IsPublic;
            existingLink.PasswordHash = HashPassword(request.Password);
            existingLink.ExpiresAt = request.ExpiresAt;
            existingLink.DownloadLimit = request.DownloadLimit;
            existingLink.IsActive = true; // Reactivate if deactivated
            existingLink.CreatedAt = DateTime.UtcNow; // Update sharing timestamp
            
            shareLink = existingLink;
            _db.ShareLinks.Update(existingLink);
        }
        else
        {
            // Create a brand new share link
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
            DownloadCount: shareLink.DownloadCount
        );
    }

    public async Task<ShareLinkInfoDto> GetShareLinkInfoAsync(string token)
    {
        var shareLink = await _db.ShareLinks
            .Include(sl => sl.File)
            .FirstOrDefaultAsync(sl => sl.Token == token);

        if (shareLink == null || !shareLink.IsActive || shareLink.File == null)
        {
            throw new KeyNotFoundException("Share link not found or inactive.");
        }

        return new ShareLinkInfoDto(
            FileName: shareLink.File.OriginalFileName,
            Size: shareLink.File.Size,
            ContentType: shareLink.File.ContentType,
            ExpiresAt: shareLink.ExpiresAt,
            DownloadLimit: shareLink.DownloadLimit,
            DownloadCount: shareLink.DownloadCount,
            PasswordRequired: !string.IsNullOrEmpty(shareLink.PasswordHash),
            IsActive: shareLink.IsActive
        );
    }

    public async Task<string> ProcessDownloadAsync(string token, string? password, string clientIp)
    {
        var shareLink = await _db.ShareLinks
            .Include(sl => sl.File)
            .FirstOrDefaultAsync(sl => sl.Token == token);

        if (shareLink == null || !shareLink.IsActive || shareLink.File == null)
        {
            throw new FileNotFoundException("Share link not found or inactive.");
        }

        // 1. Expiry check
        if (shareLink.ExpiresAt.HasValue && shareLink.ExpiresAt.Value < DateTime.UtcNow)
        {
            throw new InvalidOperationException("This link has expired.");
        }

        // 2. Download limit check
        if (shareLink.DownloadLimit.HasValue && shareLink.DownloadCount >= shareLink.DownloadLimit.Value)
        {
            throw new InvalidOperationException("Download limit reached.");
        }

        // 3. Password protection check
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

        // 4. Generate pre-signed URL first (to ensure success before incrementing count)
        var signedUrl = await _fileStorage.GetFileUrlAsync(
            shareLink.File!.StorageKey,
            TimeSpan.FromSeconds(15),
            shareLink.File.OriginalFileName
        );

        // 5. Update stats only after successful URL generation
        shareLink.DownloadCount++;
        shareLink.File.DownloadCount++;
        shareLink.LastAccessedAt = DateTime.UtcNow;
        _db.ShareLinks.Update(shareLink);
        await _db.SaveChangesAsync();

        // 6. Audit Logging (using Guid.Empty for anonymous downloader)
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
            .FirstOrDefaultAsync(sl => sl.FileId == fileId);

        if (shareLink == null)
        {
            return false;
        }

        shareLink.IsActive = false;
        _db.ShareLinks.Update(shareLink);
        await _db.SaveChangesAsync();

        return true;
    }
}
