# Checkpoint

## What is Checkpoint?

Checkpoint is a personal learning and practice platform designed to help a student learn technical subjects through short, structured practice sessions.

The system is deliberately different from a social learning platform. Students do not compete with one another, create communities, follow each other, message each other, or maintain public profiles. Each student's learning environment is private and independent.

The product combines four major ideas:

1. **Practice** — answer useful questions regularly.
2. **Review** — questions that are difficult return later through spaced review.
3. **Progression** — session performance changes the student's XP and level.
4. **Consistency** — completing the Daily Session builds a separate streak.

The result should feel similar in spirit to a modern learning product while remaining small enough to build, understand and demonstrate as a Java mini project.

---

## Project status

- ✅ **Phase 0** — Planning and architecture complete (D1–D15 finalized).
- ✅ **Phase 1** — Project foundation complete: backend (Spring Boot + PostgreSQL + Flyway, all 8 tables migrated) and frontend (Vite + React + Tailwind) both run locally.
- ✅ **Phase 2** — Authentication complete: JWT-based register/login, BCrypt password hashing, role-based access (STUDENT/ADMIN), protected frontend routes, automatic admin bootstrap.
- ✅ **Phase 3** — Question Bank complete: topic/dataset/question models, validated transactional dataset import (all-or-nothing, upsert by externalId), admin question browser with filters/pagination, soft retire/restore.
- ✅ **Phase 4** — Review Engine complete: spaced-review state machine (5 stages, NEEDS_REVIEW/STABLE), prioritized question selection, same-session requeue mechanism, backed by 22 unit tests.
- ✅ **Phase 5** — Practice Engine complete: Daily Session and Fast Practice, question delivery with no answer leakage, answer grading, same-session requeue, session completion. The app is playable end-to-end through the API.
- ✅ **Phase 6** — XP and Streak complete: difficulty-weighted performance scoring, 20-level progression, Fast Practice's daily XP cap, streak tracking with milestone bonuses. 100 unit tests across the project, two real bugs caught and fixed during development.
- ⏳ **Phase 7** — Student Experience — up next.

---

## Why Phase 0 existed

Phase 0 is the planning and architecture stage. No major product feature should be implemented before the important decisions are recorded.

During Phase 0 we made fifteen decisions, D1 through D15. These decisions cover:

- product scope;
- users and roles;
- question types;
- practice modes;
- progress;
- database;
- backend architecture;
- authentication;
- dataset management;
- API;
- frontend;
- review algorithm;
- XP and levels;
- question content.

The detailed decisions are consolidated in:

`12-Phase-0-Decisions.md`

That document is the highest-level Phase 0 source of truth.

---

## V1 philosophy

Checkpoint V1 should be:

- simple enough to understand;
- useful enough to demonstrate real learning behavior;
- technically impressive without unnecessary complexity;
- secure enough for a proper academic project;
- designed so that V2 can extend it without rewriting the foundation.

We intentionally do not try to build every feature found in Duolingo, Chess.com or a social platform.

---

## User model

There are only two roles:

### Student

A student can:

- register;
- log in;
- complete Daily Sessions;
- perform Fast Practice;
- receive explanations;
- earn or lose XP;
- build a streak;
- review progress;
- revisit difficult questions.

Every new public account is automatically a student.

### Administrator

There is exactly one administrator in V1.

The administrator is configured by the developer/server and is not created through public registration.

The administrator manages the question bank and datasets.

---

## The central learning loop

A typical student journey looks like this:

```text
Login
  ↓
Dashboard
  ↓
Daily Session
  ↓
Answer questions
  ↓
Immediate feedback
  ↓
Weak questions may be requeued
  ↓
Session completed
  ↓
Review state updated
  ↓
Session XP calculated
  ↓
Streak updated
  ↓
Result shown
  ↓
Progress dashboard
```

The student can then use Fast Practice if they want additional practice.

---

## Technology

### Backend

- Java 17
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA / Hibernate
- Flyway
- Maven

### Database

- PostgreSQL

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Lucide React

---

## Architecture

V1 is a **modular monolith**.

This means the backend is one deployable Spring Boot application, but its internal responsibilities are separated into modules such as authentication, practice, review, XP, questions and administration.

We are not using microservices because they would add operational complexity without providing meaningful value for this project.

---