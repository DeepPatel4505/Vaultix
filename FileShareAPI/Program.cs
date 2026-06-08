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


var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
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
app.UseCors("AllowFrontend");

// Middleware - this will redirect HTTP requests to HTTPS
app.UseHttpsRedirection();

// Authorization middleware - this will check if the user is authorized to access the endpoint
app.UseAuthentication();
app.UseAuthorization();

// Map controllers - mapping the endpoints to the controllers
app.MapControllers();

// Run the application - this will start the web server and listen for incoming HTTP requests
app.Run();
