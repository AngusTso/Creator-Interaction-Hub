# Creator Interaction Hub

Creator Interaction Hub is a lightweight audience Q&A tool that runs alongside
an existing livestream. It helps creators organise audience questions; it is
not a streaming platform or a replacement for livestream chat.

The backend supports creator login, event management, public event access,
audience question submission, moderation, and public approved-question display.
The frontend remains a foundation placeholder; its user interfaces are planned
for a later milestone. Polls and real-time notifications are not implemented.

## Prerequisites

- Docker Engine or Docker Desktop with Docker Compose
- Node.js 22 or newer and npm, for running checks outside Docker
- PostgreSQL 17, if running the backend or integration tests outside Docker

## Environment configuration

Copy `.env.example` to `.env` and replace the placeholder values for
`POSTGRES_PASSWORD`, `PGPASSWORD`, `JWT_SECRET`, and `SEED_CREATOR_PASSWORD`.
Use a unique random JWT secret of at least 32 characters. The sample creator is
for local evaluation only; do not reuse these credentials outside development.
`PG*` variables configure a locally installed PostgreSQL server; Compose
overrides them to connect to its `db` service.

| Variable | Purpose | Default in example |
| --- | --- | --- |
| `POSTGRES_DB` | PostgreSQL database name | `creator_hub` |
| `POSTGRES_USER` | PostgreSQL user | `creator_hub` |
| `POSTGRES_PASSWORD` | Local PostgreSQL password | Replace before starting |
| `API_PORT` | Host port for the backend | `3000` |
| `FRONTEND_PORT` | Host port for the frontend | `5173` |
| `POSTGRES_PORT` | Host port for the Compose PostgreSQL service | `5432` |
| `JWT_SECRET` | Secret used to sign access tokens | Replace before starting |
| `SEED_CREATOR_USERNAME` | Local demo creator username | `demo_creator` |
| `SEED_CREATOR_PASSWORD` | Local demo creator password | Replace before starting |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Local PostgreSQL connection; Compose overrides these | See `.env.example` |

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
named volume. The backend applies SQL migrations and creates the demo creator
on startup. The seed is idempotent and does not change an existing creator's
password.

The API is available at `http://localhost:3000/api`:

- `POST /auth/login`
- `POST /events`, `GET /events`, `GET /events/:id`
- `PATCH /events/:id/status`
- `GET /public/events/:publicCode`
- `POST /public/events/:publicCode/questions`
- `GET /public/events/:publicCode/questions`
- `GET /events/:id/questions`
- `PATCH /questions/:id/status`

Creator endpoints require the bearer token returned by login. Event lifecycle
transitions are `DRAFT → ACTIVE → ENDED`; audience questions are accepted only
while an event is active. Login tokens expire after 15 minutes and there is no
refresh-token endpoint.

Basic request validation and ownership checks are implemented. Per-IP rate
limiting is deferred; proxy-aware rate limits need a deliberate configuration
because browser API requests pass through the Vite proxy in development.

## Run checks

Install dependencies and run backend tests and the type check:

```sh
npm ci --prefix backend
npm test --prefix backend
npm run typecheck --prefix backend
```

API integration tests use a dedicated PostgreSQL database whose name ends in
`_test`. Create that database separately and set `TEST_DATABASE_URL` in the
ignored `.env` file (see the commented example in `.env.example`). The test
setup refuses to clear tables unless this safeguard is satisfied. Without that
variable, database integration tests are skipped.

Install frontend dependencies and verify its TypeScript and production build:

```sh
npm ci --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
```
