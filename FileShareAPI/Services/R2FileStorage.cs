using Amazon.S3;
using Amazon.S3.Model;
using FileShareAPI.Dtos;
using FileShareAPI.Models;
using FileShareAPI.Options;
using Microsoft.Extensions.Options;

namespace FileShareAPI.Services;

public class R2FileStorage : IFileStorage
{
    public StorageProvider StorageProvider => StorageProvider.r2;
    private readonly string _bucketName;
    private readonly IAmazonS3 _client;

    public R2FileStorage(IAmazonS3 client, IOptions<R2Options> options)
    {
        _client = client;
        _bucketName = options.Value.BucketName;
    }

    public async Task<StorageUploadResultDto> UploadAsync(IFormFile file)
    {
        var storageKey = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        using var stream = file.OpenReadStream();

        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = storageKey,
            InputStream = stream,
            ContentType = file.ContentType,

            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true
        });

        return new StorageUploadResultDto(
            StorageKey: storageKey,
            Provider: StorageProvider.r2
        );
    }

    public async Task<Stream> GetFileAsync(string storageKey)
    {
        var response = await _client.GetObjectAsync(_bucketName, storageKey);

        return response.ResponseStream;
    }
    public async Task DeleteFileAsync(string storageKey)
    {
        await _client.DeleteObjectAsync(_bucketName, storageKey);
    }


}