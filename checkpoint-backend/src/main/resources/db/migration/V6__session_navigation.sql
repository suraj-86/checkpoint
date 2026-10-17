
ALTER TABLE session_questions
    ADD COLUMN skipped BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE skipped_questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id  UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    skipped_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_skipped_questions_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX idx_skipped_questions_user ON skipped_questions (user_id, skipped_at);
