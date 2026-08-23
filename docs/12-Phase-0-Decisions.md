# Phase 0 — Final Decision Register

This document records the fifteen major decisions made during Phase 0.

These decisions are considered locked for V1 unless we deliberately reopen a decision.

---

# D1 — Product Scope and Identity

Checkpoint is a personal adaptive learning platform.

The first version focuses on:

- question practice;
- review;
- XP;
- levels;
- streaks;
- progress;
- administrator-managed content.

There is no community layer.

**LOCKED**

---

# D2 — Users and Roles

There are two roles:

```text
STUDENT
ADMIN
```

There is exactly one administrator.

All new public signups automatically become students.

Students are independent from one another.

There are no friendships, followers, messaging, public profiles, groups or community features.

**LOCKED**

---

# D3 — Question Types

V1 supports:

1. Multiple Choice Questions;
2. True/False;
3. Fill in the Blank.

MCQs have exactly four options and exactly one correct answer.

**LOCKED**

---

# D4 — XP as Main Progression

XP is the main profile progression mechanism.

XP is awarded/removed based on a completed session.

It is not awarded for every individual question.

A single wrong answer does not automatically decrease a student's level.

The student's level changes only when total XP crosses a threshold.

**LOCKED**

---

# D5 — Daily Session and Fast Practice

Daily Session:
- 10 primary questions;
- full XP;
- streak eligible;
- primary progression activity.

Fast Practice:
- optional;
- configurable question count;
- optional filters;
- 25% XP;
- 500 positive XP/day cap;
- no streak.

**LOCKED**

---

# D6 — Progress and Dashboard

The dashboard remains simple but informative.

It includes:

- XP;
- level;
- next-level progress;
- streak;
- accuracy;
- question count;
- review count;
- topic performance;
- weekly activity;
- recent sessions.

**LOCKED**

---

# D7 — Database

The V1 database contains eight core tables:

```text
users
student_stats
topics
question_datasets
questions
user_question_progress
practice_sessions
question_attempts
```

Questions use soft deletion.

Level is derived from XP rather than stored independently.

**LOCKED**

---

# D8 — Backend Architecture

The backend is:

```text
Java 17
Spring Boot
Modular Monolith
PostgreSQL
JPA/Hibernate
Flyway
Spring Security
JWT
```

The Session, Review and XP engines are separate logical responsibilities.

**LOCKED**

---

# D9 — Authentication and Security

- Public student registration.
- One configured admin.
- BCrypt passwords.
- JWT authentication.
- 24-hour access token.
- No refresh tokens in V1.
- Frontend token in sessionStorage.
- Server-side role and ownership checks.
- Client never controls role, XP, level or correctness.

**LOCKED**

---

# D10 — Dataset Ingestion

Datasets are JSON.

Every question has an external ID.

The entire file is validated before import.

Import is transactional.

Existing IDs are updated.

New IDs are inserted.

Missing topics can be created.

Maximum upload size is 5 MB.

No partial imports.

**LOCKED**

---

# D11 — API

REST API is organized around capabilities:

```text
/auth
/profile
/practice
/progress
/topics
/admin
```

The backend uses DTOs.

The API never exposes correct answers before an attempt.

**LOCKED**

---

# D12 — Frontend

Frontend:

```text
React
Vite
TypeScript
Tailwind CSS
React Router
TanStack Query
Axios
React Hook Form
Zod
Lucide
```

Feature-oriented structure.

No Redux in V1.

**LOCKED**

---

# D13 — Review Algorithm

The review system is Leitner-inspired.

States:

```text
NEW
DUE
NEEDS_REVIEW
STABLE
```

Stages:

```text
1 day
3 days
7 days
14 days
30 days
```

Correct → advance one stage.

Wrong → drop one stage.

Minimum stage = 1.

Maximum stage = 5.

One same-session requeue is allowed.

Fast Practice cannot rapidly farm review-stage increases.

**LOCKED**

---

# D14 — XP Engine

XP uses difficulty-normalized session performance.

Difficulty weights:

```text
Easy    0.80
Medium  1.00
Hard    1.25
Expert  1.50
```

Performance bands:

```text
90–100%  → 1.00
75–89%   → 0.70
60–74%   → 0.35
40–59%   → -0.25
0–39%    → -1.00
```

Level-specific XP ranges become stricter at higher levels.

There are 20 levels in V1.

Fast Practice gives 25% of normal XP and has a 500 positive XP/day cap.

Streak milestones give bonus XP.

**LOCKED**

---

# D15 — Question Content

Questions have:

- UUID;
- dataset;
- external ID;
- topic;
- optional subtopic;
- type;
- difficulty;
- question text;
- answer data;
- explanation;
- active state.

MCQs use exactly four options.

Correct answers are never exposed before submission.

Options are randomized.

Initial content target is approximately 100–150 curated questions.

**LOCKED**

---

# Phase 0 conclusion

D1–D15 together form the V1 design contract.

The next work should be implementation planning, not more feature invention.

If an implementation problem appears, we should identify whether it is:

1. a coding error;
2. an undocumented edge case;
3. a genuine design problem.

Only the third category should cause a locked decision to be reopened.
