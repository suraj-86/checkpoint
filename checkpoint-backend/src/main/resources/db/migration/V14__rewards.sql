CREATE TABLE reward_items (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind    VARCHAR(10) NOT NULL CHECK (kind IN ('SKIN', 'STICKER')),
    code    VARCHAR(30) NOT NULL UNIQUE,
    name    VARCHAR(60) NOT NULL,
    enabled BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE reward_odds (
    tier        VARCHAR(10) PRIMARY KEY CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD')),
    sticker_pct INT NOT NULL CHECK (sticker_pct BETWEEN 0 AND 100),
    boost_pct   INT NOT NULL CHECK (boost_pct BETWEEN 0 AND 100),
    skin_pct    INT NOT NULL CHECK (skin_pct BETWEEN 0 AND 100),
    CHECK (sticker_pct + boost_pct + skin_pct = 100)
);

CREATE TABLE streak_milestones (
    days    INT PRIMARY KEY CHECK (days > 0),
    tier    VARCHAR(10) NOT NULL CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD')),
    enabled BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE user_chests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    tier        VARCHAR(10) NOT NULL CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD')),
    source      VARCHAR(15) NOT NULL CHECK (source IN ('SESSION_DAILY', 'SESSION_FAST', 'STREAK')),
    source_key  VARCHAR(100) NOT NULL,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    opened_at   TIMESTAMPTZ,
    result_kind VARCHAR(10),
    result_ref  VARCHAR(60),
    UNIQUE (user_id, source_key)
);

CREATE INDEX idx_user_chests_user ON user_chests (user_id, opened_at);

CREATE TABLE user_items (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    item_id  UUID        NOT NULL REFERENCES reward_items (id) ON DELETE CASCADE,
    owned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, item_id)
);

CREATE TABLE user_boosts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('PLUS_5', 'PLUS_10', 'PCT_5', 'PCT_10')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at    TIMESTAMPTZ,
    session_id UUID
);

CREATE INDEX idx_user_boosts_user ON user_boosts (user_id, used_at);

CREATE TABLE user_rewards_loadout (
    user_id           UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    equipped_skin     VARCHAR(30),
    equipped_stickers VARCHAR(200) NOT NULL DEFAULT ''
);

INSERT INTO reward_odds (tier, sticker_pct, boost_pct, skin_pct) VALUES
    ('BRONZE', 70, 30, 0),
    ('SILVER', 55, 35, 10),
    ('GOLD', 40, 30, 30);

INSERT INTO streak_milestones (days, tier) VALUES
    (3, 'BRONZE'), (7, 'BRONZE'), (14, 'SILVER'), (30, 'SILVER'), (60, 'GOLD'), (100, 'GOLD');

INSERT INTO reward_items (kind, code, name) VALUES
    ('SKIN', 'moon', 'Moon Sprout'),
    ('SKIN', 'scholar', 'Scholar Sprout'),
    ('SKIN', 'astro', 'Astro Sprout'),
    ('SKIN', 'autumn', 'Autumn Sprout'),
    ('STICKER', 'star', 'Gold Star'),
    ('STICKER', 'flame', 'Streak Flame'),
    ('STICKER', 'book', 'Open Book'),
    ('STICKER', 'rocket', 'Rocket'),
    ('STICKER', 'leaf', 'Fresh Leaf'),
    ('STICKER', 'coffee', 'Study Coffee'),
    ('STICKER', 'bolt', 'Lightning Bolt'),
    ('STICKER', 'heart', 'Heart'),
    ('STICKER', 'trophy', 'Trophy'),
    ('STICKER', 'moon-sticker', 'Crescent Moon'),
    ('STICKER', 'sun', 'Sunshine'),
    ('STICKER', 'cloud', 'Cloud'),
    ('STICKER', 'gem', 'Gem'),
    ('STICKER', 'crown', 'Crown'),
    ('STICKER', 'shield', 'Shield'),
    ('STICKER', 'target', 'Bullseye'),
    ('STICKER', 'bug', 'Bug Squasher'),
    ('STICKER', 'code', 'Code Brackets'),
    ('STICKER', 'key', 'Golden Key'),
    ('STICKER', 'flag', 'Finish Flag'),
    ('STICKER', 'bell', 'Bell'),
    ('STICKER', 'music', 'Music Note'),
    ('STICKER', 'puzzle', 'Puzzle Piece'),
    ('STICKER', 'anchor', 'Anchor');
