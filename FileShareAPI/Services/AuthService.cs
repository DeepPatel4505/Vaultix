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

    public async Task<AuthResponseDto> LoginUser(string email, string password)
    {
        var normalizedEmail = NormalizeEmail(email);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail) ?? throw new UnauthorizedAccessException("Invalid email or password.");
        var passwordCheck = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (passwordCheck == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> RegisterUser(string username, string email, string password)
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

        return BuildAuthResponse(user);
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto(
            user.Id,
            user.Username,
            user.Email,
            token
        );
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}