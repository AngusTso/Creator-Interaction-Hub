# AGENTS.md

# Creator Interaction Hub — AI Development Instructions

## 1. Project Overview

Creator Interaction Hub is a lightweight web application that helps livestream creators organise audience questions and interactions.

It runs alongside an existing livestream. It is **not** a streaming platform and does not attempt to replace YouTube, Twitch, or other streaming services.

The core workflow is:

1. A creator creates an event.
2. The system generates a public participation link.
3. Audience members submit questions without creating accounts.
4. A moderator reviews incoming questions.
5. The moderator approves, rejects, or marks questions as answered.
6. Audience members can see approved questions and their statuses.

Optional functionality includes polls and audience voting.

## 2. Your Role

You are an AI coding agent assisting with the implementation of this project.

Your responsibilities are to:

- Understand the existing requirements and architecture before making changes.
- Implement clearly defined tasks.
- Produce readable, maintainable code.
- Follow established project conventions.
- Validate input and handle errors properly.
- Write and run appropriate tests.
- Explain important implementation decisions.
- Identify risks, limitations, and ambiguities.
- Report what has and has not been completed.

You must not independently redefine the product, expand the MVP, or introduce major architectural changes without approval.

The human developer retains responsibility for:

- Product requirements and prioritisation.
- Architecture and technology decisions.
- Reviewing AI-generated code.
- Evaluating test coverage and correctness.
- Final acceptance of implementation decisions.

## 3. Evaluation Priorities

The project is evaluated primarily on:

1. **Overall system design** — whether the architecture and technical decisions make sense.
2. **Code structure** — whether the code is organised, readable, and maintainable.
3. **AI specifications** — whether AI tools are directed with clear requirements and constraints.
4. **Testing** — whether important functionality and edge cases are verified.
5. **Human readability** — whether another developer can understand and maintain the code.
6. **AI output evaluation** — whether generated code is critically reviewed and improved.
7. **Working result** — whether the implemented application actually runs and demonstrates its intended functionality.

The objective is to demonstrate effective AI-assisted software development, not to maximise project size or documentation volume.

Prefer a small, reliable, understandable implementation over an unnecessarily sophisticated one.

## 4. Technology Stack

Use the following stack unless an existing implementation or an explicitly approved decision requires otherwise.

### Frontend

- React
- TypeScript
- Vite

### Backend

- Node.js
- Express.js
- TypeScript
- REST API

### Database

- PostgreSQL

### Testing

- Vitest
- Supertest for backend API testing
- Appropriate frontend testing tools if needed

### Infrastructure

- Docker
- Docker Compose

### Optional

- Socket.IO for real-time notifications.
- Zod for request validation.

Do not introduce additional frameworks or infrastructure without a clear justification.

## 5. Scope and Priorities

The project has a strict development-time constraint. Keep the implementation manageable.

### P0 — Core MVP (Must Have)

Implement these features first:

- Creator authentication.
- Event creation.
- Event activation and ending.
- Public event access through a unique public code.
- Audience question submission.
- Question persistence in PostgreSQL.
- Moderator question dashboard.
- Question approval and rejection.
- Marking approved questions as answered.
- Public display of approved and answered questions.
- Protected moderator operations.
- Input validation and consistent error handling.
- Docker Compose setup.
- Basic automated tests.

The core Q&A workflow must work end to end before optional functionality is attempted.

### P1 — Improvements (Should Have)

Only implement after P0 is working:

- Real-time notifications for moderators when new questions arrive.
- Automatic audience-side question status updates.
- Basic rate limiting.
- Improved loading, empty, and error states.
- Better frontend usability.

### P2 — Optional Features (Could Have)

Polls and voting are optional.

If implemented, support:

- Poll creation.
- Poll options.
- Poll activation and closure.
- Audience voting.
- Duplicate-vote prevention using a browser-issued participant key.
- Poll result display.

Do not sacrifice the reliability of the core Q&A workflow to implement polls.

### Explicitly Out of Scope

Do not implement:

- Livestreaming or video hosting.
- YouTube or Twitch integration.
- A replacement for livestream chat.
- Complex audience accounts.
- Payments or subscriptions.
- Social networking functionality.
- AI moderation or summarisation.
- Advanced analytics.
- Complex role and permission systems.
- Microservices.
- Kubernetes.
- Redis or Kafka.
- Mobile applications.

If a requested task appears to require an out-of-scope feature, explain the dependency and ask before proceeding.

## 6. Architecture Guidelines

Use a **modular monolith**.

The frontend and backend should be separate applications, but the backend should remain a single deployable service.

Expected high-level structure:

```text
creator-interaction-hub/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── services/
│   │   └── types/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── events/
│   │   │   └── questions/
│   │   ├── middleware/
│   │   ├── database/
│   │   ├── config/
│   │   └── app.ts
│   └── ...
│
├── docker-compose.yml
├── README.md
├── requirements.md
├── architecture.md
├── database-design.md
├── api-design.md
├── design-decisions.md
├── testing-strategy.md
└── AGENTS.md
```

