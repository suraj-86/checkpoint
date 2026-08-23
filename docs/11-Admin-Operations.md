# Administrator Operations

## 1. Purpose

The administrator controls the learning content used by students.

The admin system is intentionally small.

The administrator does not manage social relationships because there are no social relationships in V1.

---

## 2. Administrator identity

There is exactly one administrator.

The identity is configured by the application owner.

Public registration can never create an administrator.

---

## 3. Dataset workflow

The normal workflow is:

```text
Prepare JSON
    ↓
Upload
    ↓
Validate
    ↓
Read errors
    ↓
Fix file if required
    ↓
Validate again
    ↓
Import
```

---

## 4. Validation

Validation should tell the admin:

- how many questions were received;
- how many are valid;
- how many are invalid;
- what each invalid question is;
- why it is invalid.

Example:

```text
Dataset: Java Core 1.2

Total: 100
Valid: 97
Invalid: 3

JAVA-OOP-021
MCQ must contain exactly four options.

JAVA-COL-044
Explanation is missing.

JAVA-EXC-009
Difficulty is invalid.
```

The admin should not have to inspect server logs to understand the problem.

---

## 5. Import

Import should be transactional.

If all questions are valid:

```text
commit
```

If any problem occurs:

```text
rollback
```

No half-imported dataset should remain.

---

## 6. Existing questions

External IDs allow updates.

Suppose version 1.0 contains:

```text
JAVA-OOP-001
```

Version 1.1 contains the same external ID with an improved explanation.

The importer recognizes it as the same logical question and updates it.

---

## 7. Retiring questions

An admin can retire a question.

Example reasons:

- wrong answer;
- outdated information;
- duplicate;
- poor wording.

Retirement changes:

```text
is_active = false
```

It does not delete the row.

---

## 8. What happens after retirement?

A retired question:

- will not appear in new sessions;
- will not receive new attempts;
- remains visible in historical data;
- keeps old student progress;
- can be restored.

---

## 9. Admin question browser

The browser should support filters:

```text
Topic
Difficulty
Type
Active / Inactive
```

It should use pagination rather than attempting to display the entire question bank on one page.

---

## 10. Operational principle

The admin should manage content through the application rather than manually editing production database rows.

This makes the workflow safer and easier to demonstrate.
