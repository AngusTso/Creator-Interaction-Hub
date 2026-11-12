# Testing Strategy

## 1. Purpose

This document defines how Creator Interaction Hub will be tested and how implementation quality will be verified.

The project is developed with AI coding agents, so testing serves two purposes:

1. Verify that the application behaves according to the requirements.
2. Independently evaluate whether AI-generated implementation is correct, maintainable, and safe.

Testing should focus on meaningful behaviour rather than achieving an arbitrary code coverage percentage.

## 2. Testing Principles

- Test business rules and user-visible behaviour first.
- Prioritise security, permissions, data integrity, and core workflows.
- Keep tests reproducible.
- Do not treat successful compilation as proof of correctness.
- Verify AI-generated code independently.
- Preserve test results and review evidence instead of silently discarding them.
- Avoid unnecessary testing infrastructure for a small MVP.

## 3. Testing Tools

| Area                  | Tool                           | Purpose                                     |
| --------------------- | ------------------------------ | ------------------------------------------- |
| Backend unit tests    | Vitest                         | Test business logic and validation          |
| API integration tests | Supertest + Vitest             | Test HTTP endpoints and middleware          |
| Frontend tests        | Vitest + React Testing Library | Test important UI behaviour                 |
| Manual API testing    | curl or an API client          | Verify endpoints during development         |
| Runtime verification  | Docker Compose                 | Verify the complete application environment |

Use the tools already introduced by the project. Do not add another testing framework unless there is a clear reason.

## 4. Testing Levels

### 4.1 Unit Tests

Unit tests verify individual functions or business rules without requiring the complete application.

Priority areas:

- Question status transition validation.
- Event status validation.
- Input validation.
- Authentication-related helper functions.
- Public question filtering.
- Poll voting rules, if polls are implemented.

Example cases for question transitions:

| Current status | Requested status | Expected |
| -------------- | ---------------- | -------- |
| PENDING        | APPROVED         | Pass     |
| PENDING        | REJECTED         | Pass     |
| APPROVED       | ANSWERED         | Pass     |
| REJECTED       | APPROVED         | Fail     |
| ANSWERED       | PENDING          | Fail     |

### 4.2 API Integration Tests

API integration tests verify that routes, middleware, services, and database operations work together.

These are especially important because the core product is driven by backend business rules.

Priority cases:

**Authentication**

- Valid creator credentials allow login.
- Invalid credentials are rejected.
- Unauthenticated requests cannot access protected endpoints.

**Events**

- Creator can create an event.
- Creator can retrieve their own events.
- Creator cannot manage another creator's event.
- Only active events accept questions.

**Questions**

- Audience can submit a valid question.
- New questions are persisted as `PENDING`.
- Invalid submissions are rejected.
- Public retrieval excludes pending and rejected questions.
- Creator can approve or reject a pending question.
- Creator can mark an approved question as answered.
- Invalid status transitions are rejected.
- A creator cannot moderate questions belonging to another creator.

**Persistence**

- Created events remain available after application restart.
- Submitted questions remain available after application restart.
- Updated moderation statuses remain persisted.

**Optional polls**

- Only active polls accept votes.
- A selected option must belong to the poll.
- Duplicate votes using the same voter key are rejected.
- Closed polls reject new votes.

### 4.3 Frontend Tests

Frontend tests should focus on important behaviour rather than testing every component.

Priority cases:

- Login form handles invalid input and authentication failure.
- Event dashboard displays retrieved events.
- Moderator dashboard displays questions and their statuses.
- Approve/reject actions update the displayed state.
- Public event page does not display pending or rejected questions.
- Question submission displays success and error feedback.

### 4.4 End-to-End Manual Verification

Before submission, perform a complete workflow using the running application.

1. Start the application with Docker Compose.
2. Log in using the demo creator account.
3. Create a new event.
4. Activate the event.
5. Open the public event link in another browser or private window.
6. Submit a question as an audience member.
7. Confirm the question appears as pending in the creator dashboard.
8. Approve the question.
9. Confirm the approved question appears on the public page.
10. Mark the question as answered.
11. Confirm the updated status is visible.
12. Restart the application and verify that the event and question data remain available.

This workflow is the primary acceptance test for the MVP.

## 5. Test Data and Evidence Retention

Test cases, test reports, and useful test evidence should be retained rather than silently deleted.

### 5.1 Test data separation

Use a dedicated test database or isolated test schema for automated tests.

Automated tests must never accidentally delete or modify the development database or demonstration data.

Tests should create their own known fixtures and isolate their effects from other tests.

### 5.2 Preserve test evidence

Keep useful testing artefacts in the repository:

```text
reports/
├── testing/
│   ├── latest-test-results.txt
│   ├── test-summary.md
│   └── manual-verification.md
└── reviews/
```

The exact report format can depend on the test runner.

Retain:

- Test execution summaries.
- Failed test output and relevant error messages.
- Manual verification results.
- Important regression test cases.
- Known limitations that could not be resolved.

Do not commit secrets, credentials, personal data, or unnecessarily large generated files.

### 5.3 Do not erase useful test history

When a test fails and is later fixed, preserve the relevant historical evidence when practical.

The latest report should clearly identify the current result. Older reports can remain available for comparison.

Test fixtures may be reset inside an isolated automated test environment when required for reproducibility. This must not erase retained reports or the project's demonstration data.

## 6. Test Execution

The project should provide convenient scripts, for example:

```bash
npm test
npm run test:coverage
npm run typecheck
npm run lint
```

The actual scripts should match the package configuration.

Before submission, verify:

- Automated tests pass.
- TypeScript compilation succeeds.
- Linting succeeds, if configured.
- Docker Compose starts all required services.
- The main workflow works through the browser.
- Database data persists across application restarts.

Do not claim a test passed unless it was actually executed.

## 7. Priority and Time Allocation

Given the limited implementation time, testing should follow this order:

| Priority | Testing activity                          |
| -------- | ----------------------------------------- |
| P0       | Authentication and access control         |
| P0       | Event ownership and lifecycle             |
| P0       | Question submission and persistence       |
| P0       | Question moderation and valid transitions |
| P0       | Public/private question visibility        |
| P0       | Docker startup and database persistence   |
| P1       | Frontend behaviour and error handling     |
| P1       | Rate limiting                             |
| P1       | Regression testing                        |
| P2       | Real-time behaviour                       |
| P2       | Poll and voting tests                     |

A smaller number of meaningful tests is preferable to many superficial tests.

## 8. AI-Generated Code Verification

AI-generated implementation must not be accepted solely because it compiles or because the agent reports success.

For each meaningful implementation task:

1. Inspect the changes.
2. Review the relevant business logic.
3. Run the relevant tests.
4. Add or update tests for changed behaviour.
5. Review security-sensitive changes.
6. Confirm the implementation matches the requirements.
7. Record unresolved issues.

Cline should independently review changes made by the implementation agent. See `CLINE_REVIEW.md` for the review procedure.

## 9. Definition of Testing Completion

The testing process is considered complete for the MVP when:

- Core backend business rules have automated tests.
- Important API endpoints have integration tests.
- Authentication and ownership checks have been verified.
- Public/private question visibility has been tested.
- Database persistence has been verified.
- The complete Q&A workflow has been manually tested.
- Test results and useful evidence have been retained.
- Known failures and limitations are documented.
- No unverified claim of successful testing remains in the submission.