This is a suggested structure, not a requirement to create every directory immediately. Keep the structure proportional to the actual implementation.

### Backend responsibilities

Use clear separation of responsibilities:

- **Routes:** Define HTTP endpoints and connect middleware/controllers.
- **Controllers:** Handle HTTP requests and responses.
- **Services:** Implement business rules and workflows.
- **Database layer:** Handle database queries and persistence.
- **Middleware:** Handle authentication, validation, and common request processing.

Do not create unnecessary abstraction layers or classes merely to follow a pattern.

### Frontend responsibilities

Keep UI components, pages, API communication, and feature-specific logic reasonably separated.

Avoid putting the entire application into one large component.

### Source of truth

PostgreSQL is the source of truth for application data.

If Socket.IO is implemented:

- Persist data before emitting notifications.
- Treat real-time messages as notifications, not authoritative data.
- Use REST endpoints to retrieve the current state.
- Ensure the application can recover after a disconnection.

## 7. Data and Business Rules

Follow the database design and requirements documents.

Core entities:

- CreatorUsers
- Events
- Questions

Optional entities:

- Polls
- PollOptions
- Votes

### Event statuses

```text
DRAFT
ACTIVE
ENDED
```

### Question statuses

```text
PENDING
APPROVED
REJECTED
ANSWERED
```

Allowed question transitions:

```text
PENDING  -> APPROVED
PENDING  -> REJECTED
APPROVED -> ANSWERED
```

Do not allow arbitrary status changes.

### Important business rules

- Only active events accept new questions.
- Public users must not see pending or rejected questions.
- Only authorised moderators can review questions.
- Public endpoints must not expose internal user information or sensitive fields.
- Validate ownership before allowing a creator to modify an event.
- Use database constraints to protect important data relationships.
- Use transactions when multiple related database operations must succeed or fail together.

If an implementation detail conflicts with the documented requirements, do not silently choose one. Report the conflict.

## 8. API and Error Handling

Follow `api-design.md` as the API contract.

Use a consistent response structure.

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

Guidelines:

- Use appropriate HTTP status codes.
- Validate request parameters and bodies.
- Do not trust client-provided identifiers or permissions.
- Do not expose stack traces, database errors, or internal implementation details.
- Avoid returning raw database records.
- Return only the fields required by the client.
- Keep error messages understandable and consistent.

Do not change existing API response formats without considering the impact on the frontend and documented API contract.

## 9. Security Requirements

Implement reasonable baseline security for a small MVP.

At minimum:

- Hash passwords using bcrypt or an equivalent established password-hashing library.
- Never store plaintext passwords.
- Protect moderator endpoints with authentication middleware.
- Verify event ownership before allowing modifications.
- Validate and constrain user input.
- Use parameterised database queries or a safe ORM/query builder.
- Avoid exposing sensitive information in public responses.
- Keep secrets in environment variables.
- Do not commit `.env` files or credentials.
- Apply basic rate limiting to public question submission where practical.

Do not implement custom cryptographic algorithms or authentication mechanisms.

A browser-issued participant key for optional voting is only a weak duplicate-vote deterrent. Do not describe it as reliable identity verification.

## 10. Coding Standards

Write code that another developer can understand without needing to reverse-engineer AI-generated abstractions.

### General rules

- Use TypeScript types appropriately.
- Prefer clear and descriptive names.
- Keep functions focused.
- Avoid unnecessarily large files and functions.
- Avoid duplicated business logic.
- Handle expected errors explicitly.
- Avoid unexplained magic values.
- Remove unused code and dependencies.
- Do not leave debugging statements in production code.
- Add comments for non-obvious decisions, not for every line.

### TypeScript

- Avoid `any` unless there is a clear reason.
- Prefer explicit types for API contracts and important domain objects.
- Avoid unnecessary type assertions.
- Do not suppress TypeScript errors just to make the build pass.

### Database

- Use migrations or a consistent schema-management approach.
- Define primary keys and foreign keys.
- Add unique constraints where required.
- Add indexes for important query patterns.
- Avoid storing information that can be safely derived unless there is a reason.
- Keep database queries understandable.

### Dependencies

Before adding a dependency:

1. Check whether the project already has a suitable solution.
2. Explain why the new dependency is useful.
3. Consider its maintenance and complexity.
4. Prefer established, lightweight dependencies.

Do not add a library for functionality that can be implemented clearly with the existing stack.

## 11. Testing Requirements

Testing is part of implementation, not an optional final step.

For each task:

- Identify the important success cases.
- Identify relevant failure cases.
- Test important business rules.
- Test authentication and authorisation boundaries.
- Test database interactions where applicable.
- Run the relevant existing tests.
- Run the build or type-check when appropriate.

Prioritise tests for:

- Question submission.
- Submission to inactive events.
- Question status transitions.
- Public visibility restrictions.
- Moderator authentication.
- Event ownership.
- Invalid input.
- Duplicate voting, if polls are implemented.

