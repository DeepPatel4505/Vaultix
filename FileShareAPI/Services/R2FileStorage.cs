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

    public Task<string> GetFileUrlAsync(string storageKey, TimeSpan expiration, string fileName)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = storageKey,
            Expires = DateTime.UtcNow.Add(expiration),
            ResponseHeaderOverrides = new ResponseHeaderOverrides
            {
                ContentDisposition = $"attachment; filename=\"{fileName}\""
            }
        };
        return Task.FromResult(_client.GetPreSignedURL(request));
    }

    public Task<UploadLinkResponseDto> GenerateUploadLinkAsync(string fileName, string contentType, long size, TimeSpan expiration)
    {
        var storageKey = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";

        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = storageKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.Add(expiration),
        };

        var uploadUrl = _client.GetPreSignedURL(request);

        return Task.FromResult(new UploadLinkResponseDto(
            UploadUrl: uploadUrl,
            StorageKey: storageKey
        ));
    }

    public Task<MetadataDto> GetFileMetadataAsync(string storageKey)
    {
        var request = new GetObjectMetadataRequest
        {
            BucketName = _bucketName,
            Key = storageKey
        };

        var response = _client.GetObjectMetadataAsync(request).Result;

        return Task.FromResult(new MetadataDto(
            StorageKey: storageKey,
            ContentType: response.Headers.ContentType,
            Size: response.Headers.ContentLength
        ));
    }
}