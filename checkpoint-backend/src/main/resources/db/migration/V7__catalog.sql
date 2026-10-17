
CREATE TABLE streams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(300),
    sort_order  INT         NOT NULL DEFAULT 0,
    active      BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_streams_name ON streams (lower(name));

CREATE TABLE subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(300),
    sort_order  INT         NOT NULL DEFAULT 0,
    active      BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_subjects_name ON subjects (lower(name));

CREATE TABLE exams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(300),
    sort_order  INT         NOT NULL DEFAULT 0,
    active      BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_exams_name ON exams (lower(name));

CREATE TABLE stream_subjects (
    stream_id  UUID NOT NULL REFERENCES streams (id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    PRIMARY KEY (stream_id, subject_id)
);
CREATE INDEX idx_stream_subjects_subject ON stream_subjects (subject_id);

CREATE TABLE subject_exams (
    subject_id UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    exam_id    UUID NOT NULL REFERENCES exams (id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, exam_id)
);
CREATE INDEX idx_subject_exams_exam ON subject_exams (exam_id);

ALTER TABLE topics
    ADD COLUMN subject_id UUID REFERENCES subjects (id) ON DELETE RESTRICT,
    ADD COLUMN sort_order INT     NOT NULL DEFAULT 0,
    ADD COLUMN active     BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_topics_subject ON topics (subject_id);

INSERT INTO streams (name, description)
VALUES ('Computer Science', 'Programming languages, data structures and core computer science subjects');

INSERT INTO subjects (name)
SELECT DISTINCT ON (lower(name)) name FROM topics ORDER BY lower(name), name;

UPDATE topics t SET subject_id = s.id FROM subjects s WHERE lower(s.name) = lower(t.name);

INSERT INTO stream_subjects (stream_id, subject_id)
SELECT st.id, s.id FROM streams st CROSS JOIN subjects s WHERE lower(st.name) = 'computer science';
