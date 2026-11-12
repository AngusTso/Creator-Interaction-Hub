# API Design

## 1. Overview

Creator Interaction Hub uses a REST API to connect the React frontend with the Node.js/Express backend.

The API is responsible for:

- Creator authentication.
- Event creation and management.
- Public event information.
- Audience question submission.
- Question moderation.
- Optional poll creation and voting.

The backend is the source of truth for application state, permissions, and business rules.

**Base URL**

```text
/api
```

All endpoints use JSON unless otherwise specified.

## 2. API Conventions

### 2.1 HTTP Methods

| Method | Purpose                               |
| ------ | ------------------------------------- |
| GET    | Retrieve resources                    |
| POST   | Create resources or perform an action |
| PATCH  | Partially update an existing resource |
| DELETE | Delete a resource, only if required   |

### 2.2 Response Format

Successful responses use a consistent envelope:

```json
{
  "success": true,
  "data": {
    "id": "example-id"
  }
}
```

Error responses use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid."
  }
}
```

The backend should avoid exposing stack traces, SQL errors, or other internal implementation details.

### 2.3 HTTP Status Codes

| Status | Meaning               | Example                                         |
| ------ | --------------------- | ----------------------------------------------- |
| 200    | OK                    | Successful retrieval or update                  |
| 201    | Created               | Resource successfully created                   |
| 400    | Bad Request           | Invalid request data                            |
| 401    | Unauthorized          | Missing or invalid authentication               |
| 403    | Forbidden             | Authenticated user lacks permission             |
| 404    | Not Found             | Resource does not exist                         |
| 409    | Conflict              | Invalid state transition or duplicate operation |
| 429    | Too Many Requests     | Rate limit exceeded                             |
| 500    | Internal Server Error | Unexpected server failure                       |

## 3. Authentication

Creator-only endpoints require authentication.

Audience members do not need an account to access public events or submit questions.

### 3.1 Login

**POST `/api/auth/login`**

Request:

```json
{
  "username": "demo_creator",
  "password": "example-password"
}
```

Successful response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "creator-uuid",
      "username": "demo_creator"
    },
    "accessToken": "signed-bearer-token",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

Protected endpoints require the token in the `Authorization: Bearer <accessToken>` header. Access tokens expire after 15 minutes; the creator must log in again after expiration. No public registration or refresh-token endpoint is provided.

Login failures should return a generic authentication error rather than revealing whether a username exists.

The demo creator is created by the development seed command using `SEED_CREATOR_USERNAME` and `SEED_CREATOR_PASSWORD`. These credentials must be configured locally and must not be used in production.

## 4. Event Endpoints

### 4.1 Create Event

**POST `/api/events`**

Authentication: Required.

Request:

```json
{
  "title": "Community Q&A",
  "description": "Ask questions during the livestream."
}
```

Successful response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "title": "Community Q&A",
    "description": "Ask questions during the livestream.",
    "publicCode": "abc123xyz",
    "status": "DRAFT",
    "createdAt": "2026-11-13T00:00:00Z"
  }
}
```

The backend generates the event ID and unique public code.

### 4.2 List Creator Events

**GET `/api/events`**

Authentication: Required.

Returns events owned by the authenticated creator.

