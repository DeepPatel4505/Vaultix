using FileShareAPI.Data;
using FileShareAPI.Models;
using FileShareAPI.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.OpenApi;
using FileShareAPI.Options;
using Amazon.S3;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http.Features;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;


var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("Starting application in environment: " + builder.Environment.EnvironmentName);
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        var components = document.Components ?? new OpenApiComponents();
        document.Components = components;
        components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        components.SecuritySchemes["Bearer"] =
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Name = "Authorization",
                Description = "Enter the JWT as: Bearer {your token}"
            };

        return Task.CompletedTask;
    });
});
builder.Services.AddControllers();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit =
        100 * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize =
        100 * 1024 * 1024; // 100 MB
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;
});

builder.Services.Configure<AuthCookieOptions>(
    builder.Configuration.GetSection(AuthCookieOptions.Position));

var jwtsettings = builder.Configuration.GetSection("Jwt");
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtsettings["Issuer"],
            ValidAudience = jwtsettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtsettings["Key"]!)
            )
        };
    });

builder.Services.AddAuthorization();

// Configure Rate Limiting
var rateLimitSettings = builder.Configuration
    .GetSection(AuthRateLimitOptions.Position)
    .Get<AuthRateLimitOptions>() ?? new AuthRateLimitOptions();

builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = 
                ((int)retryAfter.TotalSeconds).ToString(System.Globalization.NumberFormatInfo.InvariantInfo);
        }
        else
        {
            context.HttpContext.Response.Headers.RetryAfter = rateLimitSettings.WindowSeconds.ToString();
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Too many requests. Please try again later.",
            retryAfterSeconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var delay) 
                ? (int)delay.TotalSeconds 
                : rateLimitSettings.WindowSeconds
        }, cancellationToken);
    };

    options.AddPolicy("AuthRateLimit", context =>
    {
        // Partition by remote client IP address
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitSettings.PermitLimit,
                Window = TimeSpan.FromSeconds(rateLimitSettings.WindowSeconds),
                QueueLimit = rateLimitSettings.QueueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            });
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<IAuditService, AuditService>();

var allowedOrigins =
    builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.Configure<R2Options>(builder.Configuration.GetSection("R2Storage"));
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var config = sp.GetRequiredService<IOptions<R2Options>>().Value;

    return new AmazonS3Client(
        config.AccessKey,
        config.SecretKey,
        new AmazonS3Config
        {
            ServiceURL = config.Endpoint,
            ForcePathStyle = true
        }
    );
});

builder.Services.AddScoped<IFileStorage, R2FileStorage>();
builder.Services.AddScoped<IFileService, FileService>();
var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}


// Build the application - this will create an instance of the web application with the configured services and middleware
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();

    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("/docs", options => options
        .AddPreferredSecuritySchemes("Bearer")
        .EnablePersistentAuthentication());
}

app.UseForwardedHeaders();
app.UseRouting();
app.UseCors("AllowFrontend");

// Middleware - this will redirect HTTP requests to HTTPS
app.UseHttpsRedirection();

app.UseRateLimiter();

// Authorization middleware - this will check if the user is authorized to access the endpoint
app.UseAuthentication();
app.UseAuthorization();

// Map controllers - mapping the endpoints to the controllers
app.MapControllers();

// Run the application - this will start the web server and listen for incoming HTTP requests
app.Run();
