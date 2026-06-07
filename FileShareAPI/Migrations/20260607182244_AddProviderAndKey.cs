using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FileShareAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderAndKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StoredFileName",
                table: "Files",
                newName: "StorageKey");

            migrationBuilder.AddColumn<int>(
                name: "StorageProvider",
                table: "Files",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StorageProvider",
                table: "Files");

            migrationBuilder.RenameColumn(
                name: "StorageKey",
                table: "Files",
                newName: "StoredFileName");
        }
    }
}
