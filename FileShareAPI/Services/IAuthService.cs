using FileShareAPI.Dtos;

namespace FileShareAPI.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginUser(string email, string password);
    Task<AuthResponseDto> RegisterUser(string username, string email, string password);


}