# Creator Interaction Hub

Creator Interaction Hub is a lightweight audience Q&A tool that runs alongside
an existing livestream. It helps creators organise audience questions; it is
not a streaming platform or a replacement for livestream chat.

This repository currently contains the project foundation. Authentication,
events, questions, moderation, and polls are not implemented yet.

## Prerequisites

- Docker Engine or Docker Desktop with Docker Compose
- Node.js 22 or newer and npm, for running checks outside Docker

## Environment configuration

Copy `.env.example` to `.env` and set a local development password for
`POSTGRES_PASSWORD`. The example value is only a placeholder and must not be
used outside local development.

| Variable | Purpose | Default in example |
| --- | --- | --- |
| `POSTGRES_DB` | PostgreSQL database name | `creator_hub` |
| `POSTGRES_USER` | PostgreSQL user | `creator_hub` |
| `POSTGRES_PASSWORD` | Local PostgreSQL password | Replace before starting |
| `API_PORT` | Host port for the backend | `3000` |
| `FRONTEND_PORT` | Host port for the frontend | `5173` |

## Start the application

From the repository root, copy the example file and start all services:

```sh
cp .env.example .env
docker compose up --build
```

On Windows PowerShell, use `Copy-Item .env.example .env` for the first command.
Open <http://localhost:5173> for the frontend or
<http://localhost:3000/api/health> for the backend health endpoint. The health
endpoint also checks its PostgreSQL connection.

Docker Compose waits for PostgreSQL and the backend health checks before
starting dependent services. PostgreSQL data is stored in the `postgres_data`
named volume.

## Run checks

Install dependencies and run the backend test and type check:

```sh
npm ci --prefix backend
npm test --prefix backend
npm run typecheck --prefix backend
```

Install frontend dependencies and verify its TypeScript and production build:

```sh
npm ci --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
```
