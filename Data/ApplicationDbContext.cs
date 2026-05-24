using Microsoft.EntityFrameworkCore;
using FileShareAPI.Models;

namespace FileShareAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<FileRecord> Files => Set<FileRecord>();
}