Successful response:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-uuid",
        "title": "Community Q&A",
        "publicCode": "abc123xyz",
        "status": "ACTIVE",
        "createdAt": "2026-11-13T00:00:00Z"
      }
    ]
  }
}
```

### 4.3 Get Creator Event

**GET `/api/events/:id`**

Authentication: Required.

Returns event details if the authenticated creator owns the event.

### 4.4 Update Event Status

**PATCH `/api/events/:id/status`**

Authentication: Required.

Request:

```json
{
  "status": "ACTIVE"
}
```

Allowed statuses:

- `DRAFT`
- `ACTIVE`
- `ENDED`

The backend must validate the requested lifecycle transition and verify event ownership.

Allowed transitions are `DRAFT → ACTIVE` and `ACTIVE → ENDED`. Other transitions return `409 Conflict`.

Only active events accept audience questions.

### 4.5 Get Public Event

**GET `/api/public/events/:publicCode`**

Authentication: Not required.

Returns public event information.

Successful response:

```json
{
  "success": true,
  "data": {
    "event": {
      "title": "Community Q&A",
      "description": "Ask questions during the livestream.",
      "publicCode": "abc123xyz",
      "status": "ACTIVE"
    }
  }
}
```

Do not expose creator credentials, internal ownership information, or unnecessary internal fields.

## 5. Question Endpoints

### 5.1 Submit Question

**POST `/api/public/events/:publicCode/questions`**

Authentication: Not required.

Request:

```json
{
  "displayName": "Angus",
  "content": "What inspired you to start this project?"
}
```

Successful response: `201 Created`

```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question-uuid",
      "displayName": "Angus",
      "content": "What inspired you to start this project?",
      "status": "PENDING",
      "createdAt": "2026-11-13T00:00:00Z"
    }
  }
}
```

Backend requirements:

- Verify that the public event code exists.
- Verify that the event is active.
- Validate the display name and question content.
- Create the question with `PENDING` status.
- Rate limiting is deferred; public submission endpoints should be rate limited in a future milestone.
- Return a suitable error if the event is not accepting questions.

### 5.2 Get Public Questions

**GET `/api/public/events/:publicCode/questions`**

Authentication: Not required.

Returns only `APPROVED` and `ANSWERED` questions.

Results are bounded by a server-side limit. Pagination may be implemented if time permits.

Successful response:

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "question-uuid",
        "displayName": "Angus",
        "content": "What inspired you to start this project?",
        "status": "APPROVED",
        "createdAt": "2026-11-13T00:00:00Z"
      }
    ]
  }
}
```

Pending and rejected questions must never be returned through this public endpoint.

### 5.3 Get Questions for Moderation

**GET `/api/events/:id/questions`**

Authentication: Required.

Returns questions belonging to the specified event, including pending and rejected questions.

Optional query parameter:

```text
?status=PENDING
```

The backend must verify that the authenticated creator owns the event.

### 5.4 Update Question Status

**PATCH `/api/questions/:id/status`**

Authentication: Required.

Request:

```json
{
  "status": "APPROVED"
}
```

Allowed transitions:

| Current status       | Requested status | Result      |
| -------------------- | ---------------- | ----------- |
| PENDING              | APPROVED         | Allowed     |
| PENDING              | REJECTED         | Allowed     |
| APPROVED             | ANSWERED         | Allowed     |
| REJECTED             | APPROVED         | Not allowed |
| ANSWERED             | PENDING          | Not allowed |
| Any other transition | Any other status | Not allowed |

Successful response:

```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question-uuid",
      "status": "APPROVED",
      "updatedAt": "2026-11-13T00:00:00Z"
    }
  }
}
```

The backend must:

- Authenticate the creator.
- Verify ownership of the question's event.
- Validate the status transition.
- Persist the update before emitting any optional real-time notification.

Invalid transitions should return `409 Conflict`.

## 6. Optional Poll Endpoints

Poll functionality is a lower-priority extension. These endpoints should only be implemented after the core Q&A workflow is complete.

### 6.1 Create Poll

**POST `/api/events/:id/polls`**

Authentication: Required.

Request:

```json
{
  "title": "Which topic should we discuss next?",
  "options": ["Technology", "Gaming", "Entertainment"]
}
```

The backend verifies event ownership and creates the poll and its options.

### 6.2 Get Active Public Poll

**GET `/api/public/events/:publicCode/polls/active`**

Authentication: Not required.

Returns the active poll and its available options without exposing voter information.

### 6.3 Update Poll Status

**PATCH `/api/polls/:id/status`**

Authentication: Required.

Request:

```json
{
  "status": "CLOSED"
}
```

Allowed statuses:

- `DRAFT`
- `ACTIVE`
- `CLOSED`

The backend verifies event ownership and validates the transition.

### 6.4 Submit Vote

**POST `/api/polls/:id/votes`**

Authentication: Not required.

Request:

```json
{
  "optionId": "option-uuid",
  "voterKey": "browser-generated-participant-key"
}
```

The backend must verify:

