namespace FileShareAPI.Dtos;

public record DownloadFileDto(
    Stream Stream,
    string ContentType,
    string FileName
);