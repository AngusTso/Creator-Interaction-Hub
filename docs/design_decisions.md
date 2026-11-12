# Design Decisions

## 1. Purpose

This document records the key architectural and technical decisions made during the development of Creator Interaction Hub.

The goal is to explain not only what was selected, but also why each decision was made, what alternatives were considered, and what limitations remain.

The project is intentionally scoped as a small MVP. Decisions should prioritise correctness, maintainability, explainability, and implementation within a limited development timeframe.

## 2. Decision Summary

| Area                     | Decision                       |
| ------------------------ | ------------------------------ |
| Application architecture | Modular monolith               |
| Frontend                 | React + TypeScript             |
| Backend                  | Node.js + Express + TypeScript |
| Database                 | PostgreSQL                     |
| API communication        | REST                           |
| Real-time communication  | Socket.IO, optional            |
| Deployment               | Docker Compose                 |
| Authentication           | Short-lived bearer access tokens |
| Creator registration     | Open username/password signup   |
| Audience identity        | No account required            |
| Testing                  | Vitest + Supertest             |
| Poll functionality       | One active poll per event       |

## 3. Architecture Decisions

### ADR-001: Use a Modular Monolith

**Decision:** Implement the backend as a modular monolith instead of using microservices.

**Context:**

The application has a small number of closely related features: authentication, events, questions, and optional polls.

There is no current requirement for independent service deployment, large-scale distributed processing, or independent scaling.

**Alternatives considered:**

- Microservices architecture.
- Serverless functions.
- Modular monolith.

**Reasoning:**

A modular monolith provides clear separation of responsibilities without introducing unnecessary deployment and communication complexity.

It allows the application to be developed and tested as one backend service while keeping its internal modules organised.

**Trade-offs:**

- Simpler development and deployment.
- Easier local testing.
- Less infrastructure overhead.
- Backend modules cannot be independently deployed or scaled.

**Future consideration:**

If the application grows significantly, individual modules could be extracted into separate services based on actual scaling or organisational needs.

### ADR-002: Use React and TypeScript for the Frontend

**Decision:** Use React with TypeScript.

**Context:**

The application requires several related interfaces, including a creator dashboard, moderation dashboard, and public audience page.

**Alternatives considered:**

- React with JavaScript.
- Vue.
- React with TypeScript.

**Reasoning:**

React provides a component-based approach suitable for building reusable interfaces.

TypeScript adds static type checking, which helps reduce mistakes when handling API responses, application state, and shared data structures.

**Trade-offs:**

- Better type safety and maintainability.
- More predictable component interfaces.
- Additional type definitions and initial setup.

### ADR-003: Use Node.js and Express for the Backend

**Decision:** Use Node.js, Express, and TypeScript.

**Context:**

The application mainly handles HTTP requests, validation, authentication, database operations, and optional real-time communication.

**Alternatives considered:**

- Python with FastAPI.
- Go with a standard HTTP framework.
- Node.js with Express.

**Reasoning:**

Node.js allows TypeScript to be used across both frontend and backend.

Express provides a straightforward HTTP framework without imposing a complicated application structure.

The stack is sufficient for the expected workload and allows development effort to focus on application behaviour rather than infrastructure.

**Trade-offs:**

- Shared language and type definitions across frontend and backend are possible.
- Large ecosystem of libraries.
- Requires discipline to keep route handlers, business logic, and database access organised.

### ADR-004: Use PostgreSQL

**Decision:** Use PostgreSQL as the primary database.

**Context:**

The application contains related entities such as creators, events, questions, polls, and votes.

Data consistency is important, especially when handling moderation and voting operations.

**Alternatives considered:**

- MongoDB.
- SQLite.
- PostgreSQL.

**Reasoning:**

PostgreSQL provides relational modelling, foreign keys, unique constraints, transactions, and indexing.

These features are useful for enforcing relationships and preventing inconsistent application state.

**Trade-offs:**

- Strong relational integrity.
- Transaction support.
- Requires database configuration and migrations.
- More setup than a simple file-based database.

