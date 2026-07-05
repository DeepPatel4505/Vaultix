using Microsoft.EntityFrameworkCore;
using FileShareAPI.Models;

namespace FileShareAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options){}

    public DbSet<FileRecord> Files => Set<FileRecord>();
    public DbSet<User> Users => Set<User>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ShareLink> ShareLinks => Set<ShareLink>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<FileRecord>()
            .HasOne(file => file.User)
            .WithMany(user => user.Files)
            .HasForeignKey(file => file.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ShareLink>(entity =>
        {
            entity.HasIndex(sl => sl.Token)
                .IsUnique();

            entity.HasIndex(sl => sl.FileId)
                .IsUnique();

            entity.HasOne(sl => sl.File)
                .WithOne(file => file.ShareLink)
                .HasForeignKey<ShareLink>(sl => sl.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sl => sl.Creator)
                .WithMany()
                .HasForeignKey(sl => sl.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}