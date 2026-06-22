namespace FileShareAPI.Dtos;

public record AuthResultDto(
    AuthResponseDto AuthResponse,
    string RefreshToken,
    double RefreshTokenExpiry
);