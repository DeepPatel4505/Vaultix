# FileShareSystem

<p align="center">
  <img src="https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 10" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0B1320" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-Ready-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

A small but complete file sharing app built with an ASP.NET Core API and a React + Vite frontend. It lets you upload files, browse them in a clean UI, download them back, and keep track of how many times each file has been downloaded.

## What it does

- Upload files through the API and store them on disk.
- Save metadata in PostgreSQL with Entity Framework Core.
- Show file cards in the frontend with filename, type, size, upload date, and download count.
- Download or delete files through the API.
- Keep the client and server separated for a simple, modern dev workflow.

## Stack

- Backend: ASP.NET Core Web API, Entity Framework Core, PostgreSQL, Swagger
- Frontend: React 19, Vite, Axios, Tailwind CSS
- Storage: Local filesystem for uploaded files

## Project Layout

```text
FileShareSystem/
├─ FileShareAPI/        # ASP.NET Core backend
└─ client/              # React + Vite frontend
```

## Key Features

- Upload files and persist metadata in the database.
- View a list of uploaded files from the frontend.
- Track download counts per file.
- Delete files from both the database and storage folder.
- Use Swagger during development to test the API quickly.

## Requirements

- .NET 10 SDK
- Node.js 18+ or newer
- PostgreSQL 15+ or compatible

## Getting Started

### 1) Backend

Open the backend folder and restore the API:

```bash
cd FileShareAPI
dotnet restore
dotnet ef database update
dotnet run
```

The API exposes Swagger in development and uses the connection string in `appsettings.Development.json`.

### 2) Frontend

Open the client folder, install dependencies, and start Vite:

```bash
cd client
npm install
npm run dev
```

### 3) Configure the client

The frontend reads the API base URL from `VITE_BACKEND_URL`.

Create a local env file inside `client/`:

```env
VITE_BACKEND_URL=https://localhost:7261
```

A sample file is available at [`client/.env.example`](client/.env.example).

## API Endpoints

Base route: `/api/file`

- `GET /api/file/test` - quick health check
- `POST /api/file` - upload a file
- `GET /api/file` - list all uploaded files
- `GET /api/file/{id}` - get one file record
- `GET /download/{id}` - download the stored file
- `DELETE /api/file/{id}` - remove a file record and its file on disk

## How it looks

The UI is intentionally minimal and clean: file cards, metadata at a glance, and a layout that keeps the focus on the content instead of clutter.

## Notes

- Uploaded files are stored in the backend `uploads/` folder.
- The backend enables CORS for frontend access during development.
- If your local HTTPS port differs, update `VITE_BACKEND_URL` accordingly.

## Future Ideas

- Add file preview support.
- Add auth and per-user file libraries.
- Add drag-and-drop upload in the client.
- Add search, sorting, and filters for the file list.

---

Made with ASP.NET Core, React, and a lot of practical file-moving energy.
