# Quick Start

Follow these steps on Windows with PowerShell. Install Git and Docker Desktop
first, and start Docker Desktop before running Compose.

## 1. Clone the repository

```powershell
git clone https://github.com/AngusTso/Creator-Interaction-Hub.git
Set-Location Creator-Interaction-Hub
```

## 2. Configure local environment

```powershell
Copy-Item .env.example .env
notepad .env
```

In `.env`, replace the placeholder values. Use the same password for
`POSTGRES_PASSWORD` and `PGPASSWORD`, set a unique `JWT_SECRET` with at least
32 characters, and choose a local `SEED_CREATOR_PASSWORD`. Save the file; do
not commit it.

## 3. Build and start the application

From the repository folder, run:

```powershell
docker compose up --build
```

Wait for the services to report healthy/started. Open
<http://localhost:5173>, sign up, create and activate an event, then open its
public link in another tab to submit a question. Approve it in the moderation
view; you can also create a poll and vote on the public page.

Press `Ctrl+C` in the Compose window to stop. PostgreSQL data persists in a
named volume. Avoid `docker compose down -v` unless you intend to delete it.

On Linux or macOS, use `cd Creator-Interaction-Hub` and
`cp .env.example .env`; edit `.env` with your preferred text editor.
For test commands and test-database setup, see
[README.md](../README.md#run-checks).
