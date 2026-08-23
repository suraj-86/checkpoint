# REST API Specification

## 1. Purpose

The API is the boundary between the React frontend and Spring Boot backend.

The API should describe business actions rather than simply exposing database tables.

For example, this is appropriate:

```text
POST /api/practice/daily/start
```

because it represents a user action.

A large collection of generic table CRUD endpoints would expose implementation details unnecessarily.

---

## 2. Authentication

### POST /api/auth/register

Creates a new student.

Request:

```json
{
  "username": "suraj",
  "email": "suraj@example.com",
  "password": "secret"
}
```

The client does not submit a role.

The backend creates:

```text
role = STUDENT
```

---

### POST /api/auth/login

Used by both students and the configured administrator.

The backend determines the account role.

Response includes:

```json
{
  "accessToken": "JWT",
  "user": {
    "id": "uuid",
    "username": "suraj",
    "role": "STUDENT"
  }
}
```

---

## 3. Profile

### GET /api/profile

Returns the authenticated student's profile.

### GET /api/profile/dashboard

Returns aggregated information required by the dashboard.

A single dashboard endpoint avoids forcing the frontend to make many separate requests for one screen.

---

## 4. Practice

### POST /api/practice/daily/start

Creates a Daily Session containing 10 primary questions.

### POST /api/practice/fast/start

Creates Fast Practice.

Example:

```json
{
  "count": 20,
  "topicId": null,
  "difficulty": "HARD",
  "questionType": "MCQ"
}
```

All filters are optional.

---

### GET /api/practice/active

Used to recover an unfinished session after a refresh or accidental navigation.

---

### POST /api/practice/{sessionId}/answer

Example:

```json
{
  "questionId": "uuid",
  "answer": "extends"
}
```

The server:
- verifies the session belongs to the student;
- verifies the question belongs to the session;
- evaluates correctness;
- records the attempt;
- updates review state;
- determines requeue behavior.

---

### POST /api/practice/{sessionId}/complete

Finalizes the session.

The server calculates:
- accuracy;
- XP;
- streak;
- level transition;
- session result.

The client cannot choose any of these values.

---

## 5. Progress

### GET /api/progress

Overall progress.

### GET /api/progress/topics

Topic-level performance.

### GET /api/progress/activity

Activity data for charts.

### GET /api/progress/sessions

Paginated session history.

Example:

```text
?page=0&size=20
```

---

## 6. Topics

### GET /api/topics

Returns active topics available for practice filters.

---

## 7. Administration

All admin endpoints require `ROLE_ADMIN`.

```text
POST  /api/admin/datasets/validate
POST  /api/admin/datasets/import
GET   /api/admin/datasets
GET   /api/admin/questions
PATCH /api/admin/questions/{id}/retire
PATCH /api/admin/questions/{id}/restore
```

---

## 8. Security rules

The backend must never trust:

- client-provided user ID;
- client-provided role;
- client-provided XP;
- client-provided correctness;
- client-provided ownership;
- client-provided level.

The backend derives these values from authenticated identity and server-side data.

---

## 9. DTO principle

Entities are not returned directly.

For example, a question entity may contain the correct answer, but the student-facing DTO must not.

Before answering:

```text
id
question
options
type
difficulty
```

After answering:

```text
correct
correctAnswer
explanation
requeued
```

---

## 10. Errors

Use one predictable error format.

```json
{
  "timestamp": "2026-08-23T21:30:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/auth/register",
  "errors": {
    "email": "Invalid email address"
  }
}
```

This makes frontend error handling consistent.
