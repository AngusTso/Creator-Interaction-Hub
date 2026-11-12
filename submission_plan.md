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

Polls and real-time notifications are optional extensions, not requirements for a successful MVP.

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

| Milestone                      | Objective                                                   | Expected result                     |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------- |
| 1. Foundation                  | Set up frontend, backend, database, and Docker              | Application environment runs        |
| 2. Backend Core                | Implement authentication, events, questions, and moderation | Core API and business rules work    |
| 3. Frontend Integration        | Build creator and audience interfaces                       | Complete Q&A workflow               |
| 4. Verification and Submission | Test, review, fix, document, and prepare repository         | Runnable and explainable submission |

The core Q&A workflow takes priority over optional functionality.

## 6. Repository Structure

Suggested final repository:

```text
creator-interaction-hub/
├── frontend/
├── backend/
├── reports/
│   ├── reviews/
│   └── testing/
├── docs/
│   ├── architecture.md
│   ├── database-design.md
│   └── design-decisions.md
├── docker-compose.yml
├── AGENTS.md
├── README.md
├── requirements.md
├── milestones.md
├── api-design.md
├── testing-strategy.md
├── CLINE_REVIEW.md
└── .gitignore
```

The review baseline should be stored outside the repository.

The final repository should not contain secrets, credentials, dependencies, build artefacts, or unnecessary temporary files.

## 7. Required Submission Materials

### A. Working project

- [ ] Accessible GitHub or other Git repository.
- [ ] Clear project introduction.
- [ ] Working core Q&A workflow.
- [ ] Correct environment configuration.
- [ ] Docker Compose startup instructions.
- [ ] Database setup and seed instructions.
- [ ] Demo account instructions, if applicable.
- [ ] No missing dependencies or undocumented setup steps.

### B. AI-assisted workflow

- [ ] Identify GitHub Copilot Agent as the primary implementation tool.
- [ ] Identify Cline as the independent reviewer.
- [ ] Explain how tasks and specifications were given to the agents.
- [ ] Explain the review and correction process.
- [ ] Record approximate time spent.
- [ ] Explain how AI-generated code was tested and verified.
- [ ] Include examples of meaningful issues found and resolved, if any.

### C. Design and architecture

- [ ] High-level architecture diagram.
- [ ] Database relationship diagram.
- [ ] Explanation of the main technology choices.
- [ ] Important design trade-offs.
- [ ] Known limitations.

### D. Demonstration

- [ ] Demonstrate creator login.
- [ ] Demonstrate event creation and activation.
- [ ] Demonstrate public question submission.
- [ ] Demonstrate moderation.
- [ ] Demonstrate approved questions appearing publicly.
- [ ] Demonstrate persistent data after restarting the application.

A short screen recording or screenshots can supplement the repository, but should not replace a runnable project.

## 8. AI Development Log

Record actual development activity rather than estimating results retrospectively.

| Activity                             | Tool                  |   Approx. time | Result / evidence           |
| ------------------------------------ | --------------------- | -------------: | --------------------------- |
| Product definition and requirements  | ChatGPT               | To be recorded | Requirements and scope      |
| Architecture and database planning   | ChatGPT               | To be recorded | Design documents            |
| Project foundation                   | Copilot Agent         | To be recorded | Running environment         |
| Backend implementation               | Copilot Agent         | To be recorded | Working API                 |
| Backend review                       | Cline                 | To be recorded | Review reports              |
| Frontend implementation              | Copilot Agent         | To be recorded | Working interfaces          |
| Frontend review                      | Cline                 | To be recorded | Review reports              |
| Testing and corrections              | Copilot Agent + Cline | To be recorded | Test and review evidence    |
| Final verification and documentation | Human + AI tools      | To be recorded | Submission-ready repository |

**Total development time:** To be recorded after completion.

The final account should distinguish actual active development time from elapsed calendar time.

## 9. How AI Output Was Evaluated

The evaluation process should explain more than which AI tools were used.

Examples of evidence worth recording during development:

- An implementation that initially failed a business-rule test.
- A permission or data-exposure issue identified during review.
- A database or API design that required revision.
- A test that revealed an unexpected edge case.
- An AI-generated abstraction or dependency that was rejected as unnecessary.
- A feature that was deliberately excluded to protect the MVP scope.

Only include examples that actually occurred.

The purpose is to demonstrate critical evaluation rather than claim that every AI-generated suggestion was correct.

## 10. Final Submission Narrative

The final submission should communicate the following story:

I identified a practical problem related to audience interaction during livestreams and designed a lightweight application to address it.

I used AI tools throughout the development process, beginning with product requirements and architecture before moving into implementation.

GitHub Copilot Agent was used as the primary implementation assistant. Cline was used independently to review changes, inspect potential issues, and evaluate the implementation against the documented requirements.

Rather than accepting AI-generated code without verification, I used automated tests, manual end-to-end checks, and independent code reviews to evaluate the result and guide corrections.

The final project demonstrates how I used AI to move from a problem definition to a working, testable application while retaining responsibility for technical decisions and final quality.

This narrative must be updated to reflect the actual development process and results.

## 11. Final Submission Principle

The strongest submission is not necessarily the project with the most features.

It is a small, working, understandable application accompanied by credible evidence that AI was directed effectively, its output was evaluated critically, and the final result was verified.
