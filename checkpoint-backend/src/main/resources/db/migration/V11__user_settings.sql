CREATE TABLE user_settings (
    user_id       UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    theme         VARCHAR(10) CHECK (theme IN ('MORNING', 'DAWN', 'NIGHT')),
    sound_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
