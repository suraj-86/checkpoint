CREATE TABLE user_topic_interests (
    user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic_id  UUID NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX idx_user_topic_interests_user ON user_topic_interests (user_id);
