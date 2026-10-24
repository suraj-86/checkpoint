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

## Current status (V3, "Lavender Garden")

Checkpoint is live: **https://checkpoint-blond-eta.vercel.app**

### What is in the app

- A **mastery map** (stream, subject, topic) and a **Garden** view that show what is strong and what to practise next.
- Three themes: **Morning**, **Dawn** and **Night**, with a mascot.
- **Rewards**: chests, stickers, skins and XP boosts.
- A **Focus** timer with a daily target.
- **History** with a calendar and search, and an **Analytics** heatmap.
- Daily Session and Fast Practice, with a question palette, skip, a timer and an optional "how sure are you?" check.
- An admin console with dataset upload and validation, **Organise** by subtopic, **Merge topics**, and dataset retire, restore and delete.

### Question bank

About **7,100 active questions** across **11 subjects** and **83 topics**, all in one stream (Computer Science):

| Subject | Questions |
|---|---|
| Java | 2,086 |
| Data Structures and Algorithms | 1,153 |
| Python | 927 |
| C | 733 |
| Linux and Bash | 380 |
| JavaScript | 378 |
| C++ | 347 |
| Computer Networks | 336 |
| Git | 330 |
| Operating Systems | 250 |
| SQL | 245 |

The mix is about 5,670 multiple choice, 958 true/false and 537 fill-in-the-blank questions, from easy to expert. Counts change as datasets are added.

### Hosting

Frontend on Vercel, backend on Render and database on Neon, all on free tiers.

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