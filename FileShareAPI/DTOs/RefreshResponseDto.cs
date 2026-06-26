namespace FileShareAPI.Dtos;

public record RefreshResponseDto(
    string AccessToken,
    string RefreshToken,
    int RefreshTokenExpiry
);