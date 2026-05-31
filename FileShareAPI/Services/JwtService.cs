using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FileShareAPI.Models;
using Microsoft.IdentityModel.Tokens;

namespace FileShareAPI.Services;


public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(JwtRegisteredClaimNames.Name, user.Username),
            new Claim(JwtRegisteredClaimNames.Email, user.Email)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );

        var creds = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha512
        );

        var token = new JwtSecurityToken(
            issuer : _config["Jwt:Issuer"],
            audience : _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_config.GetValue<double>("Jwt:ExpiryMinutes")),
            signingCredentials : creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}