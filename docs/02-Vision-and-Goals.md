# Vision and Goals

## 1. Vision

Checkpoint should feel like a personal learning checkpoint: a place where a student returns regularly, practices what they know, revisits what they do not know, and sees meaningful long-term progression.

The product should not overwhelm the student with social features or unnecessary gamification.

The core experience is:

```text
Practice → Learn → Review → Progress → Return
```

---

## 2. Product philosophy

### Learning comes before gamification

XP, levels and streaks exist to support learning.

They should never become more important than the quality of the practice.

For example, if Fast Practice has reached its daily XP cap, the student can still continue practicing and learning.

---

### Progress should not be fragile

If a student makes one mistake, the system should not behave as if they forgot everything.

This is why:

- question review drops only one stage;
- XP changes are based on the whole session;
- level changes happen only at XP thresholds.

---

### Question knowledge and profile progression are different

Suppose a student is Level 8 but struggles with SQL joins.

Their profile may say:

```text
Level 8
```

while their SQL join questions may be:

```text
Review Stage 1
Needs Review
```

That is not a contradiction.

It means their overall progress is strong while one area needs attention.

---

## 3. Why there is no community

Community features are intentionally excluded from V1.

They would introduce:

- privacy concerns;
- moderation;
- social relationships;
- additional APIs;
- additional database relationships;
- more complicated authorization;
- distractions from the learning loop.

Checkpoint's first version should prove that the learning engine itself works.

---

## 4. Why there are two practice modes

Daily Session and Fast Practice serve different purposes.

### Daily Session

Represents the student's planned daily learning.

It affects:

- full XP;
- streak;
- adaptive daily review.

### Fast Practice

Represents optional extra work.

It is useful for:

- exam preparation;
- revision;
- curiosity;
- practicing a specific topic;
- doing more questions after finishing the Daily Session.

But it should not dominate progression.

---

## 5. V1 success criteria

We should consider V1 successful if a new student can:

1. register;
2. log in;
3. see a dashboard;
4. complete a Daily Session;
5. receive immediate explanations;
6. see questions reappear when appropriate;
7. receive a session XP result;
8. maintain a streak;
9. view progress;
10. perform Fast Practice;
11. return later and see meaningful changes.

The administrator should be able to:

1. validate a dataset;
2. import it;
3. inspect questions;
4. retire a bad question;
5. restore it.

---

## 6. Technical success

The project should demonstrate:

- REST API design;
- authentication;
- authorization;
- relational database design;
- JSONB where appropriate;
- transaction management;
- algorithmic business logic;
- responsive frontend;
- automated tests;
- clean modular architecture.

The project should be impressive because the pieces work together coherently.

---

## 7. Future direction

The architecture should make V2 possible.

Potential V2 improvements:

- adaptive review intervals;
- FSRS-style scheduling;
- more question types;
- full question versioning;
- refresh tokens;
- richer analytics;
- more sophisticated admin tools;
- optional AI-assisted content generation.

These are intentionally not part of V1.