### ADR-005: Use REST as the Primary API

**Decision:** Use REST endpoints for frontend/backend communication.

**Context:**

The application requires standard operations such as creating events, retrieving questions, and updating moderation statuses.

**Alternatives considered:**

- REST.
- GraphQL.
- WebSocket-only communication.

**Reasoning:**

REST provides a simple, familiar interface for CRUD operations and business workflows.

It is also straightforward to test independently using HTTP integration tests.

**Trade-offs:**

- Simple request/response model.
- Easy integration with frontend components.
- Some data retrieval may require multiple requests.
- Real-time updates require an additional mechanism if desired.

REST remains the authoritative interface even if real-time communication is introduced.

## 4. Product and Scope Decisions

### ADR-006: Build an Audience Interaction Tool Instead of a Streaming Platform

**Decision:** Build a lightweight Q&A tool that operates alongside an existing livestream.

**Context:**

Building a complete livestreaming platform would require video delivery, streaming infrastructure, chat, moderation, and potentially external platform integrations.

That scope is not suitable for the available development time.

**Reasoning:**

The project focuses on one specific problem: useful audience questions can be difficult to organise in fast-moving livestream chat.

A separate interaction interface provides a manageable solution without requiring ownership of the streaming infrastructure.

**Trade-offs:**

- Smaller and more achievable scope.
- Clearer core workflow.
- No direct integration with livestreaming platforms.
- Users must access the interaction tool separately from the livestream.

### ADR-007: Prioritise Q&A Before Polls

**Decision:** Complete the question submission and moderation workflow before
implementing polls; add polls only after the core Q&A flow is reliable.

**Context:**

Both Q&A and polls can support audience interaction, but the Q&A workflow is the central product feature.

**Reasoning:**

A complete Q&A workflow demonstrates the important application concepts:

- Event management.
- Public access.
- Data submission.
- Persistent storage.
- Authentication and authorisation.
- State transitions.
- Public/private data separation.

Polls introduce additional tables, voting rules, and duplicate-vote considerations.

**Trade-offs:**

- Core functionality can be completed and verified earlier.
- Poll functionality may be absent from the final submission.
- Less feature breadth in exchange for a more reliable core product.

**Priority:** Q&A remains the core workflow. Polls are implemented in
Milestone 5 without weakening Q&A reliability.

### ADR-008: Do Not Require Audience Accounts

**Decision:** Allow audience members to submit questions and vote without
creating accounts. Creators can register using username and password.

**Context:**

The application is intended to be used alongside livestreams, where participation should require minimal effort.

**Reasoning:**

Requiring audience registration would introduce additional complexity,
including account creation, password management, and identity handling.

A display name is sufficient for the initial Q&A workflow.

**Trade-offs:**

- Lower audience participation friction.
- Simpler application design.
- Creator registration still provides per-owner event authorization.
- Limited ability to identify individual audience members.
- Greater exposure to spam and repeated submissions.

Basic rate limiting and input validation should help mitigate abuse.

For polls, a browser-issued participant key stored in local storage can
discourage duplicate votes, but it cannot guarantee one vote per real person.

## 5. Security and Data Decisions

### ADR-009: Enforce Permissions on the Backend

**Decision:** All creator-only operations require backend authentication and event ownership verification.

**Context:**

Frontend-only access restrictions can be bypassed by directly calling API endpoints.

**Reasoning:**

The backend must independently verify whether the authenticated creator is authorised to access or modify a resource.

For example, being logged in must not allow a creator to moderate another creator's questions.

**Trade-offs:**

- More reliable access control.
- Requires authentication and ownership checks across protected endpoints.
- Additional backend testing is necessary.

### ADR-010: Keep Pending Questions Private

**Decision:** Public APIs expose only approved and answered questions.

**Context:**

Audience submissions require moderation before appearing publicly.

**Reasoning:**

Pending questions may contain spam, inappropriate content, or irrelevant submissions.

Rejected questions should also remain private.

The backend must filter public responses rather than relying on the frontend to hide unwanted records.

