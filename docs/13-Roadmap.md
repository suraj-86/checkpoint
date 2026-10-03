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

# Phase 5 — Practice Engine ✅ Complete

Implement:

- [x] Daily Session creation. *(fixed 10 questions, prioritized by the Phase 4 review engine)*
- [x] Fast Practice creation. *(student-chosen count/topic/difficulty/type, random sample)*
- [x] session state. *(new `session_questions` table — V2 migration, added this phase since V1 had no place for an ordered queue)*
- [x] question delivery. *(never leaks the answer before submission; MCQ options shuffled per delivery)*
- [x] answer submission. *(also wired into the Phase 4 review engine and same-session requeue)*
- [x] attempt history. *(every attempt recorded, primary and retries alike)*
- [x] session completion. *(accuracy calculated; XP deliberately left null — that's Phase 6)*

At this stage the system should be playable through the API. — confirmed: full Daily Session played start to finish via the real API (login → start → answer → requeue → resume after a server restart → complete).

**One real bug found and fixed during testing:** Hibernate's generic JSON mapping wrote a bare submitted answer (e.g. the string `super`) to Postgres unserialized, which the `jsonb` column rejected. Fixed by wrapping the submitted answer in `{"value": ...}` before storing — the same technique already used successfully for `answerData`.

Confirmed working locally on 2026-09-30.

---

# Phase 6 — XP and Streak ✅ Complete

Implement:

- [x] difficulty normalization. *(Easy 0.80 / Medium 1.00 / Hard 1.25 / Expert 1.50)*
- [x] performance bands. *(Excellent/Good/Fair/Weak/Poor, exact boundary thresholds)*
- [x] level-specific XP. *(per-level max gain/loss, Levels 1-20)*
- [x] XP thresholds. *(Levels 0-20)*
- [x] promotion/demotion. *(level is always derived from total XP, never stored separately)*
- [x] Fast Practice cap. *(500 positive XP/day; negative XP never capped)*
- [x] streak tracking. *(Daily Session only; Fast Practice never touches it)*
- [x] milestone bonuses. *(3/7/14/30/60/100 days; only the newly-reached milestone pays, including on a same-day repeat completion — see bug note below)*

Write extensive tests around edge cases. — done: 27 new unit tests (100 total across the project).

**Two real bugs found and fixed during this phase, both via testing, not after:**
1. A level-lookup bug: the XP-to-level table was built keyed the wrong direction, so `levelForXp()` returned 20 for almost any XP amount above 20. Every threshold-boundary test failed identically, which pointed straight at the bug. Fixed before merge.
2. A milestone double-award bug: completing a second Daily Session on the same calendar day, while the streak sat exactly on a milestone value, would have re-paid that milestone's bonus. Caught while writing the "same-day repeat" test, fixed in `StreakCalculator` before merge.

**Design decisions worth knowing:** a Level 0 (brand-new) student uses Level 1's gain/loss range, since the docs' table starts at Level 1. Total XP is floored at 0 (matches a real DB constraint from Phase 1). The student's level for XP-calculation purposes is their level *before* the session, not after.

**Verified working end-to-end** via a real Daily Session played through the live API: 30% accuracy correctly produced -10 XP (Level 0/1's max loss), total XP floored at 0, streak started at 1 with no bonus (1 isn't a milestone). Confirmed on 2026-10-02.

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
