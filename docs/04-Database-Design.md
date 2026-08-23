# Database Design

## 1. Database choice

Checkpoint uses PostgreSQL.

PostgreSQL is appropriate because the project contains:

- strong relational relationships;
- transactional operations;
- structured JSON content;
- timestamps and date-based review queries;
- constraints and indexes.

Schema changes are managed through Flyway.

---

## 2. Core data model

```text
USERS
  |
  +---- STUDENT_STATS
  |
  +---- PRACTICE_SESSIONS ---- QUESTION_ATTEMPTS ---- QUESTIONS ---- TOPICS
  |
  +---- USER_QUESTION_PROGRESS -------------------------/
                                      |
                                      +---- QUESTION_DATASETS
```

---

## 3. Users

The `users` table represents authentication identities.

Important fields:

```text
id
username
email
password_hash
role
created_at
updated_at
last_login_at
```

Username and email are unique.

A newly registered user is always:

```text
STUDENT
```

---

## 4. Student statistics

Student statistics are kept separately because they represent aggregate learning information.

Fields include:

```text
user_id
total_xp
current_streak
longest_streak
last_daily_session_date
total_daily_sessions
total_fast_sessions
updated_at
```

The student's level is not stored.

It is derived from total XP.

This avoids contradictory states such as:

```text
XP says Level 5
database says Level 4
```

---

## 5. Topics

Topics organize questions.

Example:

```text
Java
SQL
Data Structures
Python
```

A question can have an optional subtopic such as:

```text
Topic: Java
Subtopic: OOP
```

We do not create a separate subtopic table in V1 because the taxonomy is intentionally simple.

---

## 6. Question datasets

A dataset is a logical upload/version of questions.

Example:

```text
Name: Java Core
Version: 1.2
```

The dataset record allows us to know where questions came from and which import created them.

---

## 7. Questions

A question contains:

```text
id
dataset_id
external_id
topic_id
subtopic
question_type
difficulty
question_text
answer_data
explanation
is_active
created_at
updated_at
```

`answer_data` is JSONB because different question types have different answer structures.

---

## 8. Student-question progress

This table is one of the most important tables.

It answers:

> "How does this particular student currently know this particular question?"

Fields include:

```text
review_state
review_stage
next_review_at
times_seen
times_correct
times_wrong
consecutive_correct
consecutive_wrong
last_answered_at
```

The same question can therefore have different progress for different students.

Example:

```text
Question Q100

Student A → Stage 5, Stable
Student B → Stage 1, Needs Review
```

---

## 9. Practice sessions

A session represents one complete practice activity.

Important fields:

```text
session_type
status
primary_question_count
attempt_count
correct_count
wrong_count
accuracy
xp_change
started_at
completed_at
```

Session types:

```text
DAILY
FAST
```

---

## 10. Question attempts

Every submitted answer is recorded.

This is important because session results alone do not tell us enough about what happened.

For example:

```text
Q5
attempt 1 → wrong
attempt 2 → correct
```

The attempts table records both.

`is_primary` distinguishes the original session question from a requeued attempt.

---

## 11. Constraints

Important constraints include:

- unique username;
- unique email;
- unique student-question progress pair;
- valid role;
- valid question type;
- valid difficulty;
- foreign keys;
- non-negative XP;
- valid review stage.

Some validation belongs in application code and some belongs in the database.

---

## 12. Indexes

Important query patterns include:

```text
student + review state
student + next review date
student + question
session + attempts
question + active status
```

Indexes should be added for these patterns.

---

## 13. Soft deletion

Questions are not physically deleted during normal administration.

Instead:

```text
is_active = false
```

This preserves historical records.

A retired question may still appear in old session history, but it should not be selected for new practice.

---

## 14. Why we do not store level

Level is a mathematical consequence of XP.

If the threshold table says:

```text
10,000 XP = Level 5
```

then 10,000 XP should always mean Level 5.

There is no need to store another mutable `level` column.
