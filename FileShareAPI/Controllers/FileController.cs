using Microsoft.AspNetCore.Mvc;
using FileShareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using FileShareAPI.Dtos;

namespace FileShareAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly IFileService _fileService;

    public FileController(IFileService fileService)
    {
        _fileService = fileService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.Parse(userIdValue!);
    }

    [HttpGet("test")]
    [AllowAnonymous]
    public IActionResult Test()
    {
        return Ok("API Working...");
    }

    [HttpPost]
    public async Task<ActionResult<FileResponseDto>> Upload(IFormFile file)
    {

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file Uploaded");
        }

        var fileRecord = await _fileService.UploadAsync(file, GetCurrentUserId());
        return Ok(fileRecord);
    }

    [HttpGet]
    public async Task<ActionResult<List<FileListDto>>> GetFiles()
    {

        var fileList = await _fileService.GetFileListAsync(GetCurrentUserId());
        return Ok(fileList);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FileResponseDto>> GetFile(Guid id)
    {

        var filedata = await _fileService.GetFileAsync(id, GetCurrentUserId());

        if (filedata == null)
        {
            return NotFound("File not found");
        }

        return Ok(filedata);
    }

    [HttpGet("download/{id}")]
    public async Task<IActionResult> Download(Guid id)
    {

        try
        {
            var file = await _fileService.DownloadFileAsync(id, GetCurrentUserId());
            return File(file.Stream, file.ContentType, file.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound("File not found");
        }
    }

    [HttpPut("download-link/{id}")]
    public async Task<ActionResult<DownloadLinkDto>> GetDownloadLink(Guid id)
    {
        try
        {
            var url = await _fileService.GenerateDownloadLinkAsync(id, GetCurrentUserId());
            return Ok(new DownloadLinkDto { Url = url.Url });
        }
        catch (FileNotFoundException)
        {
            return NotFound("File not found");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {

        try
        {
            var result = await _fileService.DeleteFileAsync(id, GetCurrentUserId());

            if (!result)
            {
                return NotFound("File not found.");
            }

            return NoContent();
        }
        catch (FileNotFoundException)
        {
            return NotFound("File not found.");
        }
    }

}

public interface IActionResult<T>
{
}