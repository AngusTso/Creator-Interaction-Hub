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
2. Allow audiences to submit questions without registering an account.
3. Allow moderators to review and manage submitted questions.
4. Display approved questions to the public.
5. Persist application data in PostgreSQL.
6. Provide a straightforward Docker Compose setup.
7. Demonstrate clear architecture, maintainable code, and meaningful tests.

## 4. Non-Goals

The following are explicitly outside the MVP scope:

- Hosting or streaming video.
- Integrating with YouTube, Twitch, or other streaming providers.
- Replacing existing livestream chat.
- Audience registration and account management.
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
- Optionally create and manage polls.

For the MVP, a creator can also perform moderation. Separate moderator roles are unnecessary.

### 5.2 Audience Member

An unauthenticated visitor who can:

- Access an event through its public link.
- View event information.
- Submit questions while the event is active.
- View approved and answered questions.
- Optionally participate in active polls.

Audience members do not need accounts.

## 6. Functional Requirements

Priority definitions:

- **Must:** Required for the core MVP.
- **Should:** Important improvement if time permits.
- **Could:** Optional functionality.

### FR-01: Authentication

**Priority: Must**

- Creators must be able to authenticate.
- Passwords must be stored as secure hashes.
- Protected endpoints must reject unauthenticated requests.
- Invalid credentials must return an appropriate error.

No public registration workflow is required. A demo creator account can be seeded for evaluation.

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
- Basic rate limiting should be implemented if time permits.

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

**Priority: Should**

If time permits, implement real-time notifications using Socket.IO.

Expected behaviour:

- Moderators receive a notification when a new question is submitted.
- The frontend updates relevant question information without requiring a manual refresh.
- Reconnecting clients retrieve the latest state through REST APIs.

PostgreSQL remains the source of truth. Real-time events are notifications, not authoritative data.

If implementation time becomes limited, a working REST-based refresh mechanism is preferable to an unreliable real-time implementation.

### FR-08: Polls and Voting

**Priority: Could**

If the core MVP is complete, add basic audience polls.

Creators can:

- Create a poll with a question and multiple options.
- Activate a poll.
- Close a poll.
- View poll results.

Audience members can:

- View active polls.
- Vote for one option.
- View poll results.

Additional rules:

- A poll must belong to an event.
- Only active polls accept votes.
- A participant should only be able to vote once per poll.
- A browser-issued participant key can be used as a basic duplicate-vote deterrent.

The participant key does not provide reliable identity verification.

Polls must not delay or compromise the core Q&A workflow.

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
