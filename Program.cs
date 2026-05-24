using FileShareAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

//Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Build the application - this will create an instance of the web application with the configured services and middleware
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // app.MapOpenApi();
    app.UseSwagger();

    app.UseSwaggerUI();
}

// Middleware - this will redirect HTTP requests to HTTPS
app.UseHttpsRedirection();

// Authorization middleware - this will check if the user is authorized to access the endpoint
app.UseAuthorization();

// Map controllers - mapping the endpoints to the controllers
app.MapControllers();

// Run the application - this will start the web server and listen for incoming HTTP requests
app.Run();
