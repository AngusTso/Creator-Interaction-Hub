# Quick Start

## Run from a clone

Prerequisite: Docker Desktop or Docker Engine with Docker Compose.

```sh
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
cp .env.example .env
```

Replace `OWNER` and `REPOSITORY` with the published GitHub owner and repository
name.

Replace the placeholder passwords and set a unique `JWT_SECRET` of at least
32 characters in `.env`. Do not commit this file.

```sh
docker compose up --build
```

Open <http://localhost:5173>. Sign up, create and activate an event, then open
its public link in another browser to submit a question. Approve it in the
moderation view to publish it. Poll creation and voting are available from the
event and public pages.

Press `Ctrl+C` to stop. PostgreSQL data persists in a named volume; avoid
`docker compose down -v` unless you intend to delete it.

For test commands and test-database setup, see [README.md](./README.md#run-checks).
