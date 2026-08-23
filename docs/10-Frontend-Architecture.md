# Frontend Architecture

## 1. Technology

Checkpoint uses:

- React;
- Vite;
- TypeScript;
- Tailwind CSS;
- React Router;
- TanStack Query;
- Axios;
- React Hook Form;
- Zod;
- Lucide React.

---

## 2. Why TypeScript?

The frontend has many structured objects:

- users;
- sessions;
- questions;
- answers;
- progress;
- XP results;
- datasets.

TypeScript makes these contracts explicit and catches many errors during development.

---

## 3. Folder structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── practice/
│   ├── progress/
│   ├── profile/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── common/
│
├── services/
│   ├── api.ts
│   ├── auth.api.ts
│   ├── practice.api.ts
│   ├── progress.api.ts
│   └── admin.api.ts
│
├── hooks/
├── types/
├── utils/
└── styles/
```

---

## 4. Routes

### Public

```text
/login
/register
```

### Student

```text
/dashboard
/practice
/practice/daily
/practice/fast
/practice/session/:id
/progress
/profile
```

### Admin

```text
/admin
/admin/datasets
/admin/questions
```

---

## 5. Authentication state

A small `AuthProvider` keeps:

- authenticated user;
- token;
- authentication status;
- loading state;
- login;
- registration;
- logout.

The token is stored in `sessionStorage` for V1.

---

## 6. Server state

TanStack Query handles data that belongs to the server.

Examples:

```text
Dashboard
Profile
Progress
Topics
Session history
```

This gives us caching, loading state, error state and refetch behavior without building a custom global store.

---

## 7. Why no Redux?

V1 does not have enough global state to justify Redux.

Using Redux would create additional:

- actions;
- reducers;
- selectors;
- boilerplate.

TanStack Query + Context + local state is sufficient.

---

## 8. Practice screen

The main practice screen shows one question.

Example:

```text
Today's Checkpoint

Question 4 / 10
████████░░░░

Which keyword is used to inherit a class?

○ implements
○ extends
○ super
○ inherits

[ Submit ]
```

After submission:

```text
Correct!

Explanation:
...

[ Continue ]
```

This creates a focused learning flow.

---

## 9. Session result

At the end:

```text
SESSION COMPLETE

8 / 10
80% Accuracy

+46 XP

Level 5

🔥 15 day streak

[ View Progress ]
[ Practice More ]
```

The exact values come from the backend.

---

## 10. Dashboard

The dashboard should answer:

> What is my current state and what should I do next?

Suggested layout:

```text
Level / XP
     ↓
Daily Session CTA
     ↓
Streak
     ↓
Quick statistics
     ↓
Topic progress
     ↓
Weekly activity
     ↓
Recent sessions
```

---

## 11. Fast Practice

The user can choose:

```text
Question count
Topic
Difficulty
Question type
```

Then start practice.

Fast Practice should look like a distinct optional mode, not a second Daily Session.

---

## 12. Admin UI

The admin interface needs:

- dataset upload;
- validation results;
- import confirmation;
- dataset history;
- question filtering;
- retire/restore controls.

The UI should clearly show validation errors before import.

---

## 13. Loading/error/empty states

Every server-driven page should handle:

### Loading

```text
Loading dashboard...
```

### Error

```text
Unable to load dashboard.

[ Try Again ]
```

### Empty

```text
No sessions yet.
Complete your first Daily Session.
```

### Success

Normal content.

This avoids blank or confusing screens.

---

## 14. Responsive behavior

The application should work on:

- desktop;
- laptop;
- tablet;
- mobile.

Practice is particularly important on smaller screens because a student should be able to complete a session comfortably without needing a desktop.
