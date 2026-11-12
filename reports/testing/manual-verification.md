# Milestone 3 Manual Verification

Date: 2026-11-13

## Automated checks

| Check | Result |
| --- | --- |
| Backend Vitest + Supertest API tests | 9 passed |
| Backend TypeScript check and build | Passed |
| Frontend Vitest + React Testing Library | 6 passed |
| Frontend TypeScript check | Passed |
| Frontend production build | Passed |
| Docker Compose configuration | Passed |

## Docker and browser workflow

The full stack built and started using `.env.example`. The host PostgreSQL
service already occupied port 5432, so the Compose database was exposed on
5433 with `POSTGRES_PORT=5433`.

1. Backend health returned `ok` with the database connected.
2. Logged in with the local demo creator.
3. Created and activated an event.
4. Opened its public link in a separate browser page and submitted a question.
5. Refreshed the moderator queue and found the question in `PENDING`.
6. Approved it and confirmed the public page showed `APPROVED`.
7. Marked it answered and confirmed the public page showed `ANSWERED`.
8. Restarted the Compose services and reloaded the public page; the event and
   answered question remained available.
9. Restarted PostgreSQL independently; the backend stayed healthy and
   reconnected successfully after logging the idle-client error.
10. Removed the temporary browser-test event and its associated questions.

The audience and moderation pages use explicit refresh controls; real-time
notifications and polls remain out of scope.
