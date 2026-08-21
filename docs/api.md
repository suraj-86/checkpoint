# REST API Endpoints

## 1. Authentication Service (JWT)
* `POST /api/auth/register` - Creates a new student profile.
* `POST /api/auth/login` - Authenticates user and returns JWT.

## 2. Practice Engine (Student Role)
* `GET /api/session/daily` 
  - **Action:** Retrieves 10 questions scheduled for the current date based on the Leitner algorithm.
  - **Returns:** JSON array of question objects (excluding the correct answer).
* `POST /api/session/submit`
  - **Action:** Submits an answer for validation.
  - **Payload:** `{ "questionId": "uuid", "userAnswer": "String" }`
  - **Returns:** Boolean (correct/incorrect) and updates the `user_progress` table.

## 3. Data Ingestion (Admin Role Only)
* `POST /api/admin/datasets/upload`
  - **Action:** Accepts a `.json` file upload.
  - **Process:** Validates structure, parses data, and executes batch `INSERT` statements to the `questions` table.
  - **Returns:** Status 200 OK (Success) or 400 Bad Request (Validation Error with line specifics).