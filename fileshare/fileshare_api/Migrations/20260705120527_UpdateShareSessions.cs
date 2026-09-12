using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FileShareAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateShareSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ShareLinks_FileId",
                table: "ShareLinks");

            migrationBuilder.AddColumn<DateTime>(
                name: "DisabledAt",
                table: "ShareLinks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "ShareLinks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ShareLinks_FileId",
                table: "ShareLinks",
                column: "FileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ShareLinks_FileId",
                table: "ShareLinks");

            migrationBuilder.DropColumn(
                name: "DisabledAt",
                table: "ShareLinks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ShareLinks");

            migrationBuilder.CreateIndex(
                name: "IX_ShareLinks_FileId",
                table: "ShareLinks",
                column: "FileId",
                unique: true);
        }
    }
}
