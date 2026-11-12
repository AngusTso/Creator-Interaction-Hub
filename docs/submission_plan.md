# Candidate Work Submission Plan

## 1. Submission Objective

Build and submit a working project that demonstrates effective use of AI tools throughout the software development process.

The objective is not to maximise project size or feature count. It is to demonstrate the ability to:

- Identify and define a practical problem.
- Translate the problem into clear requirements.
- Direct AI tools with structured instructions.
- Evaluate AI-generated implementation critically.
- Identify and correct issues.
- Verify the final result.
- Explain architectural and technical decisions.

## 2. Project Overview

**Project:** Creator Interaction Hub

**Description:**

A lightweight audience interaction tool designed to operate alongside an existing livestream.

Audience members can submit questions through a public event page. Creators can review, approve, reject, and mark questions as answered.

The project focuses on organising audience questions that might otherwise be buried in fast-moving livestream chat.

**Core workflow:**

1. Creator creates an event.
2. Creator activates the event and shares its public link.
3. Audience submits questions without creating an account.
4. Questions are stored as pending.
5. Creator reviews and moderates submissions.
6. Approved questions become visible to the audience.
7. Creator can mark questions as answered.
8. Creator can register and manage polls; the audience can vote and see results.

Milestone 5 added creator signup, polls and voting, rate limits, and audience
real-time updates. Milestone 6 prepared the final reviewer guides. See
[quick start](./submission-quickstart.md), [AI workflow](./ai-workflow.md), and
[architecture overview](./architecture-overview.md).

## 3. Technology Stack

| Component                      | Technology                     |
| ------------------------------ | ------------------------------ |
| Frontend                       | React + TypeScript             |
| Backend                        | Node.js + Express + TypeScript |
| Database                       | PostgreSQL                     |
| API                            | REST                           |
| Testing                        | Vitest + Supertest             |
| Containerisation               | Docker + Docker Compose        |
| Primary AI implementation tool | GitHub Copilot Agent           |
| Independent AI review tool     | Cline                          |

The project targets a Linux-compatible Docker environment.

## 4. AI-Assisted Development Workflow

The development process separates implementation, independent review, and final acceptance.

### 4.1 Product definition and planning

**Human responsibility:**

- Choose the project idea.
- Define the problem and intended users.
- Decide the MVP scope.
- Establish functional and non-functional requirements.
- Make architectural and technology decisions.

**AI assistance:**

- Help structure the requirements.
- Explore possible solutions.
- Identify missing requirements and edge cases.
- Draft architecture, database, and API specifications.
- Review whether the scope is achievable within the available time.

**Output:**

- `requirements.md`
- `milestones.md`
- `architecture.md`
- `database-design.md`
- `api-design.md`
- `design-decisions.md`

### 4.2 AI implementation with GitHub Copilot Agent

Copilot Agent is the primary implementation tool.

The development process follows bounded tasks rather than asking the agent to build the entire application in one request.

For each task:

1. Provide the relevant project documentation.
2. Explain the intended objective and acceptance criteria.
3. Ask the agent to inspect the existing implementation.
4. Request an implementation plan before substantial changes.
5. Let the agent implement the agreed task.
6. Ask it to report changed files, design decisions, and test results.
7. Inspect the resulting implementation.

The developer remains responsible for product decisions and acceptance.

### 4.3 Independent review with Cline

Cline acts as a separate code reviewer.

After each meaningful Copilot implementation task:

1. Cline compares the current project against its previous review baseline.
2. It inspects modified, added, and deleted files.
3. It checks requirements compliance and architecture consistency.
4. It reviews security, permissions, data integrity, and code quality.
5. It executes relevant tests where possible.
6. It saves a review report in `reports/reviews/`.

Cline should report issues rather than automatically rewriting the implementation.

If significant issues are found, the findings are sent back to Copilot for correction. Cline then reviews the corrections.

A separate review baseline allows this workflow to operate without requiring a Git commit after every editing task.

### 4.4 Testing and verification

AI-generated code is not considered correct simply because the agent reports success.

Verification includes:

- Unit tests for important business rules.
- API integration tests.
- Authentication and authorisation checks.
- Database persistence checks.
- Manual end-to-end testing.
- Docker Compose startup verification.
- Independent code review.

Test results and useful review evidence are retained.

### 4.5 Final human review

Before submission, the developer verifies:

- The application actually works.
- The documented commands are correct.
- The core user workflow is complete.
- Security-sensitive implementation has been inspected.
- Known limitations are accurately documented.
- The project can be explained without relying on AI-generated descriptions alone.

