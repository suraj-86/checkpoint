
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_name_key;
CREATE UNIQUE INDEX uq_topics_subject_name ON topics (subject_id, lower(name));

CREATE TABLE user_preferences (
    user_id   UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    stream_id UUID REFERENCES streams (id) ON DELETE SET NULL,
    exam_id   UUID REFERENCES exams (id) ON DELETE SET NULL
);

CREATE TABLE user_subject_preferences (
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, subject_id)
);
CREATE INDEX idx_user_subject_preferences_user ON user_subject_preferences (user_id);
