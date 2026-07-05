using System.Security.Claims;
using FileShareAPI.Dtos;
using FileShareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;


namespace FileShareAPI.Controllers;


[ApiController]
[Route("/api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    private readonly Options.AuthCookieOptions _cookieOptions;

    public AuthController(IAuthService authService, IWebHostEnvironment environment, IOptions<Options.AuthCookieOptions> cookieOptions)
    {
        _authService = authService;
        _environment = environment;
        _cookieOptions = cookieOptions.Value;
    }

    private Microsoft.AspNetCore.Http.CookieOptions CreateRefreshCookieOptions(double ageInMinutes)
    {
        return new Microsoft.AspNetCore.Http.CookieOptions
        {
            HttpOnly = _cookieOptions.HttpOnly,
            Secure = _cookieOptions.Secure,
            SameSite = _cookieOptions.SameSite,
            Path = _cookieOptions.Path,
            Domain = string.IsNullOrEmpty(_cookieOptions.Domain) ? null : _cookieOptions.Domain,
            IsEssential = _cookieOptions.IsEssential,
            MaxAge = ageInMinutes > 0 ? TimeSpan.FromMinutes(ageInMinutes) : _cookieOptions.ExpiryDays > 0 ? TimeSpan.FromDays(_cookieOptions.ExpiryDays) : (TimeSpan?)null,
        };
    }

    [EnableRateLimiting("AuthRateLimit")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDetails)
    {
        try
        {
            var response = await _authService.LoginUser(loginDetails.Email, loginDetails.Password);
            var refreshToken = response.RefreshToken;

            Response.Cookies.Append("refreshToken", refreshToken, CreateRefreshCookieOptions(response.RefreshTokenExpiry));

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
            Response.Cookies.Append("refreshToken", refreshToken, CreateRefreshCookieOptions(response.RefreshTokenExpiry));

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

            Response.Cookies.Append("refreshToken", response.RefreshToken, CreateRefreshCookieOptions(response.RefreshTokenExpiry));


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
        Response.Cookies.Delete("refreshToken", CreateRefreshCookieOptions(-1));
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