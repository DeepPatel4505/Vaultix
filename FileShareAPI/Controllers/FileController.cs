using FileShareAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using FileShareAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace FileShareAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public FileController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok("API Working...");
    }

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file Uploaded");
        }

        var uploadFolder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "uploads"
        );

        Directory.CreateDirectory(uploadFolder);

        var storageFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        var fullPath = Path.Combine(
            uploadFolder,
            storageFileName
        );

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileRecord = new FileRecord
        {
            Id = Guid.NewGuid(),
            OriginalFileName = file.FileName,
            StoredFileName = storageFileName,
            ContentType = file.ContentType,
            Size = file.Length,
        };

        _db.Files.Add(fileRecord);
        await _db.SaveChangesAsync();
        return Ok(fileRecord);
    }

    [HttpGet]
    public async Task<ActionResult> FileList()
    {
        var fileList = await _db.Files.ToListAsync();
        return Ok(fileList);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> Getfile(Guid id)
    {
        var filedata = await _db.Files.FindAsync(id);

        if (filedata == null)
        {
            return NotFound("File not found");
        }

        return Ok(filedata);
    }

    [HttpGet("/download/{id}")]
    public async Task<ActionResult> DownloadFile(Guid id)
    {
        var file = await _db.Files.FindAsync(id);

        if (file == null)
        {
            return NotFound("File not found");
        }

        var fullPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "uploads",
            file.StoredFileName
        );
        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound("File does not exisit");
        }

        file.DownloadCount++;

        await _db.SaveChangesAsync();

        return PhysicalFile(
            fullPath,
            file.ContentType,
            file.OriginalFileName
        );
    }


    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFile(Guid id)
    {
        var fileRecord = await _db.Files.FindAsync(id);

        if (fileRecord == null)
        {
            return NotFound("File not found.");
        }

        var fullPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "uploads",
            fileRecord.StoredFileName
        );

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }

        _db.Files.Remove(fileRecord);

        await _db.SaveChangesAsync();

        return Ok("File deleted successfully.");
    }
}