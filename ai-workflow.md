# AI-Assisted Workflow

## Roles and tools

| Role | Contribution |
| --- | --- |
| Human developer | Product designer and decision-maker; set scope and visual direction, approved milestones, ran smoke tests, and judged review findings. |
| ChatGPT (web) | Helped shape the project, requirements, architecture and planning documents before implementation; assisted with documentation. |
| GitHub Copilot Agent (VS Code) | Implemented the application milestone by milestone, following the agreed documents and reporting tests and changes. |
| Cline | Independently reviewed implementation, requirements, security boundaries, tests, and Docker setup. |

## Process

1. Define the product and constraints before coding. The project is a
   livestream companion, not a streaming or chat platform. Requirements,
   milestones, API, database, architecture, testing, and visual design were
   written first.
2. Give Copilot bounded milestone tasks with acceptance criteria. Inspect the
   existing code, agree on a short plan, implement, test, and review the
   result before moving to the next milestone.
3. Use Cline as a separate reviewer. The human developer assesses each
   finding: fix it, defer it to a later milestone, or decline it with a
   requirement-based reason. Findings are not accepted or dismissed
   automatically.
4. Verify the result with automated tests, typechecks, builds, Docker runtime
   checks, and human smoke testing.

## Evaluation examples

- A review found the audience view did not refresh after moderation. The
  behavior was confirmed and addressed with audience Socket.IO notifications
  that trigger authoritative REST refreshes.
- The Milestone 5 review questioned whether Vite was declared for the backend.
  The package manifest was checked; Vite was already a direct development
  dependency, so no redundant change was made.
- Pending questions remain private by design. The public page tells submitters
  their question appears after moderation; exposing new pending questions to
  other audience members was not treated as a bug.
- A database-backed test run found the signup test accidentally nested inside
  another test. It was corrected, then the backend suite passed with the
  isolated test database.

## Time, estimated savings, and verification

Earlier milestone estimates were **32–52 developer-hours for Milestones 1–3**
and **30–60 hours for the remaining implementation**, for a rough no-AI
planning baseline of **62–112 hours**. These were estimates, not a measured
control project.

The recorded Copilot conversation spans **4 hours 35 minutes elapsed** from
its first to last recorded turn. The developer estimates about **1.5 hours**
of separate planning with ChatGPT web, giving an AI-assisted total of roughly
**6 hours 5 minutes** (about 6 hours). The session span can include pauses, so
it is not a precise active-work measurement.

Compared with the earlier baseline, that is a nominal **56–106 hours less**
(roughly **90–95% below the estimate**, about 93% at its midpoint). Treat this
as an estimated comparison, not a proven causal saving: the baseline, elapsed
session span, and planning time were not tracked with the same method.

The project finished with 17 backend tests and 19 frontend tests passing,
both apps passing typecheck and production builds, and a fresh Docker Compose
runtime check covering registration, Q&A moderation, polls, duplicate-vote
rejection, rate limiting, audience updates, and persistence after backend
restart.