## 5. Development Milestones

| Milestone                      | Objective                                                   | Result |
| ------------------------------ | ----------------------------------------------------------- | ------ |
| 1. Foundation                  | Set up frontend, backend, database, and Docker              | Complete |
| 2. Backend Core                | Implement authentication, events, questions, and moderation | Complete |
| 3. Frontend Integration        | Build creator and audience interfaces                       | Complete |
| 4. Verification                | Verify the MVP and moderator real-time updates               | Complete |
| 5. Interaction Features        | Signup, audience updates, polls, voter keys, rate limits     | Complete |
| 6. Final Review and Submission | Assess review findings and prepare reviewer guides           | Complete |

The core Q&A workflow takes priority over optional functionality.

## 6. Repository Structure

The implementation keeps the frontend and backend separate, stores supporting
design documents under `docs/`, and keeps review and test evidence under
`reports/`.

```text
creator-interaction-hub/
├── frontend/
├── backend/
├── docs/
├── reports/
│   ├── reviews/
│   └── testing/
├── docker-compose.yml
├── README.md
└── .gitignore
```

The review baseline should be stored outside the repository.

The final repository should not contain secrets, credentials, dependencies, build artefacts, or unnecessary temporary files.

## 7. Required Submission Materials

### A. Working project

- [x] Accessible public GitHub repository:
  <https://github.com/AngusTso/Creator-Interaction-Hub>.
- [x] Clear project introduction.
- [x] Working core Q&A workflow.
- [x] Correct environment configuration.
- [x] Docker Compose startup instructions.
- [x] Database setup and seed instructions.
- [x] Demo account instructions, if applicable.
- [x] No missing dependencies or undocumented setup steps.

### B. AI-assisted workflow

- [x] Identify GitHub Copilot Agent as the primary implementation tool.
- [x] Identify Cline as the independent reviewer.
- [x] Explain how tasks and specifications were given to the agents.
- [x] Explain the review and correction process.
- [x] Record approximate time spent and the earlier effort estimate.
- [x] Explain how AI-generated code was tested and verified.
- [x] Include examples of findings evaluated and addressed.

### C. Design and architecture

- [x] High-level architecture diagram.
- [x] Database relationship diagram.
- [x] Explanation of the main technology choices.
- [x] Important design trade-offs.
- [x] Known limitations.

### D. Demonstration

- [x] Demonstrate creator login.
- [x] Demonstrate event creation and activation.
- [x] Demonstrate public question submission.
- [x] Demonstrate moderation.
- [x] Demonstrate approved questions appearing publicly.
- [x] Demonstrate persistent data after restarting the application.

A short screen recording or screenshots can supplement the repository, but should not replace a runnable project.

## 8. AI Development Log

The estimated no-AI effort was 62–112 developer-hours: 32–52 hours for
Milestones 1–3 and 30–60 for the remaining implementation. The recorded
Copilot session spans about 4 hours 35 minutes; the developer estimates
another 1.5 hours for ChatGPT web planning, or about 6 hours 5 minutes total.
This suggests roughly 56–106 hours below the earlier estimate, but it is a
planning comparison rather than stopwatch-measured savings. See
`ai-workflow.md` for the calculation and caveats.

## 9. How AI Output Was Evaluated

The evaluation process should explain more than which AI tools were used.

Examples of evidence from development:

- The audience refresh gap found during review was confirmed and fixed with
  Socket.IO notifications and REST refreshes.
- A misplaced signup integration test was found during the database-backed
  run, corrected, and rerun successfully.
- Review claims were checked against code and requirements rather than
  applied automatically; for example, the Vite dependency was already
  declared, and exposing pending questions was correctly declined.

This process demonstrates critical evaluation rather than assuming every
AI-generated suggestion is correct.

## 10. Final Submission Narrative

The final submission communicates the following:

The developer identified a practical livestream-audience problem and defined
a small, focused product: a companion tool for Q&A, moderation, and polls.

ChatGPT web helped plan requirements and design documents before coding.
GitHub Copilot Agent implemented bounded milestones; Cline reviewed them
independently. The developer owned product decisions, smoke tests, and final
decisions on review findings.

Automated tests, typechecks, builds, Docker runtime checks, and human review
were used to evaluate the result. The application and concise reviewer
documents are available in the
[public GitHub repository](https://github.com/AngusTso/Creator-Interaction-Hub).

## 11. Final Submission Principle

The strongest submission is not necessarily the project with the most features.

It is a small, working, understandable application accompanied by credible evidence that AI was directed effectively, its output was evaluated critically, and the final result was verified.
