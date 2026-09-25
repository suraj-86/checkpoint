-- Checkpoint: initial schema
-- Mirrors docs/04-Database-Design.md

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at  TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- student_stats  (1:1 with users, STUDENT rows only)
-- ---------------------------------------------------------------------
CREATE TABLE student_stats (
    user_id                   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp                  INT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    current_streak            INT NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak            INT NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_daily_session_date   DATE,
    total_daily_sessions      INT NOT NULL DEFAULT 0,
    total_fast_sessions       INT NOT NULL DEFAULT 0,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------
CREATE TABLE topics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- question_datasets
-- ---------------------------------------------------------------------
CREATE TABLE question_datasets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(150) NOT NULL,
    version      VARCHAR(50)  NOT NULL,
    imported_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, version)
);

-- ---------------------------------------------------------------------
-- questions
-- ---------------------------------------------------------------------
CREATE TABLE questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id     UUID NOT NULL REFERENCES question_datasets(id) ON DELETE RESTRICT,
    external_id    VARCHAR(100) NOT NULL,
    topic_id       UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    subtopic       VARCHAR(100),
    question_type  VARCHAR(30) NOT NULL CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK')),
    difficulty     VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT')),
    question_text  TEXT NOT NULL,
    answer_data    JSONB NOT NULL,
    explanation    TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (dataset_id, external_id)
);

CREATE INDEX idx_questions_active ON questions (is_active);
CREATE INDEX idx_questions_topic ON questions (topic_id);

-- ---------------------------------------------------------------------
-- user_question_progress
-- ---------------------------------------------------------------------
CREATE TABLE user_question_progress (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id           UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    review_state          VARCHAR(20) NOT NULL DEFAULT 'NEW'
                              CHECK (review_state IN ('NEW', 'DUE', 'NEEDS_REVIEW', 'STABLE')),
    review_stage          SMALLINT NOT NULL DEFAULT 1 CHECK (review_stage BETWEEN 1 AND 5),
    next_review_at        TIMESTAMPTZ,
    times_seen            INT NOT NULL DEFAULT 0,
    times_correct         INT NOT NULL DEFAULT 0,
    times_wrong           INT NOT NULL DEFAULT 0,
    consecutive_correct   INT NOT NULL DEFAULT 0,
    consecutive_wrong     INT NOT NULL DEFAULT 0,
    last_answered_at      TIMESTAMPTZ,
    UNIQUE (user_id, question_id)
);

CREATE INDEX idx_uqp_user_review_state ON user_question_progress (user_id, review_state);
CREATE INDEX idx_uqp_user_next_review ON user_question_progress (user_id, next_review_at);

-- ---------------------------------------------------------------------
-- practice_sessions
-- ---------------------------------------------------------------------
CREATE TABLE practice_sessions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type             VARCHAR(10) NOT NULL CHECK (session_type IN ('DAILY', 'FAST')),
    status                   VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'
                                 CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    primary_question_count   INT NOT NULL CHECK (primary_question_count > 0),
    attempt_count            INT NOT NULL DEFAULT 0,
    correct_count            INT NOT NULL DEFAULT 0,
    wrong_count              INT NOT NULL DEFAULT 0,
    accuracy                 NUMERIC(5,2),
    xp_change                INT,
    started_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at             TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON practice_sessions (user_id);

-- ---------------------------------------------------------------------
-- question_attempts
-- ---------------------------------------------------------------------
CREATE TABLE question_attempts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id         UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_primary         BOOLEAN NOT NULL DEFAULT true,
    is_correct         BOOLEAN NOT NULL,
    submitted_answer   JSONB,
    answered_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_session ON question_attempts (session_id);
CREATE INDEX idx_attempts_user_question ON question_attempts (user_id, question_id);
