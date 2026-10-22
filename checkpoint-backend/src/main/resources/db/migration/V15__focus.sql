CREATE TABLE focus_days (
    user_id        UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day            DATE    NOT NULL,
    seconds        INT     NOT NULL DEFAULT 0,
    target_minutes INT     NOT NULL,
    rewarded       BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, day)
);

CREATE TABLE focus_state (
    user_id      UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    last_tick_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE user_settings
    ADD COLUMN daily_focus_minutes INT NOT NULL DEFAULT 120
        CHECK (daily_focus_minutes BETWEEN 15 AND 720);

ALTER TABLE user_chests DROP CONSTRAINT IF EXISTS user_chests_source_check;
ALTER TABLE user_chests ADD CONSTRAINT user_chests_source_check
    CHECK (source IN ('SESSION_DAILY', 'SESSION_FAST', 'STREAK', 'FOCUS'));
