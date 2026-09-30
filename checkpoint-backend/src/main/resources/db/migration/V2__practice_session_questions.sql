-- Phase 5: a practice session must remember its ordered queue of questions
-- (docs/05-API-Specification.md: "verifies the question belongs to the
-- session"; GET /api/practice/active must be able to resume it; a same-session
-- requeue needs a slot to be inserted into). The V1 schema had no place for
-- this, so it is added here.

CREATE TABLE session_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID    NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    question_id     UUID    NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    queue_position  INT     NOT NULL CHECK (queue_position >= 0),
    is_primary      BOOLEAN NOT NULL,
    answered        BOOLEAN NOT NULL DEFAULT false
);

-- Deliberately NOT unique on (session_id, queue_position): a requeue shifts
-- later slots down by one, and a unique index would reject the intermediate
-- state. The service renumbers positions inside one locked transaction.
CREATE INDEX idx_session_questions_session ON session_questions (session_id, queue_position);

-- At most one unfinished session per student. The service checks first and
-- returns a friendly error; this index is the safety net against two
-- simultaneous "start" requests (e.g. a double click).
CREATE UNIQUE INDEX uq_practice_sessions_one_active_per_user
    ON practice_sessions (user_id) WHERE status = 'IN_PROGRESS';
