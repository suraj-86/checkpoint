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

# Phase 2 — Authentication

Implement:

- User entity.
- Registration.
- BCrypt.
- Login.
- JWT.
- Spring Security.
- Role authorization.
- Admin configuration.
- Ownership checks.

Then connect frontend authentication.

---

# Phase 3 — Question Bank

Implement:

- Topic model.
- Dataset model.
- Question model.
- JSON validation.
- Transactional import.
- External ID updates.
- Admin question browser.
- Soft retirement/restoration.
- Initial seed dataset.

---

# Phase 4 — Review Engine

Implement the learning state first, before the complete UI.

Implement:

- user-question progress;
- review states;
- review stages;
- next-review calculation;
- due/overdue selection;
- new-question selection;
- same-session requeue.

Write unit tests for transitions.

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
