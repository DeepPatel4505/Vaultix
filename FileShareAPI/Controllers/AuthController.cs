using FileShareAPI.Dtos;
using FileShareAPI.Services;
using Microsoft.AspNetCore.Mvc;


namespace FileShareAPI.Controllers;


[ApiController]
[Route("/api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDetails)
    {
        try
        {
            var user = await _authService.LoginUser(loginDetails.Email, loginDetails.Password);
            return Ok(user);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDetails)
    {
        try
        {
            var user = await _authService.RegisterUser(
                registerDetails.Username,
                registerDetails.Email,
                registerDetails.Password);

            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

}