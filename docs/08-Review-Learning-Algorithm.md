# Review and Learning Algorithm

## 1. Why the review engine exists

Checkpoint should not show every question with equal frequency.

If a student repeatedly gets a question correct, there is little value in showing it every day.

If a student repeatedly struggles with another question, that question should return sooner.

The Review Engine manages this behavior.

---

## 2. Four review states

### NEW

The student has never answered the question.

### DUE

The question's scheduled review date has arrived.

### NEEDS_REVIEW

The student has recently struggled with the question.

### STABLE

The student has demonstrated sufficient success for the current review stage.

---

## 3. Five stages

The review stage is a number from 1 to 5.

```text
Stage 1 → 1 day
Stage 2 → 3 days
Stage 3 → 7 days
Stage 4 → 14 days
Stage 5 → 30 days
```

These intervals are deliberately simple.

The project does not need an advanced scientific spaced-repetition implementation for V1.

---

## 4. First encounter

Suppose a student sees a new question.

```text
NEW
```

If they answer correctly:

```text
Stage 1
Stable
Review tomorrow
```

If they answer incorrectly:

```text
Stage 1
Needs Review
Review soon
```

The exact first-review scheduling is handled by the Review Engine.

---

## 5. Repeated success

A student who repeatedly answers correctly moves:

```text
Stage 1
   ↓
Stage 2
   ↓
Stage 3
   ↓
Stage 4
   ↓
Stage 5
```

The intervals become longer.

This means the system gradually trusts demonstrated knowledge.

---

## 6. Wrong answer

Suppose a question is:

```text
Stage 4
Stable
Review in 14 days
```

The student answers incorrectly.

The system does not reset the question to zero.

Instead:

```text
Stage 4
   ↓ wrong
Stage 3
Needs Review
Review in approximately 7 days
```

This follows our main principle:

> One mistake should not erase accumulated learning.

---

## 7. Repeated wrong answers

If the student continues to struggle:

```text
Stage 4
 ↓ wrong
Stage 3
 ↓ wrong
Stage 2
 ↓ wrong
Stage 1
```

The question becomes increasingly frequent.

This is useful because the system is adapting to evidence.

---

## 8. Correct answer after failure

If a question is at Stage 3 and the student later answers correctly:

```text
Stage 3
 ↓ correct
Stage 4
```

The question can return to a longer interval.

The consecutive-wrong counter is reset.

---

## 9. Same-session requeue

Long-term review and same-session requeue are separate mechanisms.

If the student gets:

```text
Q5 → wrong
```

the question may appear again during the current session.

It should preferably be separated by at least two other questions.

Example:

```text
Q5 → wrong
Q6
Q7
Q5 → retry
```

The question is requeued at most once in V1.

---

## 10. Why requeue is not XP

If Q5 is:

```text
wrong → correct
```

we should not treat this as two independent primary questions.

The reattempt exists to help the student learn.

The primary attempt contributes to session performance.

This prevents gaming the XP system.

---

## 11. Daily selection

The Daily Session tries to prioritize:

1. questions needing review;
2. overdue questions;
3. due questions;
4. new questions.

But the final list is balanced.

We do not want:

```text
Review
Review
Review
Review
Review
...
```

unless the student genuinely has an extreme backlog.

---

## 12. Difficulty is independent

A Hard question does not automatically have a high review stage.

For example:

```text
Hard question
Stage 1
```

is perfectly valid.

Likewise:

```text
Easy question
Stage 5
```

is also valid.

Difficulty describes the question.

Review stage describes the student's relationship with it.

---

## 13. Fast Practice

Fast Practice is allowed to contribute learning evidence.

However, it cannot be used to rapidly push a question from Stage 1 to Stage 5 in a few minutes.

Therefore:

- repeated same-day correct answers do not repeatedly increase stage;
- a question can advance at most one review stage per calendar day;
- wrong answers can still make the question need review.

This makes Fast Practice useful without making it exploitable.

---

## 14. Future improvement

V2 can replace the fixed schedule with an adaptive algorithm.

Possible direction:

```text
V1
Fixed intervals
  ↓
V2
Adaptive intervals
  ↓
V3
FSRS or similar advanced scheduler
```

The V1 database should not prevent this evolution.