**Trade-offs:**

- Better moderation control.
- More explicit separation between public and private data.
- Requires separate public and creator-facing retrieval logic.

### ADR-011: Use Database Constraints Alongside Application Validation

**Decision:** Enforce important data integrity rules at both application and database levels where appropriate.

**Context:**

Application validation provides useful error messages, but concurrent requests and unexpected application behaviour can still cause conflicts.

**Reasoning:**

For example, a unique database constraint on `(poll_id, voter_key)` provides stronger duplicate-vote protection than checking for an existing vote only in application code.

Similarly, foreign keys help prevent orphaned records.

**Trade-offs:**

- Stronger data integrity.
- Some rules must be implemented in more than one layer.
- Database constraint errors need to be handled cleanly by the API.

## 6. Real-Time Communication Decision

### ADR-012: Treat Socket.IO as a Best-Effort Notification Layer

**Decision:** Use REST as the authoritative API and Socket.IO for best-effort
moderator and public audience notifications.

**Context:**

Moderators need new-question notifications, and public audiences need
approved-question, event-status, and poll updates without manually refreshing.

However, real-time communication introduces connection management, room authorisation, and reconnection behaviour.

**Reasoning:**

The application must remain fully usable even when a real-time connection is unavailable.

PostgreSQL and REST remain the source of truth.

**Trade-offs:**

- Connected users see changes promptly.
- Real-time events are not guaranteed to reach disconnected clients.
- Clients must retrieve current state after reconnecting.

**Implementation rule:**

Persist data successfully before emitting a corresponding notification.

**Implementation:** Moderator rooms require a valid creator token and an event
ownership check. Audience rooms are joined using the public event code and
receive only public change notifications. The frontend reloads through REST
on notification and reconnect; REST remains authoritative.

## 7. Deployment Decisions

### ADR-013: Use Docker Compose

**Decision:** Use Docker Compose to run the frontend, backend, and PostgreSQL database.

**Context:**

The submission must be runnable in a Linux-based environment and should be easy for reviewers to evaluate.

**Reasoning:**

Docker Compose provides a reproducible environment with a single startup command.

It avoids requiring reviewers to install and configure each service independently.

**Trade-offs:**

- Consistent local environment.
- Easier reviewer setup.
- Requires Docker configuration and environment management.
- No production cloud deployment is provided.

### ADR-014: Avoid Unnecessary Infrastructure

**Decision:** Do not introduce Redis, Kafka, Kubernetes, or separate microservices.

**Context:**

The MVP has no demonstrated requirement for distributed caching, message queues, orchestration, or independent service scaling.

**Reasoning:**

Additional infrastructure would increase implementation and maintenance complexity without directly improving the core user workflow.

**Trade-offs:**

- Smaller operational footprint.
- Easier debugging and deployment.
- Less suitable for future large-scale distributed workloads.

These technologies can be reconsidered when actual requirements justify them.

## 8. Decisions That Require Human Review

AI-assisted implementation must not automatically introduce major architectural changes.

The following decisions should be reviewed by the developer before implementation:

- Changing the frontend or backend framework.
- Introducing a new database or infrastructure service.
- Changing the authentication approach.
- Modifying question or event lifecycle rules.
- Changing public/private data visibility.
- Introducing new dependencies with significant security or maintenance implications.
- Expanding the MVP scope.

The AI coding agent may propose alternatives, but should explain the reason, benefits, disadvantages, and implementation impact before making significant changes.

## 9. Future Improvements

The current design leaves room for future improvements without requiring them in the MVP.

Potential extensions include:

- Integration with YouTube or Twitch.
- More sophisticated moderation tools.
- Audience accounts and identity verification.
- Improved spam detection.
- Polls and other interaction formats.
- Analytics for creators.
- More advanced real-time delivery.

These improvements should be driven by actual product requirements rather than introduced simply to increase technical complexity.

## 10. Authentication Decision

### ADR-015: Use Short-Lived Bearer Access Tokens

