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

At Milestone 3 completion, both pages used explicit refresh controls. Real-time
moderator notifications were added during Milestone 4; polls remain out of
scope.

## Milestone 4 Verification

Date: 2026-11-13

### Automated checks

| Check | Result |
| --- | --- |
| Backend Vitest + Supertest API and Socket.IO tests with isolated `creator_hub_test` database | 12 passed |
| Backend TypeScript check and build | Passed |
| Frontend Vitest + React Testing Library | 10 passed |
| Frontend TypeScript check and production build | Passed |
| Backend runtime dependency audit | 0 vulnerabilities |
| Frontend dependency audit | 0 vulnerabilities |
| `git diff --check` | Passed |

### Clean Compose and persistence check

Built and started a fresh, isolated Compose project with `.env.example` and
separate host ports (55432 for PostgreSQL, 3301 for the API, and 5174 for the
frontend). The existing development database volume was not used.

The API health check reported `ok` with PostgreSQL connected, and the frontend
returned HTTP 200. The Q&A API workflow succeeded: create and activate an
event, submit a question, approve it, mark it answered, restart the backend and
frontend containers, then confirm the public API still returned the question
as `ANSWERED`.

An authenticated moderator joined the event room through the frontend's Vite
proxy. A question submitted through that proxy produced a notification for the
joined room. Automated tests also verified that unauthenticated sockets and
creators attempting to join another creator's room are rejected.

### Milestone 3 review follow-up

- Issue 1: the source `/src/main.tsx` path is rewritten by Vite to hashed
  `/assets/` files in production builds. No change was needed for root-path
  deployment; a subdirectory deployment would require Vite's `base` setting.
- Issue 2: route matching and navigation were moved out of `App.tsx` into
  `frontend/src/routing.ts`, with focused route tests. Session state remains
  in `App.tsx`; a broader provider abstraction was not needed.

### Milestone 3 deferred work (subsequently addressed in Milestone 5)

Polls remain unimplemented. Public audience pages still require manual refresh
to see later status changes. Per-IP rate limiting is deferred: browser requests
pass through the Vite proxy, so the backend sees the proxy address rather than
the audience IP. Trusting forwarded headers without a defined trusted-proxy
boundary would allow clients to spoof their rate-limit identity.

## Milestone 5 Verification

Date: 2026-11-13

### Automated checks

| Check | Result |
| --- | --- |
| Backend Vitest + Supertest API, Socket.IO, and rate-limit tests with isolated `creator_hub_test` database | 17 passed |
| Backend TypeScript check and build | Passed |
| Frontend Vitest + React Testing Library | 19 passed |
| Frontend TypeScript check and production build | Passed |
| Backend runtime dependency audit | 0 vulnerabilities |
| Frontend dependency audit | 0 vulnerabilities |
| Docker Compose configuration and fresh image build | Passed |

### Docker runtime and end-to-end checks

Built and started the full stack as isolated Compose project
`creator-hub-m5-verify`, using the example environment and its own named
PostgreSQL volume. The frontend returned HTTP 200; `/api/health` reported the
backend ready with PostgreSQL connected.

The running API successfully registered a creator, created and activated an
event, accepted an audience question, kept its pending state hidden publicly,
and exposed it after approval. Poll creation and activation succeeded; a vote
was counted, reuse of its voter key returned `409`, and results remained
public after closing the poll. The question rate limiter returned `429` after
the fifth request from the same IP (one prior question submission was part of
that five-request total).

An unauthenticated audience Socket.IO client joined through the Vite proxy and
received the `event:updated` notification. After restarting the backend,
health returned successfully and the previously approved question and poll
vote were still present in PostgreSQL.