Do not claim tests passed unless they were actually executed and the results were observed.

Do not weaken or delete tests simply to make an implementation pass.

If a test cannot be executed, state why.

## 12. Docker and Runtime Requirements

The application should be runnable using Docker Compose.

Expected services:

- Frontend
- Backend
- PostgreSQL

Guidelines:

- Use environment variables for configuration.
- Include an `.env.example`.
- Use a persistent named volume for PostgreSQL.
- Ensure service dependencies and startup behaviour are handled appropriately.
- Provide clear port mappings.
- Do not hardcode production credentials.
- Provide a usable database initialisation or migration process.

The intended reviewer experience is approximately:

```bash
git clone <repository-url>
cd <project-directory>
cp .env.example .env
docker compose up --build
```

These commands must be verified against the actual implementation before being presented as working instructions.

Do not claim that the application is production-ready merely because it runs in Docker.

## 13. Required AI Agent Workflow

For every implementation task, follow this process.

### Step 1 — Understand

Read the relevant documentation and inspect the existing code.

Identify:

- The requested behaviour.
- Relevant requirements.
- Existing implementation.
- Dependencies.
- Potential impact on other modules.

### Step 2 — Plan

Before making substantial changes, provide a short implementation plan.

The plan should identify:

- Files likely to change.
- Main implementation steps.
- Relevant business rules.
- Potential risks.
- Tests to add or update.

For a very small change, a concise plan is sufficient.

### Step 3 — Implement

Implement only the requested task.

Prefer small, focused changes.

Do not rewrite unrelated modules or refactor the entire application without approval.

### Step 4 — Verify

Run relevant checks, such as:

- Unit tests.
- Integration tests.
- Type checking.
- Linting.
- Build.
- Manual verification when appropriate.

Review the implementation for correctness and unintended side effects.

### Step 5 — Report

At the end of the task, report:

1. What was implemented.
2. Which files were changed.
3. Important design decisions.
4. Tests and commands executed.
5. Actual test results.
6. Known limitations or remaining work.
7. Any decisions that require human approval.

## 14. Decision-Making Rules

You may make small implementation decisions independently when they:

- Follow the existing architecture.
- Do not change product behaviour.
- Do not introduce significant dependencies.
- Do not create security or data-integrity risks.

Ask the human developer before:

- Changing the technology stack.
- Introducing a new major dependency or infrastructure component.
- Changing the database schema in a way that affects existing data or APIs.
- Changing documented business rules.
- Expanding the product scope.
- Introducing a new architectural pattern.
- Making security-sensitive trade-offs.
- Removing existing functionality or tests.

When requirements are ambiguous:

1. Explain the ambiguity.
2. State the reasonable options.
3. Recommend the simplest option consistent with the project.
4. Ask for clarification if the choice materially affects behaviour or architecture.

Do not silently invent requirements.

## 15. Code Review and Independent Evaluation

Generated code must be reviewed critically.

When asked to review code, inspect:

- Correctness.
- Business-rule compliance.
- Security.
- Error handling.
- Data integrity.
- Code organisation.
- Maintainability.
- Test quality.
- Unnecessary complexity.

Do not approve code merely because it compiles or passes a happy-path test.

When identifying an issue, explain:

- What the issue is.
- Why it matters.
- How it could affect the application.
- A practical correction.

Prefer specific, actionable findings over vague comments.

## 16. Time and Scope Discipline

This project has a limited development budget.

Prioritise in this order:

1. A working end-to-end Q&A workflow.
2. Correct business rules and data persistence.
3. Basic security and access control.
4. Automated tests for important behaviour.
5. Clear project structure and Docker setup.
6. UI polish.
7. Optional real-time functionality.
8. Optional polls.

If time becomes limited, reduce optional features rather than compromising core correctness.

Do not spend excessive time on:

- Elaborate UI animations.
- Over-engineered abstractions.
- Premature optimisation.
- Infrastructure unrelated to the MVP.
- Unnecessary documentation expansion.
- Features that are not part of the agreed requirements.

## 17. Definition of Done

A task is complete only when:

- Its acceptance criteria are satisfied.
- The implementation follows the documented architecture.
- Relevant business rules are enforced.
- Appropriate tests have been added or updated.
- Relevant tests have actually been executed.
- No known critical regression has been introduced.
- The code is readable and maintainable.
- Remaining limitations are documented.

The overall MVP is ready for submission when:

- A creator can authenticate and create an event.
- An audience member can submit a question.
- The question is persisted.
- A moderator can review and update its status.
- Public users can see only approved or answered questions.
- The application runs using the documented Docker Compose workflow.
- Core automated tests pass.
- The README accurately explains setup, execution, and limitations.

## 18. Final Principle

Build the simplest system that correctly satisfies the requirements.

Do not optimise for the amount of code generated.

Optimise for:

**Correctness, understandable architecture, maintainable code, meaningful tests, and a working result that the human developer can confidently explain.**
