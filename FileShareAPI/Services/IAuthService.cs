using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IAuthService
{
    Task<AuthResultDto> LoginUser(string email, string password);
    Task<AuthResultDto> RegisterUser(string username, string email, string password);

    Task<RefreshResponseDto> RefreshToken(string refreshToken);
    Task<UserDto> GetCurrentUser(Guid userId);
}