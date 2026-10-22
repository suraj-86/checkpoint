-- Optional per-answer signals recorded by the V3 practice screen.
ALTER TABLE question_attempts
    ADD COLUMN confidence         VARCHAR(10),
    ADD COLUMN time_taken_seconds INTEGER;

ALTER TABLE question_attempts
    ADD CONSTRAINT ck_question_attempts_confidence
        CHECK (confidence IS NULL OR confidence IN ('GUESS', 'UNSURE', 'SURE'));

ALTER TABLE question_attempts
    ADD CONSTRAINT ck_question_attempts_time_taken
        CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0);