- The poll exists and is active.
- The selected option belongs to that poll.
- The voter key is valid and within the expected length.
- The same voter key has not already voted in that poll.

The database unique constraint is the final protection against duplicate submissions using the same key.

### 6.5 Get Poll Results

**GET `/api/polls/:id/results`**

Authentication: Required for the creator-facing results endpoint.

Returns the available options and vote counts.

Public results can be exposed separately if the product requirements later call for them.

## 7. Authentication and Permission Matrix

| Endpoint group            | Audience | Creator         |
| ------------------------- | -------- | --------------- |
| Login                     | No       | Yes             |
| Create/list/manage events | No       | Own events only |
| Get public event          | Yes      | Yes             |
| Submit question           | Yes      | Yes             |
| Get public questions      | Yes      | Yes             |
| Get moderation questions  | No       | Own events only |
| Moderate questions        | No       | Own events only |
| Create/manage polls       | No       | Own events only |
| Submit poll vote          | Yes      | Yes             |
| View creator poll results | No       | Own events only |

Authentication alone is not sufficient for creator-only resources. The backend must also check resource ownership.

## 8. Validation and Error Handling

Request validation should be performed at the API boundary using Zod or an equivalent validation library.

Examples of validation rules:

| Field            | Example validation                  |
| ---------------- | ----------------------------------- |
| username         | Required, bounded length            |
| password         | Required                            |
| event title      | Required, maximum 200 characters    |
| display name     | Required, maximum 80 characters     |
| question content | Required, non-empty, maximum 2000 characters |
| event status     | Must be an allowed enum value       |
| question status  | Must be an allowed enum value       |
| public code      | Must match the expected format      |

Suggested error codes:

| Code                        | Meaning                               |
| --------------------------- | ------------------------------------- |
| `VALIDATION_ERROR`          | Invalid request fields                |
| `UNAUTHENTICATED`           | Authentication required               |
| `FORBIDDEN`                 | Insufficient permissions              |
| `NOT_FOUND`                 | Requested resource not found          |
| `EVENT_NOT_ACTIVE`          | Event is not accepting submissions    |
| `INVALID_STATUS_TRANSITION` | Requested state change is not allowed |
| `DUPLICATE_VOTE`            | Participant key has already voted     |
| `RATE_LIMIT_EXCEEDED`       | Too many requests                     |
| `INTERNAL_ERROR`            | Unexpected server error               |

Error messages should be understandable to the frontend without exposing internal details.

## 9. API Security Considerations

- Validate all client-supplied data on the backend.
- Hash creator passwords using a suitable password-hashing algorithm.
- Protect creator-only endpoints with authentication middleware.
- Verify event ownership for every creator operation.
- Never trust frontend-only permission checks.
- Do not expose pending or rejected questions publicly.
- Apply rate limiting to public question submission and login.
- Use parameterised database queries or a safe database library.
- Configure CORS and cookie settings appropriately for the deployment.
- Avoid logging passwords, authentication tokens, or other sensitive credentials.

## 10. API Testing Requirements

At minimum, test the following scenarios:

1. Creator can log in with valid credentials.
2. Invalid login credentials are rejected.
3. Creator can create an event.
4. Creator cannot access another creator's event.
5. Audience can retrieve a public event using its public code.
6. Audience can submit a question to an active event.
7. Audience cannot submit a question to an inactive or ended event.
8. Newly submitted questions start as `PENDING`.
9. Public question retrieval excludes pending and rejected questions.
10. Creator can approve or reject a pending question.
11. Creator can mark an approved question as answered.
12. Invalid question status transitions are rejected.
13. Unauthenticated users cannot access moderation endpoints.
14. Invalid request bodies return consistent validation errors.

Optional poll tests should cover poll ownership, active-state checks, option validation, and duplicate-vote prevention.

## 11. API Design Completion Criteria

The API design is considered implemented when:

- Core endpoints are available and documented.
- Request and response formats are consistent.
- Authentication and resource ownership are enforced.
- Public and creator-facing data are separated.
- Validation and error handling are consistent.
- Question lifecycle rules are enforced by the backend.
- Core API behaviour is covered by automated tests.
- Optional poll endpoints are only implemented if time permits.
