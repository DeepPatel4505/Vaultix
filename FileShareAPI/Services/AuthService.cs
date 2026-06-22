using System.Security.Cryptography;
using System.Text;
using FileShareAPI.Data;
using FileShareAPI.Dtos;
using FileShareAPI.Models;
using FileShareAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _db;
    private readonly JwtService _jwtService;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(
        ApplicationDbContext db,
        JwtService jwtService,
        IPasswordHasher<User> passwordHasher)
    {
        _db = db;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResultDto> LoginUser(string email, string password)
    {
        var normalizedEmail = NormalizeEmail(email);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail) ?? throw new UnauthorizedAccessException("Invalid email or password.");
        var passwordCheck = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (passwordCheck == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResultDto> RegisterUser(string username, string email, string password)
    {
        var normalizedEmail = NormalizeEmail(email);
        var normalizedUsername = username.Trim();

        var existingUser = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = normalizedUsername,
            Email = normalizedEmail
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await BuildAuthResponse(user);
    }

    private async Task<AuthResultDto> BuildAuthResponse(User user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();
        var refreshExpiresAt = _jwtService.GetRefreshTokenExpiry();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            TokenHash = HashToken(refreshToken),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddMinutes(refreshExpiresAt),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(refreshTokenEntity);
        await _db.SaveChangesAsync();

        return new AuthResultDto(
            new AuthResponseDto(
            user.Id,
            user.Username,
            user.Email,
            accessToken
            ),
            refreshToken,
            refreshExpiresAt
        );
    }

    private static string HashToken(string token)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}