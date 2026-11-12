# Creator Interaction Hub — Requirements

## 1. Product Overview

Creator Interaction Hub is a lightweight web application that helps livestream creators organise audience questions and interactions.

It operates alongside an existing livestream. It is not a streaming platform and does not replace existing streaming services or chat systems.

The application provides a structured way for audience members to submit questions and for moderators to review and manage them.

## 2. Problem Statement

During livestreams, audience questions can easily get buried in fast-moving chat messages.

Creators and moderators may struggle to:

- Identify meaningful questions.
- Avoid repeated or inappropriate submissions.
- Organise questions for discussion.
- Track which questions have been reviewed or answered.
- Give the audience visibility into which questions have been selected.

Creator Interaction Hub provides a separate, lightweight interface to manage this process.

## 3. Product Goals

The MVP should:

1. Allow creators to create and manage livestream events.
2. Allow creators to register and authenticate.
3. Allow audiences to submit questions without registering an account.
4. Allow moderators to review and manage submitted questions.
5. Display approved questions to the public and update them in real time.
6. Provide audience polls and voting.
7. Persist application data in PostgreSQL.
8. Provide a straightforward Docker Compose setup.
9. Demonstrate clear architecture, maintainable code, and meaningful tests.

## 4. Non-Goals

The following are explicitly outside the MVP scope:

- Hosting or streaming video.
- Integrating with YouTube, Twitch, or other streaming providers.
- Replacing existing livestream chat.
- Payments or subscriptions.
- Social networking features.
- AI-powered moderation.
- Advanced analytics.
- Mobile applications.
- Complex multi-tenant or role-based permission systems.

## 5. User Roles

### 5.1 Creator / Moderator

An authenticated user who can:

- Create an event.
- View their events.
- Activate or end an event.
- View submitted questions.
- Approve or reject questions.
- Mark approved questions as answered.
- Create and manage polls.

For the MVP, a creator can also perform moderation. Separate moderator roles are unnecessary.

### 5.2 Audience Member

An unauthenticated visitor who can:

- Access an event through its public link.
- View event information.
- Submit questions while the event is active.
- View approved and answered questions.
- Participate in active polls and view results from closed polls.

Audience members do not need accounts.

## 6. Functional Requirements

Priority definitions:

- **Must:** Required for the core MVP.
- **Should:** Important improvement if time permits.
- **Could:** Optional functionality.

### FR-01: Authentication

**Priority: Must**

- Creators must be able to register and authenticate.
- Passwords must be stored as secure hashes.
- Registration uses a unique, normalized username and a password of at least
  12 characters. Passwords must not exceed bcrypt's 72-byte input limit.
- Successful registration creates an authenticated session.
- Protected endpoints must reject unauthenticated requests.
- Invalid credentials must return an appropriate error.

A demo creator account can also be seeded for evaluation. Each creator can
manage only their own events.

### FR-02: Event Management

**Priority: Must**

Creators must be able to:

- Create an event with a title and optional description.
- View their own events.
- Activate an event.
- End an active event.

Each event must have a unique public code that can be used to access its public participation page.

Event statuses:

- `DRAFT`
- `ACTIVE`
- `ENDED`

Only active events accept new questions.

### FR-03: Public Event Access

**Priority: Must**

- Audience members can access an event using its public code.
- The public event page displays its title and description.
- The public page must reflect the current event status.
- Invalid public codes must return an appropriate not-found response.

### FR-04: Question Submission

**Priority: Must**

Audience members can submit a question by providing:

- Display name.
- Question content.

Requirements:

- No audience account is required.
- Questions must belong to an existing event.
- Questions can only be submitted to active events.
- Submitted questions must be persisted in PostgreSQL.
- New questions must initially have `PENDING` status.
- Invalid or empty submissions must be rejected.
- Limit public submissions to 5 requests per client IP per 10 minutes.
- Rate limit errors must use the standard API error envelope.

### FR-05: Question Moderation

**Priority: Must**

Authenticated creators must be able to view questions belonging to their own events.

Moderation actions:

- Approve a pending question.
- Reject a pending question.
- Mark an approved question as answered.

Question statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `ANSWERED`

Allowed transitions:

| Current status | Allowed next status |
| -------------- | ------------------- |
| PENDING        | APPROVED            |
| PENDING        | REJECTED            |
| APPROVED       | ANSWERED            |

Invalid transitions must be rejected.

A creator must not be able to moderate questions belonging to another creator's event.

### FR-06: Public Question Display

**Priority: Must**

- Public users can view approved questions.
- Public users can view answered questions.
- Pending and rejected questions must never be exposed through public endpoints.
- The public display should show the question, display name, and current public status.
- Public users must not be able to modify question statuses.

### FR-07: Real-Time Notifications

**Priority: Must**

