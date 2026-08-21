# PostgreSQL Database Schema

## 1. Entity Relationship Overview
The database is strictly relational, utilizing UUIDs for primary keys to ensure scalability. 

## 2. Table Definitions

### Table: `users`
Tracks system access and student profile data.
* `id` (UUID, Primary Key)
* `role` (VARCHAR) - Values: 'ADMIN', 'STUDENT'
* `username` (VARCHAR, Unique)
* `password_hash` (VARCHAR)
* `current_streak` (INT) - Defaults to 0
* `created_at` (TIMESTAMP)

### Table: `topics`
Categorizes the ingested datasets.
* `id` (UUID, Primary Key)
* `topic_name` (VARCHAR) - e.g., 'Core Java', 'Data Structures', 'SQL'

### Table: `questions`
The global pool of practice items.
* `id` (UUID, Primary Key)
* `topic_id` (UUID, Foreign Key -> topics.id)
* `question_type` (VARCHAR) - 'MCQ', 'TF', 'FITB'
* `prompt_text` (TEXT) - The actual question/code snippet
* `options` (JSONB) - Stores multiple choice options A, B, C, D
* `correct_answer` (TEXT)
* `explanation` (TEXT)

### Table: `user_progress`
The tracking table that powers the spaced repetition engine.
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key -> users.id)
* `question_id` (UUID, Foreign Key -> questions.id)
* `confidence_level` (INT) - Values: 0, 1, 2, 3
* `next_appearance` (TIMESTAMP) - When this question should be asked again
* `times_answered_correctly` (INT)