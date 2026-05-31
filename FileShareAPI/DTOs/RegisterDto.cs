using System.ComponentModel.DataAnnotations;

namespace FileShareAPI.Dtos;

public record RegisterDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = string.Empty;
}