Expected behaviour:

- Moderators receive a notification when a new question is submitted.
- Audience pages receive question-status and event-status notifications and
  refresh authoritative data without requiring a manual refresh.
- Reconnecting clients retrieve the latest state through REST APIs.

PostgreSQL remains the source of truth. Real-time events are notifications, not authoritative data.

If implementation time becomes limited, a working REST-based refresh mechanism is preferable to an unreliable real-time implementation.

### FR-08: Polls and Voting

**Priority: Could**

Creators can:

- Create a poll with a question and multiple options.
- Activate a poll.
- Close a poll.
- View poll results.

Audience members can:

- View active polls and results from closed polls.
- Vote for one option.
- See current vote counts and percentages while voting is open.

Additional rules:

- A poll must belong to an event.
- Only active polls on active events accept votes.
- An event can have at most one active poll at a time.
- Poll options must be distinct; each poll has between 2 and 6 options.
- A participant should only be able to vote once per poll.
- A browser-issued participant key stored in local storage can be used as a
  basic duplicate-vote deterrent.

The participant key does not provide reliable identity verification. Clearing
browser storage or using another browser/device allows another vote.

Poll results are public while the poll is active and remain available after it
closes. Ending an event automatically closes its active poll.

## 7. Non-Functional Requirements

### NFR-01: Maintainability

- Use a modular monolith architecture.
- Separate HTTP handling from business logic.
- Keep frontend and backend responsibilities clear.
- Use descriptive naming and consistent coding conventions.
- Avoid unnecessary abstraction and complexity.

### NFR-02: Data Integrity

- Use PostgreSQL for persistent application data.
- Define primary keys and foreign keys.
- Enforce important unique constraints.
- Validate business rules on the backend.
- Use database transactions when related operations must succeed or fail together.

### NFR-03: Security

- Hash passwords securely.
- Protect creator/moderator endpoints.
- Verify event ownership before modifications.
- Validate incoming data.
- Avoid exposing internal errors or sensitive database fields.
- Store secrets in environment variables.
- Apply in-memory, per-client-IP rate limits to registration/login, public
  question submission, and poll voting. Counters reset when the backend
  restarts; this is appropriate for the single-instance local Docker
  deployment and is not a distributed production limiter.

### NFR-04: API Consistency

Use a consistent JSON response format.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request."
  }
}
```

Use appropriate HTTP status codes.

### NFR-05: Runtime and Deployment

- The application must run using Docker Compose.
- PostgreSQL data must persist using a named volume.
- Configuration must be provided through environment variables.
- An `.env.example` file must be provided.
- Setup and execution instructions must be documented.

### NFR-06: Testing

Automated tests should cover important business rules and failure cases.

At minimum, test:

- Successful question submission.
- Submission to inactive events.
- Invalid question data.
- Question status transitions.
- Public visibility restrictions.
- Authentication requirements.
- Event ownership restrictions.

Tests must be executed before claiming they pass.

## 8. Technical Constraints

Preferred stack:

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Frontend   | React + TypeScript + Vite      |
| Backend    | Node.js + Express + TypeScript |
| Database   | PostgreSQL                     |
| API        | REST                           |
| Real-time  | Socket.IO (optional)           |
| Validation | Zod (or equivalent)            |
| Testing    | Vitest + Supertest             |
| Runtime    | Docker + Docker Compose        |

Use this stack unless an approved decision changes it.

## 9. MVP Acceptance Criteria

The core MVP is considered functionally complete when:

1. A creator can log in.
2. A creator can create an event.
3. The event has a unique public access code.
4. An audience member can access the event without logging in.
5. An audience member can submit a question.
6. The question is saved in PostgreSQL with `PENDING` status.
7. A creator can view questions belonging to their event.
8. A creator can approve or reject a pending question.
9. A creator can mark an approved question as answered.
10. Public users can see approved and answered questions only.
11. Unauthorised users cannot perform moderation actions.
12. The application can be started using the documented Docker Compose workflow.
13. Important backend business rules have automated tests.
14. A creator can register without a pre-seeded account.
15. Audience question status updates arrive without manual refresh when
    Socket.IO is connected, with REST refresh as recovery.
16. Creators can create and manage polls; audiences can vote once per browser
    key and view public active and closed results.
17. Registration, login, question submission, and voting return `429` when
    their configured rate limit is exceeded.

Polls and real-time notifications are not required for core MVP acceptance.

## 10. Scope Management Principle

The objective is to build a small but complete software system.

Prioritise:

1. Correct functionality.
2. Clear architecture.
3. Data integrity and security.
4. Meaningful automated tests.
5. Readable and maintainable code.
6. Reliable execution.

Do not add features simply to increase project size.

The project should demonstrate that AI-assisted development can produce a working result through clear specifications, critical review, and systematic verification.
