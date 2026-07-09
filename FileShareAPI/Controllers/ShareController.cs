using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using FileShareAPI.Dtos;
using FileShareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FileShareAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShareController : ControllerBase
{
    private readonly IShareService _shareService;

    public ShareController(IShareService shareService)
    {
        _shareService = shareService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.Parse(userIdValue!);
    }

    private string GetClientIp()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    public record RegenerateShareRequest(Guid FileId);

    [HttpPost]
    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> ShareFile([FromBody] CreateShareLinkRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _shareService.CreateShareLinkAsync(request, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("regenerate")]
    [Authorize]
    public async Task<IActionResult> RegenerateShare([FromBody] RegenerateShareRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _shareService.RegenerateShareLinkAsync(request.FileId, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPatch("settings")]
    [Authorize]
    public async Task<IActionResult> UpdateSettings([FromBody] CreateShareLinkRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _shareService.UpdateShareSettingsAsync(request, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet("{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShareInfo(string token)
    {
        try
        {
            var result = await _shareService.GetShareLinkInfoAsync(token);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status410Gone, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("download/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadFile(string token, [FromBody] DownloadShareRequestDto? request)
    {
        Console.WriteLine($"Download request for token: {token}, password provided: {request?.Password != null}");
        try
        {
            var clientIp = GetClientIp();
            var signedUrl = await _shareService.ProcessDownloadAsync(token, request?.Password, clientIp);
            return Ok(new { url = signedUrl });
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpDelete("{fileId}")]
    [Authorize]
    public async Task<IActionResult> DisableShare(Guid fileId)
    {
        try
        {
            Console.WriteLine($"Disable share request for fileId: {fileId}");
            var targetFileId = fileId;
            if (targetFileId == Guid.Empty)
            {
                return BadRequest(new { message = "FileId is required." });
            }

            var userId = GetCurrentUserId();
            var result = await _shareService.DisableShareLinkAsync(targetFileId, userId);
            if (!result)
            {
                return NotFound(new { message = "Share link not found for this file." });
            }
            return Ok(new { message = "Sharing disabled successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}
