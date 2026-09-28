# Checkpoint Implementation Roadmap

## Phase 0 — Planning and Architecture ✅ Complete

Completed when:

- [x] D1–D15 are reviewed;
- [x] architecture is understood;
- [x] database model is agreed;
- [x] API is defined;
- [x] core algorithms are defined;
- [x] documentation is updated.

No production feature code is required in Phase 0.

---

# Phase 1 — Project Foundation ✅ Complete

## Goals

Create the working repository and development environment.

### Backend
- [x] Initialize Maven Spring Boot project.
- [x] Configure Java 17.
- [x] Add Spring Web.
- [x] Add Spring Security.
- [x] Add JPA.
- [x] Add PostgreSQL driver.
- [x] Add Flyway.
- [x] Add validation.
- [ ] Add JWT dependencies. *(deliberately deferred to Phase 2 — kept Phase 1 focused on "does the project build and run")*
- [x] Create base package/module structure. *(auth, user, question, topic, practice, progress, review, xp, streak, admin, common)*

### Frontend
- [x] Initialize Vite React TypeScript project.
- [x] Configure Tailwind.
- [x] Configure React Router.
- [x] Configure TanStack Query.
- [x] Configure Axios.
- [x] Create base layout. *(placeholder page; real layout arrives in Phase 7)*

### Database
- [x] Create development PostgreSQL database.
- [x] Configure environment variables.
- [x] Create initial Flyway migration. *(full initial schema — all 8 tables — applied and verified)*

**Verified working:** backend boots on port 8080, Flyway migration applies cleanly, frontend runs on port 5173, both confirmed running locally on 2026-09-25.

---

# Phase 2 — Authentication ✅ Complete

Implement:

- [x] User entity.
- [x] Registration.
- [x] BCrypt.
- [x] Login.
- [x] JWT.
- [x] Spring Security.
- [x] Role authorization.
- [x] Admin configuration.
- [ ] Ownership checks. *(no student-data endpoints exist yet to check ownership of — this becomes relevant starting Phase 5/6 when /progress and /practice expose per-student data. Tracking it there instead of falsely checking it off here.)*

Then connect frontend authentication. — done.

**Verified working:** registration assigns STUDENT regardless of client input, login issues a valid JWT, protected routes correctly redirect unauthenticated users, admin account boots automatically, logout clears the session. Confirmed working locally on 2026-09-26.

---

# Phase 3 — Question Bank ✅ Complete

Implement:

- [x] Topic model.
- [x] Dataset model.
- [x] Question model.
- [x] JSON validation.
- [x] Transactional import.
- [x] External ID updates.
- [x] Admin question browser.
- [x] Soft retirement/restoration.
- [x] Initial seed dataset. *(21 curated questions across OOP, Collections, Exceptions, Strings — a starter set proving the pipeline, not yet the full 100-150 target from section 11. More datasets can be added the same way.)*

**Verified working:** validate/import/re-import (upsert by externalId, confirmed zero duplicates on re-import), topic auto-creation, admin browser filters + pagination, retire/restore. One real bug found and fixed during testing: a `LazyInitializationException` on the `Question.topic` association, resolved with `@Transactional(readOnly = true)` on the search method. Confirmed working locally on 2026-09-27.

---

# Phase 4 — Review Engine ✅ Complete

Implement the learning state first, before the complete UI.

Implement:

- [x] user-question progress;
- [x] review states;
- [x] review stages;
- [x] next-review calculation;
- [x] due/overdue selection;
- [x] new-question selection;
- [x] same-session requeue. *(mechanism built and unit tested; wired into real sessions in Phase 5)*

Write unit tests for transitions. — done (22 tests, all passing).

**Design decisions worth knowing:**
- `NEW` is never stored. A question with no progress row *is* new, and a row is only created on the first answer.
- `DUE` is computed at selection time (a STABLE question whose date has arrived) rather than written back to the row.
- The "at most one stage advance per calendar day" rule is described under Fast Practice in the spec, but is applied to all session types for consistency.
- The exact "balanced, not all-review" selection rule isn't fully specified in the docs, so it is defined concretely in `QuestionSelectionService`: with a light backlog, about 30% of the session is reserved for new questions; when the backlog fills the whole session, it is all review.

**Verified working:** 22 unit tests pass, and the app boots against the real database schema. One bug was found and fixed while booting: `ReviewTransitionCalculator` was missing `@Component`, so Spring could not inject it into `ReviewProgressService`. Confirmed on 2026-09-28.

---

# Phase 5 — Practice Engine

Implement:

- Daily Session creation;
- Fast Practice creation;
- session state;
- question delivery;
- answer submission;
- attempt history;
- session completion.

At this stage the system should be playable through the API.

---

# Phase 6 — XP and Streak

Implement:

- difficulty normalization;
- performance bands;
- level-specific XP;
- XP thresholds;
- promotion/demotion;
- Fast Practice cap;
- streak tracking;
- milestone bonuses.

Write extensive tests around edge cases.

---

# Phase 7 — Student Experience

Build:

- dashboard;
- Daily Session UI;
- Fast Practice UI;
- session result;
- profile;
- progress;
- topic statistics;
- activity chart;
- session history.

---

# Phase 8 — Admin Experience

Build:

- admin dashboard;
- dataset upload;
- validation result;
- import result;
- dataset history;
- question browser;
- filters;
- retire/restore actions.

---

# Phase 9 — Integration and Hardening

Test complete flows:

```text
Register
→ Login
→ Daily Session
→ Answer
→ Complete
→ XP
→ Level
→ Streak
→ Progress
→ Return next day
→ Review
```

Also test:

- unauthorized requests;
- student/admin separation;
- duplicate datasets;
- invalid questions;
- retired questions;
- XP caps;
- XP boundaries;
- level boundaries;
- review transitions;
- interrupted sessions.

---

# Phase 10 — Deployment and Release

Prepare:

- production database;
- environment secrets;
- backend deployment;
- frontend deployment;
- database migrations;
- seed dataset;
- smoke tests;
- README;
- final project report.

---

# Development workflow

For each meaningful backend feature:

```text
Understand requirement
       ↓
Implement
       ↓
Run Spring Boot
       ↓
Test API
       ↓
Fix
       ↓
Write/update tests
       ↓
Commit
       ↓
Push
```

Frontend follows the same incremental principle.

Do not implement five unrelated features at once.

---

# Recommended first implementation milestone

The first real coding milestone after Phase 0 should be:

```text
Phase 1
Foundation
```

The repository should become buildable and runnable before authentication or learning logic is added.
