ALTER TABLE user_settings
    ADD COLUMN daily_session_size INTEGER NOT NULL DEFAULT 10
        CONSTRAINT user_settings_daily_session_size_range CHECK (daily_session_size BETWEEN 5 AND 20);
