# Product Requirements — Checkpoint V1

## 1. Product overview

Checkpoint is a learning application for students who want regular technical practice.

The application presents questions in structured sessions. It remembers how the student performs on individual questions and uses that information to decide which questions should appear again.

At the same time, the application maintains a separate profile progression system based on XP.

This distinction is fundamental:

> A student's profile level describes their overall progression, while a question's review state describes how well that particular student currently knows that particular question.

---

## 2. Problem being solved

Traditional question-practice applications often treat every question independently. A student answers a question, sees whether it was correct, and moves on.

That approach creates two problems:

1. Questions the student struggles with may disappear for too long.
2. A student may answer hundreds of questions without building a meaningful sense of long-term progress.

Checkpoint addresses both problems.

The Review Engine remembers difficult questions.

The XP Engine gives the student a long-term progression system.

The Streak system encourages consistency.

---

## 3. User roles

### 3.1 Student

The student is the main user.

A student can:

- create an account;
- authenticate;
- view their dashboard;
- complete the Daily Session;
- start Fast Practice;
- answer questions;
- see explanations;
- earn and lose XP;
- build a streak;
- view statistics;
- inspect session history;
- see topic performance;
- maintain their profile.

Students cannot access another student's information.

There is intentionally no relationship between students.

For example, Student A cannot:

- view Student B's profile;
- follow Student B;
- message Student B;
- compare XP with Student B;
- join a group with Student B.

---

### 3.2 Administrator

The administrator is a content/operator role.

There is only one administrator in V1.

The administrator can:

- validate datasets;
- import datasets;
- inspect questions;
- retire questions;
- restore questions;
- view dataset history.

The administrator does not participate in the student learning system as a normal student.

---

## 4. Registration rules

Registration is public.

The registration form contains:

- username;
- email;
- password.

The client must not contain a role selector.

The backend automatically assigns:

```text
role = STUDENT
```

This prevents a user from submitting:

```json
{
  "role": "ADMIN"
}
```

and attempting to become an administrator.

---

## 5. Daily Session

The Daily Session is the primary learning activity.

A Daily Session contains:

> 10 primary questions.

"Primary" is important because a question can optionally be requeued after an incorrect answer. A requeued question does not become an additional primary question for XP calculation.

The Daily Session should contain a mixture of:

- questions needing review;
- questions that are due;
- new questions.

A typical target might be:

```text
3 review
4 due
3 new
```

The exact composition can change if the question bank does not contain enough questions in one category.

---

## 6. Answering questions

Questions are displayed one at a time.

The student:

1. reads the question;
2. selects/types an answer;
3. submits;
4. immediately sees whether it was correct;
5. sees an explanation;
6. continues.

This is intentionally different from submitting an entire ten-question form at once.

Immediate feedback makes the system useful for learning rather than simply assessment.

---

## 7. Incorrect answers

An incorrect answer does not simply mean "you lose a level."

Instead, the system separates three effects:

### Question effect
The question may enter `NEEDS_REVIEW` and return sooner.

### XP effect
The completed session may produce negative XP depending on overall performance.

### Level effect
The student's level only changes if their total XP crosses a level threshold.

Therefore one wrong answer does not automatically cause level demotion.

---

## 8. Fast Practice

Fast Practice exists for students who want additional practice beyond the Daily Session.

The student may select:

- number of questions;
- topic;
- difficulty;
- question type.

Examples:

```text
10 questions
20 questions
50 questions
```

Fast Practice is not a replacement for Daily Session.

It has:

- reduced XP;
- a positive XP cap of 500 XP per day;
- no streak effect.

The student can therefore practice hundreds of questions without accidentally generating hundreds or thousands of progression XP.

---

## 9. XP

XP is awarded or removed at the session level.

There is no:

```text
correct answer = +75 XP
```

inside the normal answer flow.

Instead:

```text
10-question session
      ↓
calculate overall performance
      ↓
calculate one XP change
      ↓
update total XP
```

This prevents question-volume farming.

---

## 10. Streak

The streak is intentionally separate from XP.

A Daily Session can maintain a streak.

Fast Practice cannot.

This makes the streak represent:

> "I completed my intended daily learning activity."

rather than:

> "I answered a huge number of questions."

---

## 11. Progress

The dashboard should show useful information without becoming a statistics wall.

Important indicators include:

- current level;
- total XP;
- XP needed for next level;
- current streak;
- longest streak;
- accuracy;
- questions attempted;
- questions needing review;
- topic performance;
- recent sessions;
- weekly activity.

---

## 12. Question bank

Questions are imported through datasets.

Each question has:

- topic;
- optional subtopic;
- question type;
- difficulty;
- question text;
- answer information;
- explanation;
- external ID;
- active/retired state.

The administrator can retire a question without physically deleting it.

This preserves historical data.

---

## 13. V1 non-goals

The following are deliberately excluded:

- social profiles;
- followers;
- friends;
- messaging;
- community;
- groups;
- public leaderboards;
- student comparison;
- multiple administrators;
- advanced AI question generation;
- advanced spaced-repetition algorithms;
- full question version history;
- refresh-token architecture.

These may be considered later, but they are not part of V1.