**Decision:** Creator login returns a signed bearer access token that expires
after 15 minutes. Protected API requests send it in the `Authorization` header.
There is no refresh-token endpoint. Registration returns the same short-lived
token as login.

**Context:** The API design permits either a secure cookie session or a
token-based approach. The project needs creator-only API access without adding
a persistent session store.

**Reasoning:** A short-lived token is a small, stateless fit for the REST
backend. It avoids cookie-based CSRF handling and extra session-storage
infrastructure. The signing secret is provided by `JWT_SECRET` and must contain
at least 32 bytes.

**Trade-offs:**

- Simple, stateless verification across protected routes.
- The frontend must send the bearer token with each protected request.
- Creators must log in again after token expiry.
- Tokens cannot be individually revoked before expiry.
- The frontend should keep tokens in memory rather than persistent browser storage.

**Security requirements:** Passwords are hashed with bcrypt. Login failures use a generic response. The signing secret must not be committed or reused outside local development.

### ADR-016: Use a Tactile Neo-Brutalist Frontend Style

**Decision:** Use plain CSS with a matte charcoal canvas, white structural
borders, signal-yellow primary actions, sharp geometry, and hard offset button
shadows. Bundle Inter, Space Grotesk, and JetBrains Mono locally under their
OFL font licenses. Do not use Tailwind, CSS-in-JS, or a component library.

**Context:** The interface is a high-contrast companion for livestream Q&A.

**Reasoning:** Strong borders, clear status colors, and compact labels make
events and moderation states easy to scan. Local font assets avoid runtime
requests to third-party font services.

**Scope:** Poll results use rectangular bordered tracks with solid yellow
result bars and readable count/percentage text.

### ADR-017: Allow Creator Self-Registration

**Decision:** Allow creators to register with a unique, normalized username
and password. Hash passwords with bcrypt and return a short-lived access
token after successful registration.

**Context:** The developer requested a working signup flow for the local
interview demonstration while retaining the seeded demo creator.

**Reasoning:** Username/password signup demonstrates account creation without
requiring email delivery, an identity provider, or another service. Each
creator remains restricted to their own events.

**Trade-offs:** Registration is open to anyone who can reach the local app.
There is no email verification or account recovery flow; the app is not
intended as a hosted production service.

### ADR-018: Use Browser Keys for Poll Duplicate Deterrence

**Decision:** Generate a random participant key per browser and store it in
`localStorage`. Enforce uniqueness per poll in PostgreSQL.

**Reasoning:** This prevents accidental repeat votes after a reload without
requiring audience accounts.

**Trade-offs:** Clearing browser storage, using private browsing, or switching
devices can bypass the check. The key is a weak deterrent, not identity
verification.

### ADR-019: Use Single-Process Rate Limits for Local Compose

**Decision:** Apply per-client-IP in-memory limits to signup/login, question
submissions, and votes. In Compose, Vite forwards the client address and the
backend trusts the configured single proxy hop. The backend host port binds
to loopback.

**Reasoning:** This provides useful protection for one local backend without
Redis or other infrastructure.

**Trade-offs:** Counters reset on backend restart and are not shared across
multiple backend instances. This is intentionally local-development
protection, not a production distributed limiter.

### ADR-020: Send Public Changes as Socket.IO Notifications

**Decision:** Public event pages may join audience rooms using the public
event code. Question, event, and poll changes notify those rooms only after
the database transaction commits; clients reload through REST.

**Reasoning:** The existing moderator Socket.IO service can address the
audience status-update gap without making sockets the source of truth.

**Trade-offs:** Updates are best-effort while connected; reconnecting clients
must reload authoritative state through REST. Public rooms expose only
already-public changes and are separate from authenticated moderation rooms.

## 11. Final Design Principle

The project prioritises a small, complete, and explainable system over a large collection of partially implemented features.

Every architectural decision should have a clear purpose, and every implemented feature should be testable and understandable by the developer.

The final implementation should demonstrate not only the ability to direct AI tools, but also the ability to evaluate their output, understand trade-offs, and take responsibility for the resulting system.
