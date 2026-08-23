# System Architecture

## 1. Architecture decision

Checkpoint V1 uses a **modular monolith**.

A modular monolith means there is one backend application, but the code is organized into clear business modules.

It is not a large pile of unrelated controllers and services.

It also avoids the complexity of microservices.

---

## 2. Why a modular monolith?

For this project, microservices would introduce problems such as:

- multiple deployments;
- service discovery;
- network failures between services;
- distributed transactions;
- more complicated debugging;
- more infrastructure.

Those problems do not improve the core learning functionality.

A modular monolith gives us clean architecture now and leaves a migration path later.

---

## 3. High-level system

```text
                  CHECKPOINT
                       |
          +------------+------------+
          |                         |
          v                         v
       FRONTEND                  BACKEND
   React + TypeScript         Spring Boot
          |                         |
          | REST/JSON               |
          +-------------------------+
                                    |
                            Spring Security
                                    |
                              Controllers
                                    |
                              Application
                                Services
                                    |
          +-------------------------+----------------------+
          |                         |                      |
          v                         v                      v
    Session Engine            Review Engine          XP Engine
          |                         |                      |
          +-------------------------+----------------------+
                                    |
                              Repositories
                                    |
                                    v
                               PostgreSQL
```

---

## 4. Backend modules

### Auth
Registration, login, JWT and authentication.

### User
Student identity and profile information.

### Question
Question entities and question retrieval.

### Topic
Topics used to organize content.

### Practice
Sessions, answers, session lifecycle and question selection.

### Progress
Student statistics and history.

### Review
Question-level learning state and scheduling.

### XP
XP calculation and level resolution.

### Streak
Daily completion and streak milestones.

### Admin
Dataset operations and question management.

### Common
Cross-cutting concerns such as errors, API responses, configuration and utilities.

---

## 5. Important architectural rule

The frontend must never own business rules that affect security or progression.

For example, the frontend may display:

```text
+46 XP
```

but it must not calculate the authoritative `+46`.

The backend calculates it.

Similarly, the frontend may display:

```text
Level 5
```

but the backend remains authoritative.

---

## 6. Practice lifecycle

A Daily Session follows:

```text
START
  ↓
session created
  ↓
questions selected
  ↓
student answers
  ↓
attempts recorded
  ↓
review state updated
  ↓
session completed
  ↓
performance calculated
  ↓
XP calculated
  ↓
streak calculated
  ↓
result committed
```

---

## 7. Transaction boundary

Session completion should be transactional.

If XP is updated but the session fails to save, we could create inconsistent data.

Therefore the completion operation should behave as one transaction.

Conceptually:

```text
BEGIN
  verify session
  verify attempts
  calculate performance
  update question progress
  calculate XP
  update XP
  update streak
  save session result
COMMIT
```

If an unexpected failure occurs:

```text
ROLLBACK
```

---

## 8. Frontend architecture

The frontend uses feature-based organization.

```text
features/
├── auth/
├── dashboard/
├── practice/
├── progress/
├── profile/
└── admin/
```

This makes it possible to work on one feature without searching through a large collection of unrelated files.

---

## 9. Server state vs local state

Server-owned information uses TanStack Query.

Examples:

- dashboard;
- profile;
- progress;
- topics;
- session history.

Temporary UI information uses local state.

Authentication uses a small React Context.

Redux is deliberately unnecessary for V1.
