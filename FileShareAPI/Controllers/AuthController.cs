using System.Security.Claims;
using FileShareAPI.Dtos;
using FileShareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;


namespace FileShareAPI.Controllers;


[ApiController]
[Route("/api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
    }

    [EnableRateLimiting("AuthRateLimit")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDetails)
    {
        try
        {
            var response = await _authService.LoginUser(loginDetails.Email, loginDetails.Password);
            var refreshToken = response.RefreshToken;

            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_environment.IsDevelopment(),
                SameSite = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(response.RefreshTokenExpiry)
            });

            return Ok(response.AuthResponse);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [EnableRateLimiting("AuthRateLimit")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDetails)
    {
        try
        {
            var response = await _authService.RegisterUser(
                registerDetails.Username,
                registerDetails.Email,
                registerDetails.Password);

            var refreshToken = response.RefreshToken;
            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_environment.IsDevelopment(),
                SameSite = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(response.RefreshTokenExpiry)
            });

            return Ok(response.AuthResponse);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [EnableRateLimiting("AuthRateLimit")]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        Console.WriteLine("========== REFRESH ==========");
        Console.WriteLine($"Host: {Request.Host}");
        Console.WriteLine($"Origin: {Request.Headers.Origin}");
        Console.WriteLine($"Cookie header: {Request.Headers.Cookie}");

        foreach (var cookie in Request.Cookies)
        {
            Console.WriteLine($"{cookie.Key} = {cookie.Value}");
        }

        var refreshToken =
            Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized();
        }

        try
        {
            var response =
                await _authService.RefreshToken(refreshToken);

            Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_environment.IsDevelopment(),
                SameSite = _environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(response.RefreshTokenExpiry)
            });


            return Ok(new { accessToken = response.AccessToken });
        }
        catch (Exception ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None
        });
        return Ok();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentuser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userIdClaim is null)
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUser(
            Guid.Parse(userIdClaim)
        );

        return Ok(user);
    }

}