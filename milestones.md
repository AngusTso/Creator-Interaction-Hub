# Creator Interaction Hub — Development Milestones

## Development Strategy

Build the application through four major milestones.

Each milestone must be completed and reviewed before moving to the next one.

The AI agent must:

- Read `AGENTS.md` and `requirements.md` before starting.
- Inspect the existing code before making changes.
- Present a short implementation plan.
- Implement only the current milestone.
- Run relevant tests and checks.
- Report completed work, changed files, test results, and remaining issues.

Do not implement future milestones prematurely.

---

## Milestone 1 — Project Foundation

**Objective:** Establish a clean, runnable development environment and the basic application architecture.

### Agent Tasks

1. Initialise the frontend using React, TypeScript, and Vite.
2. Initialise the backend using Node.js, Express, and TypeScript.
3. Set up PostgreSQL.
4. Configure Docker Compose for frontend, backend, and database.
5. Configure environment variables and `.env.example`.
6. Establish a reasonable frontend and backend directory structure.
7. Add a basic health-check endpoint.
8. Set up the testing framework.
9. Verify that all services start correctly.

### Acceptance Criteria

- Docker Compose starts all required services.
- Frontend is accessible.
- Backend responds to a health-check request.
- Backend can connect to PostgreSQL.
- TypeScript build/type-check works.
- Basic test infrastructure runs successfully.
- Setup instructions reflect the actual implementation.

### Human Review

Check:

- Whether the architecture is unnecessarily complicated.
- Whether frontend/backend responsibilities are clear.
- Whether Docker configuration is understandable.
- Whether environment variables and secrets are handled properly.

---

## Milestone 2 — Backend Core and Business Logic

**Objective:** Implement the core backend functionality, database model, and API contracts.

### Agent Tasks

1. Create database schema and migrations.
2. Implement creator authentication.
3. Implement event creation and management.
4. Implement public event access through public codes.
5. Implement question submission.
6. Implement question retrieval for moderators.
7. Implement question moderation and status transitions.
8. Implement public question retrieval with visibility restrictions.
9. Add request validation and consistent error handling.
10. Add automated backend tests.

### Acceptance Criteria

- Creator can authenticate.
- Creator can create and manage their own events.
- Public event access works using a public code.
- Audience can submit questions to active events.
- Questions are persisted with `PENDING` status.
- Moderators can review and update question statuses.
- Invalid status transitions are rejected.
- Public endpoints never expose pending or rejected questions.
- Ownership and authentication restrictions work.
- Important business rules have automated tests.

### Human Review

Check:

- Database relationships and constraints.
- API consistency.
- Business logic placement.
- Authentication and authorisation.
- Transaction handling where appropriate.
- Whether tests cover negative cases, not just successful requests.

---

## Milestone 3 — Frontend and End-to-End Integration

**Objective:** Deliver a usable application connecting the frontend to the completed backend.

### Agent Tasks

1. Implement the creator login page.
2. Implement the creator event dashboard.
3. Implement event creation and event management interfaces.
4. Implement the moderator question dashboard.
5. Implement approve, reject, and answer actions.
6. Implement the public event participation page.
7. Implement the audience question submission form.
8. Implement the public approved-question display.
9. Add loading, empty, success, and error states.
10. Verify the complete workflow across frontend, backend, and database.

### Acceptance Criteria

The following workflow must work end to end:

1. Creator logs in.
2. Creator creates an event.
3. Creator activates the event.
4. Audience opens its public link.
5. Audience submits a question.
6. The question appears in the moderator dashboard.
7. Moderator approves the question.
8. The approved question becomes visible to the audience.
9. Moderator marks it as answered.
10. Audience can see its answered status.

Data must remain available after restarting the application.

### Human Review

Check:

- Whether the user flow is intuitive.
- Whether frontend and backend API contracts match.
- Whether error states are handled properly.
- Whether public and moderator interfaces expose the correct information.
- Whether the implementation is readable and maintainable.

---

## Milestone 4 — Verification, Improvements, and Submission

**Objective:** Improve reliability, verify the completed MVP, and prepare the repository for external evaluation.

### Agent Tasks

1. Review the entire implementation against `requirements.md`.
2. Run all automated tests.
3. Fix important bugs and regressions.
4. Verify authentication and authorisation boundaries.
5. Verify database persistence and Docker startup behaviour.
6. Add basic rate limiting if feasible.
7. Add real-time moderator notifications if the core application is already reliable.
8. Add polls only if sufficient time remains.
9. Improve obvious usability issues.
10. Complete and verify README setup instructions.
11. Review code structure and remove unnecessary complexity.
12. Document known limitations.

### Acceptance Criteria

- Core MVP acceptance criteria are satisfied.
- Automated tests pass.
- Docker Compose setup works from a clean environment.
- No known critical security or data-integrity issues remain.
- README accurately describes setup and execution.
- Repository contains no committed secrets.
- Known limitations and optional features are documented.
- The developer can explain the architecture and important technical decisions.

### Human Review

Perform a final independent review:

- Can another developer understand the architecture?
- Is the code structure appropriate for the project size?
- Are important business rules enforced?
- Do tests provide meaningful confidence?
- Were AI-generated changes critically evaluated?
- Can the application be demonstrated reliably?
- Can the developer explain what was built and why?

---

## Final Development Rule

**Complete the core workflow before adding optional functionality.**

If time becomes limited, reduce or remove real-time features and polls rather than compromising correctness, security, tests, or maintainability.

The goal is not to generate the most code in the shortest time.

The goal is to use AI effectively to deliver a small, reliable, understandable software system.
